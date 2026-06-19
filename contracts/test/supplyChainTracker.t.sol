// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";

contract SupplyChainTrackerTest is Test {
    SupplyChainTracker internal tracker;

    address internal admin = makeAddr("admin");
    address internal manufacturer = makeAddr("manufacturer");
    address internal shipper = makeAddr("shipper");
    address internal retailer = makeAddr("retailer");
    address internal consumer = makeAddr("consumer");
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        tracker = new SupplyChainTracker(admin);

        vm.startPrank(admin);
        tracker.grantRole(tracker.MANUFACTURER_ROLE(), manufacturer);
        tracker.grantRole(tracker.SHIPPER_ROLE(), shipper);
        tracker.grantRole(tracker.RETAILER_ROLE(), retailer);
        vm.stopPrank();
    }

    // ---------------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------------

    function test_MintProduct_RegistersProductAndMintsNft() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Leather Wallet", "SN-001", "Nairobi, Kenya");

        assertEq(tokenId, 1);
        assertEq(tracker.ownerOf(tokenId), manufacturer);
        assertTrue(tracker.isSerialRegistered("SN-001"));

        SupplyChainTracker.Product memory product = tracker.getProduct(tokenId);
        assertEq(product.name, "Leather Wallet");
        assertEq(product.serialNumber, "SN-001");
        assertEq(product.manufacturer, manufacturer);
        assertEq(product.currentHolder, manufacturer);
        assertEq(uint8(product.stage), uint8(SupplyChainTracker.Stage.Manufactured));
    }

    function test_MintProduct_RevertsForNonManufacturer() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, tracker.MANUFACTURER_ROLE()
            )
        );
        tracker.mintProduct("Fake Watch", "SN-FAKE", "Unknown");
    }

    function test_MintProduct_RevertsOnDuplicateSerial() public {
        vm.prank(manufacturer);
        tracker.mintProduct("Sneakers", "SN-100", "Nairobi");

        vm.prank(manufacturer);
        vm.expectRevert(abi.encodeWithSelector(SupplyChainTracker.SerialAlreadyRegistered.selector, "SN-100"));
        tracker.mintProduct("Counterfeit Sneakers", "SN-100", "Unknown");
    }

    function test_MintProduct_RevertsOnEmptySerial() public {
        vm.prank(manufacturer);
        vm.expectRevert(SupplyChainTracker.EmptySerialNumber.selector);
        tracker.mintProduct("Mystery Box", "", "Nairobi");
    }

    // ---------------------------------------------------------------------
    // Full happy-path lifecycle
    // ---------------------------------------------------------------------

    function test_FullLifecycle_FromManufactureToConsumerSale() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Coffee Beans", "SN-200", "Kiambu, Kenya");

        vm.prank(shipper);
        tracker.recordPickup(tokenId, "Kiambu Warehouse", "Picked up from manufacturer");

        vm.prank(shipper);
        tracker.recordTransitCheckpoint(tokenId, "JKIA Cargo Terminal", "Cleared customs");

        vm.prank(retailer);
        tracker.recordRetailerReceipt(tokenId, "Westgate Mall Store", "Received and shelved");

        vm.prank(retailer);
        tracker.sellToConsumer(tokenId, consumer, "Sold at checkout, receipt #4521");

        SupplyChainTracker.Product memory product = tracker.getProduct(tokenId);
        assertEq(uint8(product.stage), uint8(SupplyChainTracker.Stage.Sold));
        assertEq(product.currentHolder, consumer);
        assertEq(tracker.ownerOf(tokenId), consumer);

        SupplyChainTracker.TrackingEvent[] memory history = tracker.getHistory(tokenId);
        assertEq(history.length, 5);
        assertEq(uint8(history[0].stage), uint8(SupplyChainTracker.Stage.Manufactured));
        assertEq(uint8(history[1].stage), uint8(SupplyChainTracker.Stage.InTransit));
        assertEq(uint8(history[2].stage), uint8(SupplyChainTracker.Stage.InTransit));
        assertEq(uint8(history[3].stage), uint8(SupplyChainTracker.Stage.Delivered));
        assertEq(uint8(history[4].stage), uint8(SupplyChainTracker.Stage.Sold));
        assertEq(history[4].actor, retailer);
    }

    function test_VerifyAuthenticity_ReturnsTrueForGenuineProduct() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Watch", "SN-300", "Nairobi");

        (bool isAuthentic, SupplyChainTracker.Stage stage, address mfg) = tracker.verifyAuthenticity(tokenId, "SN-300");
        assertTrue(isAuthentic);
        assertEq(uint8(stage), uint8(SupplyChainTracker.Stage.Manufactured));
        assertEq(mfg, manufacturer);
    }

    function test_VerifyAuthenticity_ReturnsFalseForMismatchedSerial() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Watch", "SN-301", "Nairobi");

        (bool isAuthentic,,) = tracker.verifyAuthenticity(tokenId, "SN-WRONG");
        assertFalse(isAuthentic);
    }

    // ---------------------------------------------------------------------
    // Stage-transition guards
    // ---------------------------------------------------------------------

    function test_RecordPickup_RevertsIfNotYetManufacturedStage() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Bag", "SN-400", "Nairobi");

        vm.prank(shipper);
        tracker.recordPickup(tokenId, "Warehouse", "ok");

        vm.prank(shipper);
        vm.expectRevert(
            abi.encodeWithSelector(
                SupplyChainTracker.InvalidStageTransition.selector,
                tokenId,
                SupplyChainTracker.Stage.InTransit,
                SupplyChainTracker.Stage.Manufactured
            )
        );
        tracker.recordPickup(tokenId, "Warehouse", "ok");
    }

    function test_SellToConsumer_RevertsIfNotDeliveredYet() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Bag", "SN-401", "Nairobi");

        vm.prank(retailer);
        vm.expectRevert(
            abi.encodeWithSelector(
                SupplyChainTracker.InvalidStageTransition.selector,
                tokenId,
                SupplyChainTracker.Stage.Manufactured,
                SupplyChainTracker.Stage.Delivered
            )
        );
        tracker.sellToConsumer(tokenId, consumer, "too early");
    }

    function test_SellToConsumer_RevertsIfCallerIsNotCurrentHolder() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Bag", "SN-402", "Nairobi");

        vm.prank(shipper);
        tracker.recordPickup(tokenId, "Warehouse", "ok");

        vm.prank(retailer);
        tracker.recordRetailerReceipt(tokenId, "Store", "ok");

        address otherRetailer = makeAddr("otherRetailer");
        vm.prank(admin);
        tracker.grantRole(tracker.RETAILER_ROLE(), otherRetailer);

        vm.prank(otherRetailer);
        vm.expectRevert(
            abi.encodeWithSelector(SupplyChainTracker.NotCurrentHolder.selector, tokenId, retailer, otherRetailer)
        );
        tracker.sellToConsumer(tokenId, consumer, "not mine to sell");
    }

    function test_ActionsOnNonexistentProduct_Revert() public {
        vm.prank(shipper);
        vm.expectRevert(abi.encodeWithSelector(SupplyChainTracker.ProductDoesNotExist.selector, 999));
        tracker.recordPickup(999, "Nowhere", "n/a");
    }

    // ---------------------------------------------------------------------
    // Secondary market transfers are still logged
    // ---------------------------------------------------------------------

    function test_SecondaryTransfer_IsAutomaticallyLoggedInHistory() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Sunglasses", "SN-500", "Nairobi");

        vm.prank(shipper);
        tracker.recordPickup(tokenId, "Warehouse", "ok");
        vm.prank(retailer);
        tracker.recordRetailerReceipt(tokenId, "Store", "ok");
        vm.prank(retailer);
        tracker.sellToConsumer(tokenId, consumer, "sold");

        address secondBuyer = makeAddr("secondBuyer");
        vm.prank(consumer);
        tracker.transferFrom(consumer, secondBuyer, tokenId);

        assertEq(tracker.ownerOf(tokenId), secondBuyer);

        SupplyChainTracker.TrackingEvent[] memory history = tracker.getHistory(tokenId);
        assertEq(history.length, 5);
        assertEq(history[4].actor, secondBuyer);

        SupplyChainTracker.Product memory product = tracker.getProduct(tokenId);
        assertEq(product.currentHolder, secondBuyer);
    }

    // ---------------------------------------------------------------------
    // Access control administration
    // ---------------------------------------------------------------------

    function test_Admin_CanGrantAndRevokeRoles() public {
        address newShipper = makeAddr("newShipper");
        assertFalse(tracker.hasRole(tracker.SHIPPER_ROLE(), newShipper));

        vm.prank(admin);
        tracker.grantRole(tracker.SHIPPER_ROLE(), newShipper);
        assertTrue(tracker.hasRole(tracker.SHIPPER_ROLE(), newShipper));

        vm.prank(admin);
        tracker.revokeRole(tracker.SHIPPER_ROLE(), newShipper);
        assertFalse(tracker.hasRole(tracker.SHIPPER_ROLE(), newShipper));
    }

    function test_NonAdmin_CannotGrantRoles() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, tracker.DEFAULT_ADMIN_ROLE()
            )
        );
        tracker.grantRole(tracker.MANUFACTURER_ROLE(), stranger);
    }

    // ---------------------------------------------------------------------
    // Metadata & interfaces
    // ---------------------------------------------------------------------

    function test_TokenURI_ReturnsBase64EncodedJson() public {
        vm.prank(manufacturer);
        uint256 tokenId = tracker.mintProduct("Backpack", "SN-600", "Nairobi");

        string memory uri = tracker.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);

        bytes memory prefix = bytes("data:application/json;base64,");
        bytes memory uriBytes = bytes(uri);
        for (uint256 i = 0; i < prefix.length; i++) {
            assertEq(uriBytes[i], prefix[i]);
        }
    }

    function test_SupportsInterface_ERC721AndAccessControl() public view {
        assertTrue(tracker.supportsInterface(0x80ac58cd)); // ERC721
        assertTrue(tracker.supportsInterface(0x7965db0b)); // AccessControl
    }
}
