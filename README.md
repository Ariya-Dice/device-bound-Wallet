🔐 DeviceBound Wallet

A smart wallet based on WebAuthn/Passkey that keeps private keys securely on your device and uses smart contracts to manage digital assets.

<div align="center">








</div>
📋 Table of Contents

Introduction

Features

Architecture

Installation

Usage

Project Structure

Technologies Used

Security

Development

🎯 Introduction

DeviceBound Wallet is a decentralized wallet that uses the WebAuthn (Passkey) standard for authentication.
Unlike traditional wallets that rely on seed phrases or stored private keys, this wallet leverages your device’s built-in security (Touch ID, Face ID, Windows Hello, etc.) for signing transactions.

Why DeviceBound Wallet?

✅ No Seed Phrase: No need to store or remember seed phrases.

✅ Hardware-Level Security: Keys are stored in your device’s TPM (Trusted Platform Module).

✅ Better UX: Use biometrics to sign transactions seamlessly.

✅ Recoverable: Recover your wallet using your Passkey.

✅ Multi-Device Support: Up to 3 devices can be registered per wallet.

✨ Features
🔑 Create a New Wallet

Create a wallet using WebAuthn/Passkey.

Extract the public key from the attestation object.

Automatically deploy a smart contract wallet to the blockchain.

Supports multiple networks (Sepolia, BSC Testnet, etc.).

🔄 Recover Wallet

Recover a wallet using its contract address.

Authenticate via Passkey.

Automatically reload wallet data from blockchain and local storage.

💸 Send Transactions

Send ETH or tokens to another address.

Sign transactions using your Passkey.

Convert ASN.1 signature format to ECDSA.

Prevent replay attacks with nonce protection.

📱 Progressive Web App (PWA)

Installable on mobile or desktop.

Offline-ready via Service Worker.

Native-like user experience.

🏗️ Architecture
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
    ┌────▼────────────▼────┐
    │   Smart Contract     │
    │ DeviceBoundWallet.sol │
    └───────────────────────┘

Wallet Creation Flow

WebAuthn Request: User authenticates using device biometrics.

Extract Public Key: Extract COSE public key from attestationObject.

Compute Hash: Generate SHA-256 hash of the public key.

Deploy Contract: Deploy smart contract with pubKeyHash and label.

Save Data: Store wallet info in localStorage.

Transaction Flow

Build Transaction: User inputs recipient and amount.

Hashing: Compute hash from transaction details + nonce.

WebAuthn Signature: User signs using Passkey.

Signature Conversion: Convert ASN.1 → (r, s) ECDSA format.

Contract Call: Invoke execute function on smart contract.

Verification: Contract validates signature and executes transfer.

🚀 Installation
Requirements

Node.js v18 or later

npm or yarn

MetaMask or another Web3 wallet

WebAuthn-compatible browser: Chrome, Edge, Safari, or Firefox

Setup
# Clone the repo
git clone <repository-url>
cd dvbwallet

# Install dependencies
npm install

Run Development Server
npm run dev


Runs on http://localhost:3000.

Build for Production
npm run build


Build artifacts are output to the dist folder.

Preview Production Build
npm run preview

📖 Usage
Create New Wallet

Open the app.

Click New Wallet.

Enter a device label (e.g., “My Laptop”).

Select a blockchain network.

Click Create & Deploy Wallet.

Approve the WebAuthn/Passkey prompt.

Wait for contract deployment.

Recover Wallet

Click Recover Wallet.

Enter the contract address.

Click Recover.

Approve with your device’s Passkey.

Wallet data loads automatically.

Send Transaction

Open the dashboard.

Enter recipient address.

Enter amount.

Click Send.

Approve using Passkey.

Wait for confirmation.

📁 Project Structure
dvbwallet/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   ├── RecoverWallet.tsx
│   │   └── Spinner.tsx
│   ├── hooks/
│   │   └── useWallet.tsx
│   ├── lib/
│   │   ├── chains.ts
│   │   ├── crypto.ts
│   │   └── webauthn.ts
│   ├── pages/
│   │   ├── CreateWallet.tsx
│   │   └── Dashboard.tsx
│   ├── types.ts
│   ├── constants.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
│   ├── manifest.json
│   └── service-worker.js
├── DeviceBoundWallet.sol
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js

Key Files
src/lib/webauthn.ts

createNewCredential: Create a new WebAuthn credential

getWebAuthnSignature: Sign data using WebAuthn

extractCosePublicKeyFromAttestation: Extract public key from attestation object

src/lib/crypto.ts

parseASN1Signature: Convert ASN.1 to (r, s)

getDevicePublicKeyHash: Compute hash of the public key

src/hooks/useWallet.tsx

walletData: Holds wallet state

checkWallet: Loads wallet from localStorage

recoverWallet: Recovers wallet from contract address

setWalletData: Saves or clears wallet info

DeviceBoundWallet.sol

Main smart contract:

constructor: Deploy with initial pubKeyHash

addDevice: Register new device (max 3)

execute: Execute signed transaction

reconnectWallet: Verify ownership for recovery

🛠️ Technologies Used
Frontend

React 18 – UI framework

TypeScript – Type safety

Vite – Fast build tool

Tailwind CSS – Styling

Ethers.js v6 – Blockchain interactions

WebAuthn

WebAuthn API – W3C authentication standard

CBOR / cbor-x – COSE key encoding/decoding

Smart Contracts

Solidity ^0.8.24 – Contract language

ECDSA – Digital signature scheme

PWA

vite-plugin-pwa – PWA support

Workbox – Service Worker management

🔒 Security
Security Features

Device-Bound Keys: Keys are stored in the device TPM; non-extractable.

Nonce Protection: Prevents replay attacks.

Signature Verification: Smart contract validates every signature.

Device Registration: Only registered devices can send transactions.

View Functions: reconnectWallet is a view-only verification method.

Important Security Notes

⚠️ Warning: This project is under development. Do not use with real assets.

Use only on testnets.

Audit the contract before production use.

Use secure devices for Passkey storage.

Never share your credentialId or private data.

🧪 Development
Compile Smart Contract
# Using Foundry
forge build

# Or with Hardhat
npx hardhat compile

Test Contract
# Foundry
forge test

# Hardhat
npx hardhat test

Add a New Network

Edit src/lib/chains.ts:

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

Smart Contract Structure
contract DeviceBoundWallet {
    uint256 public constant MAX_DEVICES = 3;
    address payable public immutable OWNER;
    bytes32 public immutable WALLET_ID;
    uint256 public deviceCount;
    mapping(bytes32 => Device) public devices;
    mapping(bytes32 => bool) public usedNonces;
}

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




https://device-bound-wallet.vercel.app/