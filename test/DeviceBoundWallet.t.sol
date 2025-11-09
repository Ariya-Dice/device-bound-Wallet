// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DeviceBoundWallet.sol";

contract DeviceBoundWalletTest is Test {
    DeviceBoundWallet wallet;
    address deployer = address(0x1);
    address device1 = address(0x2);
    address device2 = address(0x3);
    address bob = address(0x456);

    bytes32 constant PRIMARY_HASH = keccak256("primary-spki");
    bytes32 constant DEVICE1_HASH = keccak256("device1-spki");
    bytes32 constant DEVICE2_HASH = keccak256("device2-spki");
    bytes32 constant INVALID_HASH = keccak256("invalid");

    function setUp() public {
        vm.prank(deployer);
        wallet = new DeviceBoundWallet(PRIMARY_HASH, "Laptop");
    }

    // ====================== 1. Initial State ======================
    function test_InitialDevice() public {
        assertEq(wallet.deviceCount(), 1);
        assertEq(wallet.WALLET_ID(), PRIMARY_HASH);
        assertTrue(wallet.devices(PRIMARY_HASH).active);
        assertEq(wallet.devices(PRIMARY_HASH).label(), "Laptop");
        assertEq(wallet.OWNER(), deployer);
    }

    // ====================== 2. Add Device ======================
    function test_AddDevice_Success() public {
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        assertEq(wallet.deviceCount(), 2);
        assertTrue(wallet.devices(DEVICE1_HASH).active);
        assertEq(wallet.devices(DEVICE1_HASH).label(), "Phone");
    }

    function test_AddDevice_MaxDevices() public {
        vm.startPrank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");
        wallet.addDevice(DEVICE2_HASH, "Tablet");

        vm.expectRevert("Max devices");
        wallet.addDevice(INVALID_HASH, "Watch");
        vm.stopPrank();
    }

    function test_AddDevice_AlreadyExists() public {
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        vm.expectRevert("Exists");
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Duplicate");
    }

    function test_AddDevice_Unauthorized() public {
        vm.expectRevert("Unauthorized");
        vm.prank(bob);
        wallet.addDevice(DEVICE1_HASH, "Unauthorized");
    }

    // ====================== 3. Execute Transaction ======================
    function test_Execute_Success() public {
        // Register device
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        // Fund wallet
        vm.deal(address(wallet), 1 ether);

        // Create tx
        bytes32 txHash = keccak256("send 0.1 ETH to bob");
        bytes32 nonce = keccak256(abi.encodePacked(txHash, block.timestamp));

        // Sign with device1 private key (simulate WebAuthn)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(device1)), txHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        // Verify pubKeyHash
        address recovered = ECDSA.recover(txHash, sig);
        bytes32 recoveredHash = keccak256(abi.encodePacked(recovered));
        assertEq(recoveredHash, DEVICE1_HASH);

        // Execute
        vm.prank(device1);
        wallet.execute(sig, DEVICE1_HASH, txHash, nonce, bob, 0.1 ether);

        assertEq(bob.balance, 0.1 ether);
    }

    function test_Execute_InvalidSignature() public {
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        vm.deal(address(wallet), 1 ether);

        bytes32 txHash = keccak256("tx");
        bytes32 nonce = keccak256("nonce");
        bytes memory invalidSig = new bytes(65); // all zero

        vm.expectRevert("Invalid sig");
        vm.prank(device1);
        wallet.execute(invalidSig, DEVICE1_HASH, txHash, nonce, bob, 0.1 ether);
    }

    function test_Execute_WrongDeviceHash() public {
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        vm.deal(address(wallet), 1 ether);

        bytes32 txHash = keccak256("tx");
        bytes32 nonce = keccak256("nonce");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(device1)), txHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.expectRevert("Wrong device");
        vm.prank(device1);
        wallet.execute(sig, INVALID_HASH, txHash, nonce, bob, 0.1 ether);
    }

    function test_Execute_ReplayAttack() public {
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        vm.deal(address(wallet), 1 ether);

        bytes32 txHash = keccak256("tx");
        bytes32 nonce = keccak256("nonce");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(device1)), txHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        // First execution
        vm.prank(device1);
        wallet.execute(sig, DEVICE1_HASH, txHash, nonce, bob, 0.1 ether);

        // Replay
        vm.expectRevert("Nonce used");
        vm.prank(device1);
        wallet.execute(sig, DEVICE1_HASH, txHash, nonce, bob, 0.1 ether);
    }

    function test_Execute_InsufficientBalance() public {
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        bytes32 txHash = keccak256("tx");
        bytes32 nonce = keccak256("nonce");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(device1)), txHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.expectRevert("Tx failed");
        vm.prank(device1);
        wallet.execute(sig, DEVICE1_HASH, txHash, nonce, bob, 1 ether);
    }

    // ====================== 4. Reconnect Verify (view) ======================
    function test_ReconnectVerify_Success() public view {
        bytes32 challengeHash = keccak256("reconnect-challenge");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(deployer)), challengeHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        bool ok = wallet.reconnectVerify(sig, PRIMARY_HASH, challengeHash);
        assertTrue(ok);
    }

    function test_ReconnectVerify_InvalidDevice() public view {
        bytes32 challengeHash = keccak256("challenge");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(bob)), challengeHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        bool ok = wallet.reconnectVerify(sig, INVALID_HASH, challengeHash);
        assertFalse(ok);
    }

    function test_ReconnectVerify_InvalidSignature() public view {
        bytes32 challengeHash = keccak256("challenge");
        bytes memory invalidSig = new bytes(65);

        bool ok = wallet.reconnectVerify(invalidSig, PRIMARY_HASH, challengeHash);
        assertFalse(ok);
    }

    // ====================== 5. Reconnect And Announce ======================
    function test_ReconnectAndAnnounce_Success() public {
        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        bytes32 challengeHash = keccak256("reconnect");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(device1)), challengeHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        uint256 before = wallet.lastReconnectTimestamp(DEVICE1_HASH);

        vm.prank(device1);
        bool success = wallet.reconnectAndAnnounce(sig, DEVICE1_HASH, challengeHash);

        assertTrue(success);
        assertGt(wallet.lastReconnectTimestamp(DEVICE1_HASH), before);
    }

    function test_ReconnectAndAnnounce_Unauthorized() public {
        bytes32 challengeHash = keccak256("challenge");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(bob)), challengeHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.expectRevert("Unauthorized");
        vm.prank(bob);
        wallet.reconnectAndAnnounce(sig, INVALID_HASH, challengeHash);
    }

    // ====================== 6. Fuzz Tests ======================
    function testFuzz_Execute(uint256 value) public {
        vm.assume(value <= 1 ether);

        vm.prank(deployer);
        wallet.addDevice(DEVICE1_HASH, "Phone");

        vm.deal(address(wallet), 1 ether);

        bytes32 txHash = keccak256(abi.encode("fuzz tx", value));
        bytes32 nonce = keccak256(abi.encode(txHash, block.timestamp));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(device1)), txHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(device1);
        wallet.execute(sig, DEVICE1_HASH, txHash, nonce, bob, value);

        assertEq(bob.balance, value);
    }

    // ====================== 7. Events ======================
    function test_Events() public {
        vm.prank(deployer);
        vm.expectEmit(true, false, false, true);
        emit DeviceBoundWallet.DeviceRegistered(DEVICE1_HASH, "Phone");
        wallet.addDevice(DEVICE1_HASH, "Phone");

        vm.deal(address(wallet), 1 ether);
        bytes32 txHash = keccak256("tx");
        bytes32 nonce = keccak256("nonce");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(deployer)), txHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.expectEmit(true, true, false, true);
        emit DeviceBoundWallet.TransactionExecuted(txHash, bob, 0.1 ether);
        vm.prank(deployer);
        wallet.execute(sig, PRIMARY_HASH, txHash, nonce, bob, 0.1 ether);
    }

    // ====================== 8. Receive ETH ======================
    function test_ReceiveETH() public {
        (bool success, ) = address(wallet).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(wallet).balance, 1 ether);
    }
}