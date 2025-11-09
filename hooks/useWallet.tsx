import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletData, Chain } from '@/types';
import { SUPPORTED_CHAINS } from '@/constants';

interface WalletContextType {
  walletData: WalletData | null;
  setWalletData: (data: WalletData | null) => void;
  isLoading: boolean;
  provider: ethers.JsonRpcProvider | null;
  checkWallet: () => Promise<void>;
  chain: Chain | null;
}

/* -------------------------------------------------------------------------- */
/*                               Wallet Context                               */
/* -------------------------------------------------------------------------- */
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletData, setWalletDataState] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);

  /* ------------------------------------------------------------------------ */
  /*                     Store / restore wallet data                           */
  /* ------------------------------------------------------------------------ */
  const setWalletData = (data: WalletData | null) => {
    setWalletDataState(data);

    if (data) {
      // Save to localStorage
      localStorage.setItem('devicebound_wallet', JSON.stringify(data));

      // Resolve chain & provider
      const currentChain = SUPPORTED_CHAINS[data.chainId];
      setChain(currentChain ?? null);

      if (currentChain) {
        setProvider(new ethers.JsonRpcProvider(currentChain.rpcUrl));
      }
    } else {
      // Clean up
      localStorage.removeItem('devicebound_wallet');
      setChain(null);
      setProvider(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                     Load wallet on app start                              */
  /* ------------------------------------------------------------------------ */
  const checkWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem('devicebound_wallet');
      if (saved) {
        const parsed: WalletData = JSON.parse(saved);
        setWalletData(parsed);
      }
    } catch (err) {
      console.error('Failed to load saved wallet', err);
      setWalletData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: WalletContextType = {
    walletData,
    setWalletData,
    isLoading,
    provider,
    checkWallet,
    chain,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

/* -------------------------------------------------------------------------- */
/*                                 Hook                                             */
/* -------------------------------------------------------------------------- */
export const useWallet = (): WalletContextType => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
};