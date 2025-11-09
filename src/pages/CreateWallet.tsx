import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { SUPPORTED_CHAINS, DEVICE_BOUND_WALLET_ABI, DEVICE_BOUND_WALLET_BYTECODE } from '../constants';
import { createNewCredential } from '../lib/webauthn';
import { decode } from 'cbor-x';
import Spinner from '../components/Spinner';
import { WalletData } from '../types';

const CreateWallet: React.FC = () => {
  const { setWalletData, provider } = useWallet();
  const [deviceLabel, setDeviceLabel] = useState<string>('');
  const [selectedChainId, setSelectedChainId] = useState<number>(Number(SUPPORTED_CHAINS['11155111']?.id) || 11155111);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const handleCreateWallet = async () => {
    if (!deviceLabel) {
      setError('Please provide a label for this device.');
      return;
    }
    if (!provider) {
        setError('Web3 provider not found. Please install MetaMask or another wallet.');
        return;
    }
    setIsLoading(true);
    setError('');

    try {
      setStatus('Waiting for Web3 provider...');
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      setStatus('Please approve the WebAuthn/Passkey request...');
      const credential = await createNewCredential(userAddress) as PublicKeyCredential;

      if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
        throw new Error('Expected AuthenticatorAttestationResponse');
      }

      const attestationObject = credential.response.attestationObject;
      if (!attestationObject) {
        throw new Error('attestationObject is missing');
      }

      // 1. Decode attestationObject CBOR to get authData
      let authData: Uint8Array;
      try {
        const attestationBuffer = new Uint8Array(attestationObject);
        const decoded = decode(attestationBuffer) as any;
        if (!decoded.authData) {
          throw new Error('authData missing in attestationObject');
        }
        authData = decoded.authData instanceof Uint8Array ? decoded.authData : new Uint8Array(decoded.authData);
      } catch (err) {
        throw new Error('Failed to parse attestationObject: ' + (err as Error).message);
      }

      // 2. Parse authData structure according to WebAuthn spec
      if (authData.length < 37) {
        throw new Error('authData too short');
      }

      const view = new DataView(authData.buffer, authData.byteOffset);
      let offset = 37; // after rpIdHash (32) + flags (1) + counter (4)

      // Check if attested credential data exists (bit 6 of flags)
      const flags = authData[32];
      const hasAttestedCredentialData = (flags & 0x40) !== 0;
      
      if (!hasAttestedCredentialData) {
        throw new Error('No attested credential data found');
      }

      // Skip AAGUID (16 bytes)
      offset += 16;

      // Read credentialIdLength (2 bytes, big-endian)
      if (offset + 2 > authData.length) {
        throw new Error('Invalid authData: credentialIdLength out of bounds');
      }
      const credentialIdLength = view.getUint16(offset, false);
      offset += 2;

      // Skip credentialId
      if (offset + credentialIdLength > authData.length) {
        throw new Error('Invalid authData: credentialId out of bounds');
      }
      offset += credentialIdLength;

      // Now at CBOR-encoded credentialPublicKey
      const publicKeyCBOR = authData.subarray(offset);
      
      if (publicKeyCBOR.length === 0) {
        throw new Error('Empty COSE Key buffer');
      }

      // 3. Use cbor-x to decode COSE_Key (returns Map or plain object)
      let coseKey: any;
      try {
        coseKey = decode(publicKeyCBOR);
      } catch (err) {
        throw new Error('Failed to decode COSE_Key CBOR: ' + (err as Error).message);
      }

      // 4. Validate P-256
      // cbor-x may return Map or plain object - handle both
      const getKey = (key: number): any => {
        if (coseKey instanceof Map) {
          return coseKey.get(key);
        }
        // For plain object, try both number and string key
        return (coseKey as any)[key] ?? (coseKey as any)[String(key)];
      };
      
      const kty = getKey(1);
      const crv = getKey(-1);
      
      if (kty !== 2) throw new Error('Only EC2 keys supported');
      if (crv !== 1) throw new Error('Only P-256 curve supported');

      // 5. Extract x and y
      const x = getKey(-2);
      const y = getKey(-3);

      if (!x || !y || !(x instanceof Uint8Array) || !(y instanceof Uint8Array)) {
        throw new Error('x or y coordinate missing or invalid');
      }
      if (x.length !== 32 || y.length !== 32) {
        throw new Error(`Invalid coordinate length: x=${x.length}, y=${y.length}`);
      }

      // Concat x || y
      const rawPublicKey = new Uint8Array(64);
      rawPublicKey.set(x, 0);
      rawPublicKey.set(y, 32);

      // SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', rawPublicKey);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const devicePubKeyHash = ('0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;

      const curve: 'P-256' = 'P-256';

      setStatus('Deploying your wallet contract...');
      const factory = new ethers.ContractFactory(DEVICE_BOUND_WALLET_ABI, DEVICE_BOUND_WALLET_BYTECODE, signer);
      const contract = await factory.deploy(devicePubKeyHash, deviceLabel);
      await contract.waitForDeployment();

      const contractAddress = await contract.getAddress();
      setStatus(`Wallet deployed at: ${contractAddress}`);

      const newWalletData: WalletData = {
        contractAddress,
        chainId: selectedChainId,
        primaryPubKeyHash: devicePubKeyHash,
        credentialId: credential.id,
        curve,
      };

      setWalletData(newWalletData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred.');
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="max-w-md w-full bg-surface p-8 rounded-lg shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-text-primary">Create Your On-Chain Wallet</h2>
        <p className="text-text-secondary mb-6">Secure a new smart contract wallet with a device-bound passkey.</p>
        <div className="space-y-4 text-left">
          <div>
            <label htmlFor="chain" className="block text-sm font-medium text-text-secondary mb-1">Network</label>
            <select
              id="chain"
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(Number(e.target.value))}
              className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2 focus:ring-brand-primary focus:border-brand-primary"
              disabled={isLoading}
            >
              {Object.values(SUPPORTED_CHAINS).map(chain => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-text-secondary mb-1">Device Label</label>
            <input
              id="label"
              type="text"
              value={deviceLabel}
              onChange={(e) => setDeviceLabel(e.target.value)}
              placeholder="e.g., My Laptop"
              className="w-full bg-background border border-gray-600 text-text-primary rounded-lg p-2 focus:ring-brand-primary focus:border-brand-primary"
              disabled={isLoading}
            />
          </div>
        </div>
        {status && <p className="text-accent mt-4 text-sm">{status}</p>}
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        <button
          onClick={handleCreateWallet}
          disabled={isLoading}
          className="w-full mt-6 bg-brand-primary hover:bg-brand-light text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <Spinner /> : 'Create & Deploy Wallet'}
        </button>
      </div>
    </div>
  );
};

export default CreateWallet;