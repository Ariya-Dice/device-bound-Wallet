// src/wallet/tx.ts
import { ethers } from 'ethers';
import type { ChainConfig } from '../lib/chains';

export function buildTx(chain: ChainConfig, payload: {
  contractAddress: string;
  to: string;
  value: bigint | string;
  nonce: string; // or number, strictly canonical string for on-chain
  chainId?: number;
}): { txHash: string } {
  if (chain.chainType === 'evm') {
    // EVM canonical txHash: keccak(contract, to, value, nonce, chainId)
    const { contractAddress, to, value, nonce, chainId } = payload;
    const resolvedChainId = chainId ?? Number(chain.id);
    const txHash = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'address', 'uint256', 'bytes32', 'uint256'],
        [contractAddress, to, value, nonce, resolvedChainId]
      )
    );
    return { txHash };
  } else if (chain.chainType === 'solana') {
    // Stub
    return { txHash: 'solana-txhash-not-implemented' };
  } else if (chain.chainType === 'bitcoin') {
    // Stub
    return { txHash: 'btc-txhash-not-implemented' };
  } else {
    throw new Error('Unsupported chainType');
  }
}
