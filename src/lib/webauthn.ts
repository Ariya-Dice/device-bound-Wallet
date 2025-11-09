// src/lib/webauthn.ts
import { decode } from 'cbor-x';

export interface CredentialWithId extends Credential {
  id: string;
}

interface AttestationObject {
  fmt: string;
  authData: ArrayBuffer;
  attStmt: any;
}

export const extractCosePublicKeyFromAttestation = (attestationObject: ArrayBuffer): ArrayBuffer => {
  try {
    const uint8 = new Uint8Array(attestationObject);
    const attestation = decode(uint8) as AttestationObject;
    if (!attestation.authData) throw new Error("authData missing");
    return attestation.authData;
  } catch (err) {
    console.error("CBOR decode error:", err);
    throw new Error("Failed to parse attestationObject");
  }
};

// Hash a COSE public key (ArrayBuffer) with SHA-256 (WebAPI). Use keccak256 for EVM (see comment).
export async function getDevicePublicKeyHashFromCoseKey(coseKey: ArrayBuffer): Promise<string> {
  // For EVM, use ethers.keccak256 instead. Below uses SHA-256.
  const hash = await crypto.subtle.digest('SHA-256', coseKey);
  // For EVM Solidity compat, use ethers.keccak256(new Uint8Array(coseKey)).
  return Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2,'0')).join('');
}

export const createNewCredential = async (username: string): Promise<CredentialWithId> => {
  if (!window.PublicKeyCredential) throw new Error("WebAuthn is not supported");

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: { name: "DeviceBound Wallet" },
    user: { id: userId, name: username, displayName: username },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },   // ES256 (P-256)
      { type: "public-key", alg: -257 }, // RS256
      { type: "public-key", alg: -47 },  // ES256K (secp256k1)
    ],
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
    attestation: "direct",
    timeout: 60000,
  };

  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!credential) throw new Error("Credential creation failed.");

  if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
    throw new Error("Invalid attestation response");
  }

  return credential as CredentialWithId;
};

// اضافه شده: getWebAuthnSignature
export const getWebAuthnSignature = async (
  credentialId: string,
  challenge: Uint8Array
): Promise<AuthenticatorAssertionResponse> => {
  if (!window.PublicKeyCredential) throw new Error("WebAuthn is not supported");

  // Convert challenge to proper Uint8Array with ArrayBuffer
  // Create a new ArrayBuffer to ensure compatibility
  const validChallenge = new Uint8Array(challenge.length);
  validChallenge.set(challenge);

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: validChallenge,
    allowCredentials: [{
      type: "public-key",
      id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
    }],
    userVerification: "required",
    timeout: 60000,
  };

  const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential | null;
  if (!assertion) throw new Error("Authentication failed.");

  if (!(assertion.response instanceof AuthenticatorAssertionResponse)) {
    throw new Error("Invalid response type");
  }

  return assertion.response;
};