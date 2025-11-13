🔐 DeviceBound Wallet

A smart wallet based on WebAuthn/Passkey that keeps private keys securely on your device and uses smart contracts to manage digital assets.

📋 Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Security](#security)
- [Development](#development)

🎯 Introduction

DeviceBound Wallet is a decentralized wallet that uses the WebAuthn (Passkey) standard for authentication. Unlike traditional wallets that rely on seed phrases or stored private keys, this wallet leverages your device's built-in security (Touch ID, Face ID, Windows Hello, etc.) for signing transactions.

Why DeviceBound Wallet?

✅ No Seed Phrase: No need to store or remember seed phrases.

✅ Hardware-Level Security: Keys are stored in your device's TPM (Trusted Platform Module).

✅ Better UX: Use biometrics to sign transactions seamlessly.

✅ Recoverable: Recover your wallet using your Passkey.

✅ Multi-Device Support: Up to 3 devices can be registered per wallet.

✅ Multi-Chain: Supports EVM, Solana, Bitcoin, Cosmos, Polkadot.

✅ DEX Integration: Built-in swap functionality with Uniswap V3, 1inch.

✅ Bridge Support: Cross-chain bridging with Across, LayerZero, Wormhole.

✨ Features

🔑 Create a New Wallet

- Create a wallet using WebAuthn/Passkey.
- Extract the public key from the attestation object.
- Automatically deploy a smart contract wallet to the blockchain.
- Supports multiple networks (Sepolia, BSC Testnet, Polygon, Arbitrum, etc.).

🔄 Recover Wallet

- Recover a wallet using its contract address.
- Authenticate via Passkey.
- Automatically reload wallet data from blockchain and local storage.

💸 Send Transactions

- Send ETH or tokens to another address.
- Sign transactions using your Passkey.
- Convert ASN.1 signature format to ECDSA.
- Prevent replay attacks with nonce protection.
- High-value transactions require 2-of-3 device approvals (>100 USDT).

🔄 Swap Tokens

- Internal DEX integration with Uniswap V3.
- 1inch aggregation support.
- PancakeSwap integration.
- Real-time price estimation.

🌉 Bridge Assets

- Cross-chain bridging with Across Protocol.
- LayerZero integration.
- Wormhole support.
- Multi-chain destination support.

📱 Progressive Web App (PWA)

- Installable on mobile or desktop.
- Offline-ready via Service Worker.
- Native-like user experience.
- Dark mode support.
- Persian RTL support.

🧪 Device Compatibility Testing

- Automatic browser/device detection.
- Algorithm support testing (ES256K, P-256, Ed25519).
- WebAuthn API compatibility check.

🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Create   │  │ Dashboard│  │ Recover  │              │
│  │ Wallet   │  │          │  │ Wallet   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       │              │              │                   │
│       └──────────────┼──────────────┘                   │
│                      │                                   │
│              ┌───────▼────────┐                         │
│              │  useWallet Hook │                         │
│              └───────┬────────┘                         │
└──────────────────────┼──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐  ┌─────▼─────┐  ┌───▼────┐
    │ WebAuthn│  │  Ethers.js│  │ Local  │
    │   API   │  │  Provider │  │Storage │
    └────┬────┘  └─────┬─────┘  └────────┘
         │            │
         │            │
    ┌────▼────────────▼────┐
    │   Smart Contracts    │
    │ DeviceBoundWallet.sol│
    │ DexRouter.sol        │
    │ BridgeGateway.sol     │
    └──────────────────────┘
```

🚀 Installation

Requirements

- Node.js v18 or later
- npm or yarn
- Foundry (for smart contract development)
- MetaMask or another Web3 wallet
- WebAuthn-compatible browser: Chrome, Edge, Safari, or Firefox

Setup

```bash
# Clone the repo
git clone <repository-url>
cd dvbwallet

# Install dependencies
npm install

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Run Development Server

```bash
npm run dev
```

Runs on http://localhost:3000.

Build for Production

```bash
npm run build
```

Build artifacts are output to the dist folder.

Preview Production Build

```bash
npm run preview
```

Smart Contract Development

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy to local Anvil
anvil
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

📖 Usage

Create New Wallet

1. Open the app.
2. Click New Wallet.
3. Enter a device label (e.g., "My Laptop").
4. Select a blockchain network.
5. Click Create & Deploy Wallet.
6. Approve the WebAuthn/Passkey prompt.
7. Wait for contract deployment.

Recover Wallet

1. Click Recover Wallet.
2. Enter the contract address.
3. Click Recover.
4. Approve with your device's Passkey.
5. Wallet data loads automatically.

Send Transaction

1. Open the dashboard.
2. Enter recipient address.
3. Enter amount.
4. Click Send.
5. Approve using Passkey.
6. Wait for confirmation.

Swap Tokens

1. Go to Swap tab in dashboard.
2. Select token pair (e.g., ETH/USDT).
3. Enter amount.
4. Review estimated output.
5. Click Swap.
6. Approve with Passkey.

Bridge Assets

1. Go to Bridge tab.
2. Select token and amount.
3. Choose bridge protocol (Across/LayerZero/Wormhole).
4. Select destination chain.
5. Enter recipient address (if required).
6. Click Bridge.
7. Approve with Passkey.

📁 Project Structure

```
dvbwallet/
├── contracts/
│   └── src/
│       ├── DeviceBoundWallet.sol
│       ├── DexRouter.sol
│       └── BridgeGateway.sol
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── RecoverWallet.tsx
│   │   ├── Spinner.tsx
│   │   └── TestMatrix.tsx
│   ├── hooks/
│   │   ├── useWallet.tsx
│   │   ├── useTheme.tsx
│   │   └── useLanguage.tsx
│   ├── lib/
│   │   ├── chains.ts
│   │   ├── crypto.ts
│   │   ├── webauthn.ts
│   │   ├── solana.ts
│   │   └── bitcoin.ts
│   ├── pages/
│   │   ├── CreateWallet.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Swap.tsx
│   │   └── Bridge.tsx
│   ├── types.ts
│   ├── constants.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
│   ├── manifest.json
│   └── service-worker.js
├── foundry.toml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

🛠️ Technologies Used

Frontend

- React 18 – UI framework
- TypeScript – Type safety
- Vite – Fast build tool
- Tailwind CSS – Styling
- Ethers.js v6 – Blockchain interactions
- React Router – Navigation

WebAuthn

- WebAuthn API – W3C authentication standard
- CBOR / cbor-x – COSE key encoding/decoding

Smart Contracts

- Solidity ^0.8.24 – Contract language
- ECDSA – Digital signature scheme
- Foundry – Development framework

Multi-Chain

- @solana/web3.js – Solana integration
- @lit-protocol/sdk-nodejs – Bitcoin MPC signing
- @paraswap/sdk – DEX aggregation

PWA

- vite-plugin-pwa – PWA support
- Workbox – Service Worker management

🔒 Security

Security Features

- Device-Bound Keys: Keys are stored in the device TPM; non-extractable.
- Nonce Protection: Prevents replay attacks.
- Signature Verification: Smart contract validates every signature.
- Device Registration: Only registered devices can send transactions.
- Multi-Sig for High-Value: Transactions >100 USDT require 2-of-3 approvals.
- View Functions: reconnectWallet is a view-only verification method.

Important Security Notes

⚠️ Warning: This project is under development. Do not use with real assets.

- Use only on testnets.
- Audit the contract before production use.
- Use secure devices for Passkey storage.
- Never share your credentialId or private data.

🧪 Development

Compile Smart Contract

```bash
# Using Foundry
forge build

# Or with Hardhat
npx hardhat compile
```

Test Contract

```bash
# Foundry
forge test

# Hardhat
npx hardhat test
```

Add a New Network

Edit `src/lib/chains.ts`:

```typescript
export const CHAINS: Record<string, ChainConfig> = {
  'YOUR_CHAIN_ID': {
    id: YOUR_CHAIN_ID,
    chainType: 'evm',
    name: 'Your Chain Name',
    rpcUrl: 'https://your-rpc-url',
    explorerUrl: 'https://your-explorer-url',
    pubKeyCurve: 'secp256k1',
    currency: { name: 'TOKEN', symbol: 'TOKEN', decimals: 18 },
    domainSeparator: 'YOUR:domain',
  },
  // ...
};
```

Deploy Contracts

```bash
# Start local Anvil
anvil

# Deploy DeviceBoundWallet
forge script script/DeployDeviceBoundWallet.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Deploy DexRouter
forge script script/DeployDexRouter.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Deploy BridgeGateway
forge script script/DeployBridgeGateway.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

📝 License

This project is licensed under the MIT License.

🤝 Contributing

Contributions, suggestions, and bug reports are welcome!
Please open an issue first to discuss proposed changes.

📧 Contact

For questions or support, please open an issue in the repository.

<div align="center">

Built with ❤️ for the Web3 community

</div>
