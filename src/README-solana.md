# DeviceBound Wallet — Solana PoC (Para SDK)

## Overview
This file documents how to integrate Para Network MPC for Ed25519 signing on Solana, as a proof-of-concept for non-secp256k1 device-bound wallets.

## Para Setup

1. Install Para SDK for TypeScript:
   ```sh
   npm install @para-network/sdk-solana
   ```

2. Usage (main login/tx examples):
   ```ts
   import { ParaSolanaSDK } from '@para-network/sdk-solana';

   // Initialize Para instance
   const para = new ParaSolanaSDK({
     appId: process.env.PARA_APP_ID!,
     rpcUrl: 'https://api.devnet.solana.com',
   });

   // Device-bound key registration (MPC/keygen flow)
   const deviceKey = await para.generateDeviceKey(/* hardware-bound */);

   // Use deviceKey to sign messages/transactions for Ed25519
   const message = Buffer.from('test-tx');
   const signature = await para.signWithDeviceKey(deviceKey, message);

   // (Verify signature matches on-chain Ed25519)
   // ...
   ```

3. See Para/Docs for full multi-device or threshold flows. MPC guarantees no direct key material export.

## Integration Hints
- Use the canonical public key extraction as for WebAuthn for device-bound registration ("attach" Para proof to wallet).
- For fallback/UX, show user device key and status (bound/not-bound), allow recovery with additional devices.
- Use Para-provided relayer or self-host.

## Next Steps
- Adapt frontend to detect Solana/Ed25519 chain and show device-bound sign with Para.
- For mainnet/production, audit Para on-chain + wallet.
