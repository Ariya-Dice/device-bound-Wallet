import type { CurveType } from './lib/chains';

export interface Chain {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface WalletData {
  contractAddress: string;
  chainId: number | string;
  primaryPubKeyHash: `0x${string}`;
  credentialId: string;
  curve: CurveType;
  signature?: Uint8Array;
  primaryPublicKey?: string;
}

export interface Device {
    pubKeyHash: string; // keccak256 hash of the device's public key
    label: string;
    active: boolean;
}