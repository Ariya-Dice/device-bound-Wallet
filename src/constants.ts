// src/constants.ts
import DeviceBoundWalletArtifact from "./out/DeviceBoundWallet.sol/DeviceBoundWallet.json";
import { CHAINS } from './lib/chains';

export const SUPPORTED_CHAINS = CHAINS;

export const DEVICE_BOUND_WALLET_ABI = DeviceBoundWalletArtifact.abi as const;
export const DEVICE_BOUND_WALLET_BYTECODE = DeviceBoundWalletArtifact.bytecode.object as `0x${string}`;