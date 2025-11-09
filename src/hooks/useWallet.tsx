import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletData, Chain } from '../types';
import { SUPPORTED_CHAINS } from '../constants';
import { getWebAuthnSignature } from '../lib/webauthn';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextType {
  walletData: WalletData | null;
  setWalletData: (data: WalletData | null) => void;
  isLoading: boolean;
  provider: ethers.BrowserProvider | null;
  checkWallet: () => Promise<void>;
  chain: Chain | null;
  recoverWallet: (contractAddress: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletData, setWalletDataState] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);

  const setWalletData = useCallback((data: WalletData | null) => {
    setWalletDataState(data);
    if (data) {
      localStorage.setItem('devicebound_wallet', JSON.stringify(data));
      const currentChain = SUPPORTED_CHAINS[String(data.chainId)] ?? null;
      setChain(currentChain as Chain | null);
    } else {
      localStorage.removeItem('devicebound_wallet');
      setChain(null);
    }
  }, []);

  const checkWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      if (window.ethereum) {
        setProvider(new ethers.BrowserProvider(window.ethereum));
      }

      const savedWalletData = localStorage.getItem('devicebound_wallet');
      if (savedWalletData) {
        const parsedData: WalletData = JSON.parse(savedWalletData);
        setWalletData(parsedData);
      }
    } catch (error) {
      console.error('Could not check for wallet', error);
      setWalletData(null);
    } finally {
      setIsLoading(false);
    }
  }, [setWalletData]);

  const recoverWallet = useCallback(
    async (contractAddress: string) => {
      if (!provider) {
        throw new Error('Web3 provider not detected.');
      }
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid wallet (contract) address.');
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      let assertion: AuthenticatorAssertionResponse;
      try {
        const response = await getWebAuthnSignature('', challenge);
        if (!(response instanceof AuthenticatorAssertionResponse)) {
          throw new Error('Invalid response');
        }
        assertion = response;
      } catch (err: any) {
        const message =
          err?.message ??
          (err?.name === 'NotAllowedError'
            ? 'No passkey found for this wallet on this device.'
            : 'Failed to obtain WebAuthn assertion.');
        throw new Error(message);
      }

      const signer = await provider.getSigner();
      const abi = [
        'function reconnectWallet(bytes authenticatorData, bytes clientDataJSON, bytes signature) view returns (bool)',
        'function WALLET_ID() view returns (bytes32)'
      ];
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const isAuthorized: boolean = await contract.reconnectWallet(
        assertion.authenticatorData,
        assertion.clientDataJSON,
        assertion.signature
      );
      if (!isAuthorized) {
        throw new Error('Device credential not recognized by contract.');
      }

      const primaryPubKeyHash = (await contract.WALLET_ID()) as `0x${string}`;

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const chainConfig = SUPPORTED_CHAINS[String(chainId)] ?? null;

      const recoveredWallet: WalletData = {
        contractAddress,
        chainId,
        primaryPubKeyHash,
        credentialId: '',
        curve: chainConfig?.pubKeyCurve ?? 'secp256k1'
      };

      setWalletData(recoveredWallet);
    },
    [provider, setWalletData]
  );

  const value = { walletData, setWalletData, isLoading, provider, checkWallet, chain, recoverWallet };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};