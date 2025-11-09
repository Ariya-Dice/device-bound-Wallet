
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
  chainId: number;
  encryptedAESKey: string; // Base64 encoded, encrypted with a key derived from WebAuthn
  primaryDeviceId: string; // hex string (keccak256 of the plain public key)
  credentialId: string; // Base64URL encoded
}

export interface Device {
    encryptedPubKey: string; // hex string
    label: string;
    active: boolean;
}
