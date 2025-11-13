// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IAcrossSpokePool {
    function deposit(
        address recipient,
        address originToken,
        uint256 amount,
        uint256 destinationChainId,
        int64 relayerFeePct,
        uint32 quoteTimestamp,
        bytes memory message,
        uint256 maxCount
    ) external payable;
}

interface ILayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;
}

interface IWormhole {
    function transferTokens(
        address token,
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient,
        uint256 arbiterFee,
        uint32 nonce
    ) external payable returns (uint64 sequence);
}

contract BridgeGateway {
    address public immutable walletContract;
    address public constant ACROSS_SPOKE_POOL = 0x4D9079Bb4165aeb4084c526a32695dCfd2F77381;
    address public constant LAYERZERO_ENDPOINT = 0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675;
    address public constant WORMHOLE = 0x98f3c9e331E4baEb3dcFb3C94c1CC3Bc0A1C06FC;

    event BridgeInitiated(address indexed token, uint256 amount, uint256 destinationChainId, string bridge);

    modifier onlyWallet() {
        require(msg.sender == walletContract, "Only wallet");
        _;
    }

    constructor(address _walletContract) {
        walletContract = _walletContract;
    }

    function bridgeToL2Across(
        address token,
        uint256 amount,
        uint256 destinationChainId,
        address recipient,
        int64 relayerFeePct
    ) external onlyWallet {
        IERC20(token).transferFrom(walletContract, address(this), amount);
        IERC20(token).approve(ACROSS_SPOKE_POOL, amount);

        IAcrossSpokePool(ACROSS_SPOKE_POOL).deposit(
            recipient,
            token,
            amount,
            destinationChainId,
            relayerFeePct,
            uint32(block.timestamp),
            "",
            0
        );

        emit BridgeInitiated(token, amount, destinationChainId, "Across");
    }

    function bridgeToL2LayerZero(
        uint16 destinationChainId,
        bytes calldata destination,
        bytes calldata payload
    ) external onlyWallet payable {
        ILayerZeroEndpoint(LAYERZERO_ENDPOINT).send{value: msg.value}(
            destinationChainId,
            destination,
            payload,
            payable(walletContract),
            address(0),
            ""
        );

        emit BridgeInitiated(address(0), msg.value, destinationChainId, "LayerZero");
    }

    function bridgeToL2Wormhole(
        address token,
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient
    ) external onlyWallet payable {
        IERC20(token).transferFrom(walletContract, address(this), amount);
        IERC20(token).approve(WORMHOLE, amount);

        IWormhole(WORMHOLE).transferTokens{value: msg.value}(
            token,
            amount,
            recipientChain,
            recipient,
            0,
            uint32(block.timestamp)
        );

        emit BridgeInitiated(token, amount, recipientChain, "Wormhole");
    }

    receive() external payable {}
}

