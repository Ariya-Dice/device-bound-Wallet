// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/DeviceBoundWallet.sol";

contract DeployScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        // شبیه‌سازی pubKeyHash واقعی (در فرانت‌اند از WebAuthn میاد)
        bytes32 pubKeyHash = keccak256(abi.encodePacked("real-spki-from-browser"));

        DeviceBoundWallet wallet = new DeviceBoundWallet(pubKeyHash, "My Laptop");

        vm.stopBroadcast();
        console.log("Wallet deployed to:", address(wallet));
    }
}