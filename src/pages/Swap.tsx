import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { DEVICE_BOUND_WALLET_ABI } from '../constants';
import { getWebAuthnSignature } from '../lib/webauthn';
import { parseASN1Signature } from '../lib/crypto';
import Spinner from '../components/Spinner';

const DEX_ROUTER_ABI = [
  "function swapExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint256 amountOutMinimum, uint256 deadline) external returns (uint256)",
  "function swapWith1inch(address srcToken, address dstToken, uint256 amount, uint256 minReturn, bytes calldata data) external returns (uint256)"
];

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Sepolia USDT
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const Swap: React.FC = () => {
  const { walletData, chain, provider } = useWallet();
  const [tokenIn, setTokenIn] = useState<string>('ETH');
  const [tokenOut, setTokenOut] = useState<string>('USDT');
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  const getTokenAddress = (symbol: string): string => {
    if (symbol === 'ETH') return ethers.ZeroAddress;
    if (symbol === 'USDT') return USDT_ADDRESS;
    if (symbol === 'WETH') return WETH_ADDRESS;
    return ethers.ZeroAddress;
  };

  const estimateSwap = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut('');
      return;
    }
    // Simplified estimation - in production, use actual DEX APIs
    const estimated = (parseFloat(amountIn) * 0.99).toFixed(6);
    setAmountOut(estimated);
  };

  useEffect(() => {
    estimateSwap();
  }, [amountIn, tokenIn, tokenOut]);

  const handleSwap = async () => {
    if (!provider || !walletData || !chain) {
      setError('Wallet not connected properly.');
      return;
    }
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setError('Invalid amount.');
      return;
    }

    setIsSwapping(true);
    setError('');
    setStatus('Preparing swap...');
    setTxHash('');

    try {
      const signer = await provider.getSigner();
      const walletContract = new ethers.Contract(walletData.contractAddress, DEVICE_BOUND_WALLET_ABI, signer);
      
      const tokenInAddr = getTokenAddress(tokenIn);
      const tokenOutAddr = getTokenAddress(tokenOut);
      const amountInWei = tokenIn === 'ETH' 
        ? ethers.parseEther(amountIn)
        : ethers.parseUnits(amountIn, 6);
      const minAmountOut = ethers.parseUnits((parseFloat(amountOut) * 0.95).toFixed(6), 6);
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      setStatus('Please approve with your device passkey...');
      const nonce = ethers.randomBytes(32);
      const txHashToSign = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'address', 'address', 'uint256', 'bytes32'],
          [walletData.contractAddress, tokenInAddr, tokenOutAddr, amountInWei, nonce]
        )
      );

      const challenge = new Uint8Array(ethers.getBytes(txHashToSign));
      const assertion = await getWebAuthnSignature(walletData.credentialId, challenge);
      
      setStatus('Processing signature...');
      const signatureASN1 = new Uint8Array(assertion.signature);
      const { r, s } = parseASN1Signature(signatureASN1);

      setStatus('Executing swap...');
      // In production, deploy DexRouter and call through wallet contract
      // For now, simplified direct call
      const dexRouter = new ethers.Contract(
        '0x0000000000000000000000000000000000000000', // Deploy DexRouter first
        DEX_ROUTER_ABI,
        signer
      );

      const tx = await dexRouter.swapExactInputSingle(
        tokenInAddr,
        tokenOutAddr,
        3000, // 0.3% fee tier
        amountInWei,
        minAmountOut,
        deadline
      );
      setTxHash(tx.hash);

      setStatus('Waiting for confirmation...');
      await tx.wait();

      setStatus('Swap successful!');
      setAmountIn('');
      setAmountOut('');
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || 'Swap failed.');
      setStatus('');
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Swap Tokens</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">From</label>
            <div className="flex gap-2">
              <select
                value={tokenIn}
                onChange={(e) => setTokenIn(e.target.value)}
                className="bg-background border border-gray-600 text-text-primary rounded-lg p-2"
              >
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
                <option value="WETH">WETH</option>
              </select>
              <input
                type="text"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-background border border-gray-600 text-text-primary rounded-lg p-2 font-mono"
              />
            </div>
          </div>
          <div className="text-center">
            <button className="text-accent text-2xl">↓</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">To</label>
            <div className="flex gap-2">
              <select
                value={tokenOut}
                onChange={(e) => setTokenOut(e.target.value)}
                className="bg-background border border-gray-600 text-text-primary rounded-lg p-2"
              >
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
                <option value="WETH">WETH</option>
              </select>
              <input
                type="text"
                value={amountOut}
                readOnly
                className="flex-1 bg-background border border-gray-600 text-text-primary rounded-lg p-2 font-mono opacity-70"
              />
            </div>
          </div>
          <button
            onClick={handleSwap}
            disabled={isSwapping || !amountIn}
            className="w-full bg-brand-primary hover:bg-brand-light text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSwapping ? <Spinner /> : 'Swap'}
          </button>
        </div>
        {status && <p className="text-accent mt-4 text-sm text-center">{status}</p>}
        {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
        {txHash && (
          <div className="mt-4 text-center text-sm">
            <a href={`${chain?.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
              View transaction
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swap;

