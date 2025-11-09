// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library ECDSA {
    function recover(bytes32 hash, bytes memory sig) internal pure returns (address) {
        if (sig.length != 65) return address(0);
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        return ecrecover(hash, v, r, s);
    }
}

contract DeviceBoundWallet {
    uint256 public constant MAX_DEVICES = 3;
    address payable public immutable OWNER;
    bytes32 public immutable WALLET_ID;

    uint256 public deviceCount;
    mapping(bytes32 => Device) public devices;
    mapping(bytes32 => bool) public usedNonces;

    struct Device {
        bytes32 pubKeyHash;
        string label;
        bool active;
    }

    event DeviceRegistered(bytes32 indexed pubKeyHash, string label);
    event TransactionExecuted(bytes32 indexed txHash, address to, uint value);

    modifier onlyRegistered(bytes32 pubKeyHash) {
        _checkRegistered(pubKeyHash);
        _;
    }

    modifier validNonce(bytes32 nonce) {
        _checkNonceBefore(nonce);
        _;
        _checkNonceAfter(nonce);
    }

    constructor(bytes32 primaryPubKeyHash, string memory label) payable {
        require(primaryPubKeyHash != bytes32(0), "Invalid pubkey");

        OWNER = payable(msg.sender);
        WALLET_ID = primaryPubKeyHash;

        devices[primaryPubKeyHash] = Device({
            pubKeyHash: primaryPubKeyHash,
            label: label,
            active: true
        });
        deviceCount = 1;

        emit DeviceRegistered(primaryPubKeyHash, label);
    }

    function addDevice(bytes32 pubKeyHash, string calldata label)
        external
        onlyRegistered(pubKeyHash)
    {
        require(deviceCount < MAX_DEVICES, "Max devices");
        require(!devices[pubKeyHash].active, "Exists");

        devices[pubKeyHash] = Device({
            pubKeyHash: pubKeyHash,
            label: label,
            active: true
        });
        deviceCount++;

        emit DeviceRegistered(pubKeyHash, label);
    }

    function execute(
        bytes calldata signature,
        bytes32 pubKeyHash,
        bytes32 txHash,
        bytes32 nonce,
        address to,
        uint256 value
    )
        external
        onlyRegistered(pubKeyHash)
        validNonce(nonce)
    {
        address signer = ECDSA.recover(txHash, signature);
        require(signer != address(0), "Invalid sig");
        require(keccak256(abi.encodePacked(signer)) == pubKeyHash, "Wrong device");

        (bool success, ) = to.call{value: value}("");
        require(success, "Tx failed");

        emit TransactionExecuted(txHash, to, value);
    }

    // ============ Internal Helpers ============

    function _checkRegistered(bytes32 pubKeyHash) internal view {
        require(devices[pubKeyHash].active, "Unauthorized");
    }

    function _checkNonceBefore(bytes32 nonce) internal view {
        require(!usedNonces[nonce], "Nonce used");
    }

    function _checkNonceAfter(bytes32 nonce) internal {
        usedNonces[nonce] = true;
    }

    receive() external payable {}
}