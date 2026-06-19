// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// @title SupplyChainTracker
/// @notice Tracks a physical product from manufacture to final sale (and beyond) as an
///         ERC-721 token. Every change of custody is recorded on-chain as an immutable
///         "transaction" in the product's history, giving manufacturers, logistics
///         partners, retailers and consumers a single source of truth they can use to
///         verify authenticity and combat counterfeiting.
/// @dev Roles:
///      - DEFAULT_ADMIN_ROLE: onboards/removes manufacturers, shippers and retailers.
///      - MANUFACTURER_ROLE:  mints new products (registers them on-chain).
///      - SHIPPER_ROLE:       records pickup / in-transit checkpoints.
///      - RETAILER_ROLE:      records receipt at retail and the final sale to a consumer.
///      Once a product is sold, the NFT lives in the consumer's wallet like any other
///      ERC-721 token. Any subsequent wallet-to-wallet transfer (e.g. a resale) is
///      automatically appended to the on-chain history too, so the provenance trail
///      never breaks.
contract SupplyChainTracker is ERC721, AccessControl {
    using Strings for uint256;
    using Strings for address;

    // ---------------------------------------------------------------------
    // Roles
    // ---------------------------------------------------------------------

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant SHIPPER_ROLE = keccak256("SHIPPER_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    // ---------------------------------------------------------------------
    // Data model
    // ---------------------------------------------------------------------

    /// @notice Lifecycle stage of a product. Stages move forward only.
    enum Stage {
        Manufactured, // 0 - minted by a manufacturer, still in their possession
        InTransit, // 1 - picked up / moving through one or more shippers
        Delivered, // 2 - received and checked in by a retailer
        Sold // 3 - sold to and held by the end consumer
    }

    struct Product {
        string name;
        string serialNumber;
        string origin;
        address manufacturer;
        address currentHolder; // current custodian in the chain (pre-sale)
        uint64 manufacturedAt;
        Stage stage;
        bool exists;
    }

    /// @notice A single immutable checkpoint in a product's life.
    struct TrackingEvent {
        Stage stage;
        address actor;
        string location;
        string notes;
        uint64 timestamp;
    }

    uint256 private _nextTokenId = 1;

    mapping(uint256 tokenId => Product) public products;
    mapping(uint256 tokenId => TrackingEvent[]) private _history;
    mapping(bytes32 serialHash => bool used) private _serialUsed;

    /// @dev Guards the automatic "resale" logging in {_update} so the explicit
    ///      {sellToConsumer} transfer isn't double-logged.
    bool private _controlledTransferInProgress;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event ProductRegistered(
        uint256 indexed tokenId, string serialNumber, address indexed manufacturer, uint256 timestamp
    );
    event StageUpdated(
        uint256 indexed tokenId, Stage stage, address indexed actor, string location, string notes, uint256 timestamp
    );
    event ProductSold(uint256 indexed tokenId, address indexed retailer, address indexed consumer, uint256 timestamp);
    event OwnershipTransferLogged(uint256 indexed tokenId, address indexed from, address indexed to, uint256 timestamp);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error EmptySerialNumber();
    error SerialAlreadyRegistered(string serialNumber);
    error ProductDoesNotExist(uint256 tokenId);
    error InvalidStageTransition(uint256 tokenId, Stage currentStage, Stage requiredStage);
    error NotCurrentHolder(uint256 tokenId, address expected, address caller);
    error ConsumerIsZeroAddress();

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address admin) ERC721("SupplyChainTracker", "SCT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------------------------------------------------------------------
    // Manufacturer actions
    // ---------------------------------------------------------------------

    /// @notice Registers a brand-new physical product on-chain and mints its NFT to the
    ///         manufacturer. The serial number must be globally unique, which prevents the
    ///         same physical serial from being registered twice (a common counterfeiting
    ///         vector).
    function mintProduct(string calldata name_, string calldata serialNumber_, string calldata origin_)
        external
        onlyRole(MANUFACTURER_ROLE)
        returns (uint256 tokenId)
    {
        if (bytes(serialNumber_).length == 0) revert EmptySerialNumber();

        bytes32 serialHash = keccak256(bytes(serialNumber_));
        if (_serialUsed[serialHash]) revert SerialAlreadyRegistered(serialNumber_);
        _serialUsed[serialHash] = true;

        tokenId = _nextTokenId++;

        products[tokenId] = Product({
            name: name_,
            serialNumber: serialNumber_,
            origin: origin_,
            manufacturer: msg.sender,
            currentHolder: msg.sender,
            manufacturedAt: uint64(block.timestamp),
            stage: Stage.Manufactured,
            exists: true
        });

        _controlledTransferInProgress = true;
        _safeMint(msg.sender, tokenId);
        _controlledTransferInProgress = false;

        _pushHistory(tokenId, Stage.Manufactured, msg.sender, origin_, "Product manufactured and registered");

        emit ProductRegistered(tokenId, serialNumber_, msg.sender, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Shipper actions
    // ---------------------------------------------------------------------

    /// @notice Records that a shipper has picked the product up from the manufacturer.
    function recordPickup(uint256 tokenId, string calldata location_, string calldata notes_)
        external
        onlyRole(SHIPPER_ROLE)
    {
        Product storage product = _requireProduct(tokenId);
        if (product.stage != Stage.Manufactured) {
            revert InvalidStageTransition(tokenId, product.stage, Stage.Manufactured);
        }

        product.stage = Stage.InTransit;
        product.currentHolder = msg.sender;

        _pushHistory(tokenId, Stage.InTransit, msg.sender, location_, notes_);
        emit StageUpdated(tokenId, Stage.InTransit, msg.sender, location_, notes_, block.timestamp);
    }

    /// @notice Records an intermediate checkpoint while the product is in transit
    ///         (e.g. a warehouse scan, port of entry, or customs clearance). Can be
    ///         called as many times as needed by any address holding the shipper role.
    function recordTransitCheckpoint(uint256 tokenId, string calldata location_, string calldata notes_)
        external
        onlyRole(SHIPPER_ROLE)
    {
        Product storage product = _requireProduct(tokenId);
        if (product.stage != Stage.InTransit) {
            revert InvalidStageTransition(tokenId, product.stage, Stage.InTransit);
        }

        product.currentHolder = msg.sender;

        _pushHistory(tokenId, Stage.InTransit, msg.sender, location_, notes_);
        emit StageUpdated(tokenId, Stage.InTransit, msg.sender, location_, notes_, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Retailer actions
    // ---------------------------------------------------------------------

    /// @notice Records that a retailer has received and checked in the product.
    function recordRetailerReceipt(uint256 tokenId, string calldata location_, string calldata notes_)
        external
        onlyRole(RETAILER_ROLE)
    {
        Product storage product = _requireProduct(tokenId);
        if (product.stage != Stage.InTransit) {
            revert InvalidStageTransition(tokenId, product.stage, Stage.InTransit);
        }

        product.stage = Stage.Delivered;
        product.currentHolder = msg.sender;

        _pushHistory(tokenId, Stage.Delivered, msg.sender, location_, notes_);
        emit StageUpdated(tokenId, Stage.Delivered, msg.sender, location_, notes_, block.timestamp);
    }

    /// @notice Finalizes the sale by transferring the actual NFT to the consumer's
    ///         wallet. From this point on the consumer holds a tradeable certificate of
    ///         authenticity that carries the product's full history with it.
    function sellToConsumer(uint256 tokenId, address consumer, string calldata notes_)
        external
        onlyRole(RETAILER_ROLE)
    {
        if (consumer == address(0)) revert ConsumerIsZeroAddress();

        Product storage product = _requireProduct(tokenId);
        if (product.stage != Stage.Delivered) {
            revert InvalidStageTransition(tokenId, product.stage, Stage.Delivered);
        }
        if (product.currentHolder != msg.sender) {
            revert NotCurrentHolder(tokenId, product.currentHolder, msg.sender);
        }

        product.stage = Stage.Sold;
        product.currentHolder = consumer;

        address currentOwner = ownerOf(tokenId);
        _controlledTransferInProgress = true;
        _update(consumer, tokenId, currentOwner);
        _controlledTransferInProgress = false;

        _pushHistory(tokenId, Stage.Sold, msg.sender, "Point of sale", notes_);
        emit StageUpdated(tokenId, Stage.Sold, msg.sender, "Point of sale", notes_, block.timestamp);
        emit ProductSold(tokenId, msg.sender, consumer, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Public / consumer-facing views
    // ---------------------------------------------------------------------

    /// @notice Returns true if `serialNumber_` has already been registered by a
    ///         manufacturer. Useful for spotting a duplicate/cloned serial off-chain.
    function isSerialRegistered(string calldata serialNumber_) external view returns (bool) {
        return _serialUsed[keccak256(bytes(serialNumber_))];
    }

    /// @notice Returns the full, ordered custody history of a product.
    function getHistory(uint256 tokenId) external view returns (TrackingEvent[] memory) {
        _requireProductView(tokenId);
        return _history[tokenId];
    }

    /// @notice Convenience check used to verify a product is genuine: it must exist on
    ///         this contract and the serial number supplied must match what was
    ///         registered for that token.
    function verifyAuthenticity(uint256 tokenId, string calldata serialNumber_)
        external
        view
        returns (bool isAuthentic, Stage stage, address manufacturer)
    {
        Product memory product = products[tokenId];
        if (!product.exists) {
            return (false, Stage.Manufactured, address(0));
        }
        bool matches = keccak256(bytes(product.serialNumber)) == keccak256(bytes(serialNumber_));
        return (matches, product.stage, product.manufacturer);
    }

    function getProduct(uint256 tokenId) external view returns (Product memory) {
        _requireProductView(tokenId);
        return products[tokenId];
    }

    function totalProducts() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ---------------------------------------------------------------------
    // On-chain metadata
    // ---------------------------------------------------------------------

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireProductView(tokenId);
        Product memory product = products[tokenId];

        bytes memory json = abi.encodePacked(
            '{"name":"',
            product.name,
            ' #',
            tokenId.toString(),
            '","description":"Supply chain certificate of authenticity. Serial: ',
            product.serialNumber,
            '. Origin: ',
            product.origin,
            '","attributes":[',
            '{"trait_type":"Stage","value":"',
            _stageLabel(product.stage),
            '"},',
            '{"trait_type":"Manufacturer","value":"',
            Strings.toHexString(uint160(product.manufacturer), 20),
            '"},',
            '{"trait_type":"Serial Number","value":"',
            product.serialNumber,
            '"}',
            ']}'
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ---------------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------------

    function _requireProduct(uint256 tokenId) internal view returns (Product storage) {
        Product storage product = products[tokenId];
        if (!product.exists) revert ProductDoesNotExist(tokenId);
        return product;
    }

    function _requireProductView(uint256 tokenId) internal view {
        if (!products[tokenId].exists) revert ProductDoesNotExist(tokenId);
    }

    function _pushHistory(uint256 tokenId, Stage stage_, address actor, string memory location_, string memory notes_)
        internal
    {
        _history[tokenId].push(
            TrackingEvent({
                stage: stage_,
                actor: actor,
                location: location_,
                notes: notes_,
                timestamp: uint64(block.timestamp)
            })
        );
    }

    function _stageLabel(Stage stage_) internal pure returns (string memory) {
        if (stage_ == Stage.Manufactured) return "Manufactured";
        if (stage_ == Stage.InTransit) return "In Transit";
        if (stage_ == Stage.Delivered) return "Delivered to Retailer";
        return "Sold to Consumer";
    }

    /// @dev OZ v5 core transfer hook (covers mint, burn, and every transfer). We use it
    ///      to automatically append a history entry whenever the NFT changes wallets
    ///      *after* it has been sold, e.g. a consumer reselling the item peer-to-peer.
    ///      Transfers driven by our own controlled functions (mint, sellToConsumer) set
    ///      `_controlledTransferInProgress` so they aren't double-logged here.
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = super._update(to, tokenId, auth);

        if (!_controlledTransferInProgress && from != address(0) && to != address(0)) {
            products[tokenId].currentHolder = to;
            _pushHistory(tokenId, Stage.Sold, to, "Secondary transfer", "Ownership transferred peer-to-peer");
            emit OwnershipTransferLogged(tokenId, from, to, block.timestamp);
        }

        return from;
    }
}
