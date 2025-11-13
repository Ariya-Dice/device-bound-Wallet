// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface I1inchRouter {
    struct SwapDescription {
        address srcToken;
        address dstToken;
        address srcReceiver;
        address dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
        bytes permit;
    }
    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata data,
        bytes calldata permit
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}

contract DexRouter {
    address public immutable walletContract;
    address public constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant ONEINCH_ROUTER = 0x1111111254EEB25477B68fb85Ed929f73A960582;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    modifier onlyWallet() {
        require(msg.sender == walletContract, "Only wallet");
        _;
    }

    constructor(address _walletContract) {
        walletContract = _walletContract;
    }

    function swapExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline
    ) external onlyWallet returns (uint256 amountOut) {
        IERC20(tokenIn).transferFrom(walletContract, address(this), amountIn);
        IERC20(tokenIn).approve(UNISWAP_V3_ROUTER, amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: walletContract,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        amountOut = ISwapRouter(UNISWAP_V3_ROUTER).exactInputSingle(params);
        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut);
    }

    function swapWith1inch(
        address srcToken,
        address dstToken,
        uint256 amount,
        uint256 minReturn,
        bytes calldata data
    ) external onlyWallet returns (uint256 returnAmount) {
        IERC20(srcToken).transferFrom(walletContract, address(this), amount);
        IERC20(srcToken).approve(ONEINCH_ROUTER, amount);

        I1inchRouter.SwapDescription memory desc = I1inchRouter.SwapDescription({
            srcToken: srcToken,
            dstToken: dstToken,
            srcReceiver: address(this),
            dstReceiver: walletContract,
            amount: amount,
            minReturnAmount: minReturn,
            flags: 0,
            permit: ""
        });

        (returnAmount, ) = I1inchRouter(ONEINCH_ROUTER).swap(
            address(this),
            desc,
            data,
            ""
        );
        emit SwapExecuted(srcToken, dstToken, amount, returnAmount);
    }

    receive() external payable {}
}

