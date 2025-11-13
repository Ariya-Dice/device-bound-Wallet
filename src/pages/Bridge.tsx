import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { DEVICE_BOUND_WALLET_ABI } from '../constants';
import { getWebAuthnSignature } from '../lib/webauthn';
import { parseASN1Signature } from '../lib/crypto';
import { SUPPORTED_CHAINS } from '../constants';
import Spinner from '../components/Spinner';

const BRIDGE_GATEWAY_ABI = [
  "function bridgeToL2Across(address token, uint256 amount, uint256 destinationChainId, address recipient, int64 relayerFeePct) external",
  "function bridgeToL2LayerZero(uint16 destinationChainId, bytes calldata destination, bytes calldata payload) external payable",
  "function bridgeToL2Wormhole(address token, uint256 amount, uint16 recipientChain, bytes32 recipient) external payable"
];

const Bridge: React.FC = () => {
  const { walletData, chain, provider } = useWallet();
  const [token, setToken] = useState<string>('ETH');
  const [amount, setAmount] = useState<string>('');
  const [destinationChain, setDestinationChain] = useState<string>('97');
  const [bridgeProtocol, setBridgeProtocol] = useState<string>('across');
  const [recipient, setRecipient] = useState<string>('');
  const [isBridging, setIsBridging] = useState(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  const handleBridge = async () => {
    if (!provider || !walletData || !chain) {
      setError('Wallet not connected properly.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount.');
      return;
    }
    if (bridgeProtocol !== 'layerzero' && !recipient) {
      setError('Recipient address required.');
      return;
    }

    setIsBridging(true);
    setError('');
    setStatus('Preparing bridge...');
    setTxHash('');

    try {
      const signer = await provider.getSigner();
      const walletContract = new ethers.Contract(walletData.contractAddress, DEVICE_BOUND_WALLET_ABI, signer);
      
      const amountWei = token === 'ETH' 
        ? ethers.parseEther(amount)
        : ethers.parseUnits(amount, 6);
      const destChainId = parseInt(destinationChain);

      setStatus('Please approve with your device passkey...');
      const nonce = ethers.randomBytes(32);
      const txHashToSign = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'uint256', 'uint256', 'bytes32'],
          [walletData.contractAddress, amountWei, destChainId, nonce]
        )
      );

      const challenge = new Uint8Array(ethers.getBytes(txHashToSign));
      const assertion = await getWebAuthnSignature(walletData.credentialId, challenge);
      
      setStatus('Processing signature...');
      const signatureASN1 = new Uint8Array(assertion.signature);
      const { r, s } = parseASN1Signature(signatureASN1);

      setStatus('Executing bridge...');
      const bridgeGateway = new ethers.Contract(
        '0x0000000000000000000000000000000000000000', // Deploy BridgeGateway first
        BRIDGE_GATEWAY_ABI,
        signer
      );

      let tx;
      if (bridgeProtocol === 'across') {
        const tokenAddress = token === 'ETH' ? ethers.ZeroAddress : '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        tx = await bridgeGateway.bridgeToL2Across(
          tokenAddress,
          amountWei,
          destChainId,
          recipient || walletData.contractAddress,
          0
        );
      } else if (bridgeProtocol === 'layerzero') {
        const destination = ethers.zeroPadValue(ethers.getBytes(recipient || walletData.contractAddress), 20);
        const payload = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amountWei]);
        tx = await bridgeGateway.bridgeToL2LayerZero(
          destChainId,
          destination,
          payload,
          { value: token === 'ETH' ? amountWei : 0 }
        );
      } else if (bridgeProtocol === 'wormhole') {
        const tokenAddress = token === 'ETH' ? ethers.ZeroAddress : '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        const recipientBytes = ethers.zeroPadValue(ethers.getBytes(recipient || walletData.contractAddress), 32);
        tx = await bridgeGateway.bridgeToL2Wormhole(
          tokenAddress,
          amountWei,
          destChainId,
          recipientBytes,
          { value: token === 'ETH' ? amountWei : 0 }
        );
      }

      setTxHash(tx.hash);
      setStatus('Waiting for confirmation...');
      await tx.wait();

      setStatus('Bridge initiated successfully!');
      setAmount('');
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || 'Bridge failed.');
      setStatus('');
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Bridge Assets</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Token</label>
            <select
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2"
            >
              <option value="ETH">ETH</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Bridge Protocol</label>
            <select
              value={bridgeProtocol}
              onChange={(e) => setBridgeProtocol(e.target.value)}
              className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2"
            >
              <option value="across">Across</option>
              <option value="layerzero">LayerZero</option>
              <option value="wormhole">Wormhole</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Destination Chain</label>
            <select
              value={destinationChain}
              onChange={(e) => setDestinationChain(e.target.value)}
              className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2"
            >
              {Object.values(SUPPORTED_CHAINS).map(c => (
                <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          {bridgeProtocol !== 'layerzero' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2 font-mono"
              />
            </div>
          )}
          <button
            onClick={handleBridge}
            disabled={isBridging || !amount}
            className="w-full bg-brand-primary hover:bg-brand-light text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isBridging ? <Spinner /> : 'Bridge'}
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

export default Bridge;

