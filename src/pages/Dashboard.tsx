import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { DEVICE_BOUND_WALLET_ABI } from '../constants';
import { getWebAuthnSignature } from '../lib/webauthn';
import { parseASN1Signature } from '../lib/crypto';
import Spinner from '../components/Spinner';

const Dashboard: React.FC = () => {
  const { walletData, chain, provider } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  const fetchBalance = useCallback(async () => {
    if (provider && walletData) {
      try {
        const balanceWei = await provider.getBalance(walletData.contractAddress);
        setBalance(ethers.formatEther(balanceWei));
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setError("Could not fetch balance.");
      }
    }
  }, [provider, walletData]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleSend = async () => {
    if (!provider || !walletData || !chain) {
      setError('Wallet not connected properly.');
      return;
    }
    if (!ethers.isAddress(toAddress)) {
      setError('Invalid recipient address.');
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Invalid amount.');
      return;
    }

    setIsSending(true);
    setError('');
    setStatus('Preparing transaction...');
    setTxHash('');

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(walletData.contractAddress, DEVICE_BOUND_WALLET_ABI, signer);
      
      const value = ethers.parseEther(amount);
      const nonce = ethers.randomBytes(32);

      setStatus('Hashing transaction details...');
      const txHashToSign = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'address', 'uint256', 'bytes32'],
          [walletData.contractAddress, toAddress, value, nonce]
        )
      );
      
      setStatus('Please approve with your device passkey...');
      const challenge = new Uint8Array(ethers.getBytes(txHashToSign));
      const assertion = await getWebAuthnSignature(walletData.credentialId, challenge);
      
      setStatus('Processing signature...');
      const signatureASN1 = new Uint8Array(assertion.signature);
      const { r, s } = parseASN1Signature(signatureASN1);

      setStatus('Sending transaction to the network...');
      if (!walletData.primaryPublicKey) {
        throw new Error('Primary public key not found in wallet data');
      }
      const tx = await contract.execute(
        walletData.primaryPublicKey,
        r,
        s,
        txHashToSign,
        toAddress,
        value,
        nonce
      );
      setTxHash(tx.hash);

      setStatus('Waiting for confirmation...');
      await tx.wait();

      setStatus('Transaction successful!');
      fetchBalance();
      setToAddress('');
      setAmount('');
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || 'An unknown error occurred during sending.');
      setStatus('');
    } finally {
      setIsSending(false);
    }
  };

  if (!walletData || !chain) {
    return <div>Loading wallet...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-surface p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Wallet Info</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Balance:</span>
            <span className="font-mono text-accent text-lg">{parseFloat(balance).toFixed(5)} {chain.currency.symbol}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Wallet Address:</span>
            <a href={`${chain.explorerUrl}/address/${walletData.contractAddress}`} target="_blank" rel="noopener noreferrer" className="font-mono text-accent hover:underline">
              {`${walletData.contractAddress.substring(0, 6)}...${walletData.contractAddress.substring(walletData.contractAddress.length - 4)}`}
            </a>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Chain:</span>
            <span className="font-mono text-text-primary">{chain.name}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Send Funds</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="toAddress" className="block text-sm font-medium text-text-secondary mb-1">Recipient Address</label>
            <input id="toAddress" type="text" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="0x..." className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2 focus:ring-brand-primary focus:border-brand-primary font-mono"/>
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
            <input id="amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2 focus:ring-brand-primary focus:border-brand-primary font-mono"/>
          </div>
          <button onClick={handleSend} disabled={isSending} className="w-full bg-brand-primary hover:bg-brand-light text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center">
            {isSending ? <Spinner /> : `Send ${chain.currency.symbol}`}
          </button>
        </div>
        {status && <p className="text-accent mt-4 text-sm text-center">{status}</p>}
        {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
        {txHash && (
          <div className="mt-4 text-center text-sm">
            <a href={`${chain.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
              View transaction on explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;