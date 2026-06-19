// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";

/// @notice Deploys SupplyChainTracker and optionally grants the manufacturer, shipper
///         and retailer roles to addresses supplied via environment variables.
///
/// Usage (local Anvil):
///   forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 \
///     --private-key $PRIVATE_KEY --broadcast
///
/// Usage (testnet, e.g. Sepolia):
///   forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL \
///     --private-key $PRIVATE_KEY --broadcast --verify
///
/// Optional env vars to auto-grant roles on deploy:
///   MANUFACTURER_ADDRESS, SHIPPER_ADDRESS, RETAILER_ADDRESS
contract Deploy is Script {
    function run() external returns (SupplyChainTracker tracker) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        tracker = new SupplyChainTracker(deployer);
        console2.log("SupplyChainTracker deployed at:", address(tracker));
        console2.log("Admin:", deployer);

        address manufacturerAddr = vm.envOr("MANUFACTURER_ADDRESS", address(0));
        if (manufacturerAddr != address(0)) {
            tracker.grantRole(tracker.MANUFACTURER_ROLE(), manufacturerAddr);
            console2.log("Granted MANUFACTURER_ROLE to:", manufacturerAddr);
        }

        address shipperAddr = vm.envOr("SHIPPER_ADDRESS", address(0));
        if (shipperAddr != address(0)) {
            tracker.grantRole(tracker.SHIPPER_ROLE(), shipperAddr);
            console2.log("Granted SHIPPER_ROLE to:", shipperAddr);
        }

        address retailerAddr = vm.envOr("RETAILER_ADDRESS", address(0));
        if (retailerAddr != address(0)) {
            tracker.grantRole(tracker.RETAILER_ROLE(), retailerAddr);
            console2.log("Granted RETAILER_ROLE to:", retailerAddr);
        }

        vm.stopBroadcast();
    }
}
