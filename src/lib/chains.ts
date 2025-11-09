// src/lib/chains.ts

export type CurveType = 'secp256k1' | 'P-256' | 'Ed25519';
export type ChainType = 'evm' | 'solana' | 'bitcoin';

export interface ChainConfig {
  id: number | string; // string for chain-agnostic (e.g., 'solana:mainnet')
  chainType: ChainType;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  pubKeyCurve: CurveType;
  currency: { name: string; symbol: string; decimals: number };
  domainSeparator?: string; // only for EVM
  [key: string]: any;
}

export const CHAINS: Record<string, ChainConfig> = {
  // EVM chains
  '31337': {
    id: 31337,
    chainType: 'evm',
    name: 'Anvil Local',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
    pubKeyCurve: 'secp256k1',
    currency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    domainSeparator: 'Anvil:domain',
  },
  '11155111': {
    id: 11155111,
    chainType: 'evm',
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    pubKeyCurve: 'secp256k1',
    currency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    domainSeparator: 'ETH:sepolia',
  },
  '97': {
    id: 97,
    chainType: 'evm',
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
    pubKeyCurve: 'secp256k1',
    currency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
    domainSeparator: 'BSC:testnet',
  },
  '88888': {
    id: 88888,
    chainType: 'evm',
    name: 'Tron EVM (test)',
    rpcUrl: 'https://api.nileex.io/jsonrpc',
    explorerUrl: 'https://nile.tronscan.org',
    pubKeyCurve: 'secp256k1',
    currency: { name: 'TRX', symbol: 'TRX', decimals: 6 },
    domainSeparator: 'TRON:testnet',
  },
  // Add Polygon, Arbitrum, etc. similarly
  // Solana
  'solana:devnet': {
    id: 'solana:devnet',
    chainType: 'solana',
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com?cluster=devnet',
    pubKeyCurve: 'Ed25519',
    currency: { name: 'Sol', symbol: 'SOL', decimals: 9 },
  },
  // Bitcoin
  'bitcoin:testnet': {
    id: 'bitcoin:testnet',
    chainType: 'bitcoin',
    name: 'Bitcoin Testnet',
    rpcUrl: 'https://api.blockcypher.com/v1/btc/test3',
    explorerUrl: 'https://live.blockcypher.com/btc-testnet/',
    pubKeyCurve: 'secp256k1',
    currency: { name: 'BTC', symbol: 'tBTC', decimals: 8 },
  },
};
