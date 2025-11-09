import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

const RecoverWallet: React.FC<{ onRecovered?: () => void }> = ({ onRecovered }) => {
  const { recoverWallet } = useWallet();
  const [contractAddress, setContractAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleRecover = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const trimmed = contractAddress.trim();
    if (!ethers.isAddress(trimmed)) {
      setError('Please enter a valid wallet contract address (0x...).');
      return;
    }

    setIsLoading(true);
    try {
      setStatus('Requesting passkey authentication...');
      await recoverWallet(trimmed);
      setStatus('Wallet recovered successfully.');
      setContractAddress('');
      if (onRecovered) {
        onRecovered();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Recovery failed.');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRecover} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-text-primary text-center">Recover Existing Wallet</h2>
      <label htmlFor="contract" className="block text-sm font-medium text-text-secondary">
        Wallet Contract Address
      </label>
      <input
        id="contract"
        type="text"
        value={contractAddress}
        onChange={(e) => setContractAddress(e.target.value)}
        className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2 font-mono"
        placeholder="0x..."
        autoComplete="off"
        required
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-primary hover:bg-brand-light text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Recovering...' : 'Recover'}
      </button>
      {status && <p className="text-accent text-sm text-center">{status}</p>}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </form>
  );
};

export default RecoverWallet;