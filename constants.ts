import { Chain } from './types';

// In a real application, you would replace this with your actual Infura key.
// This is done to prevent runtime errors in environments where import.meta.env is not available.
const VITE_INFURA_KEY = 'd5ca73398f624854952a78182d2c3e4c';

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  11155111: {
    id: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: `https://sepolia.infura.io/v3/${VITE_INFURA_KEY}`,
    explorerUrl: 'https://sepolia.etherscan.io',
    currency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  },
  97: {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    explorerUrl: 'https://testnet.bscscan.com',
    currency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
  },
};

// NOTE: This ABI is designed for a smart contract that can verify P-256 signatures,
// which are used by WebAuthn. It differs from standard ecrecover-based contracts.
// The contract is expected to have a P-256 verification library integrated.
export const DEVICE_BOUND_WALLET_ABI = [
    // Constructor: Stores the hash of the first device's public key
    "constructor(bytes32 primaryPubKeyHash, string deviceLabel)",
    
    // Execute: Verifies a P-256 signature against the provided public key,
    // checks if the public key's hash is a registered device, then executes the transaction.
    "function execute(bytes calldata publicKey, bytes32 r, bytes32 s, bytes32 txHash, address to, uint256 value, bytes32 nonce)",

    // Events
    "event DeviceRegistered(bytes32 indexed pubKeyHash, string label)",
    "event TransactionExecuted(bytes32 indexed txHash, address indexed to, uint256 value)"
];


// WARNING: This bytecode is from a PREVIOUS, incompatible version of the smart contract.
// To make this application work, you MUST deploy a contract that matches the ABI above
// and includes a library for P-256 signature verification. This placeholder bytecode WILL FAIL.
export const DEVICE_BOUND_WALLET_BYTECODE = "0x";
