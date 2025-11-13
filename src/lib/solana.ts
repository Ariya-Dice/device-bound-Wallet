import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface SolanaWallet {
  publicKey: string;
  connection: Connection;
}

export const createSolanaConnection = (rpcUrl: string): Connection => {
  return new Connection(rpcUrl, 'confirmed');
};

export const getSolanaBalance = async (connection: Connection, publicKey: string): Promise<number> => {
  try {
    const pubkey = new PublicKey(publicKey);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    return 0;
  }
};

export const createSolanaTransaction = async (
  connection: Connection,
  fromPubkey: string,
  toPubkey: string,
  amount: number
): Promise<Transaction> => {
  const from = new PublicKey(fromPubkey);
  const to = new PublicKey(toPubkey);
  const lamports = amount * LAMPORTS_PER_SOL;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from;

  return transaction;
};

// MPC signing placeholder - integrate with Para SDK
export const signSolanaTransactionWithMPC = async (
  transaction: Transaction,
  credentialId: string
): Promise<Transaction> => {
  // Placeholder for Para SDK integration
  // In production: use @para/sdk to sign with MPC
  console.log('Signing Solana transaction with MPC for credential:', credentialId);
  return transaction;
};

