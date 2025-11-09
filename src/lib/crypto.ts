import { ethers } from 'ethers';
import { extractCosePublicKeyFromAttestation } from './webauthn';
import { decode } from 'cbor-x';

export const getDevicePublicKeyHash = (credential: PublicKeyCredential): `0x${string}` => {
  const response = (credential as any).response as AuthenticatorAttestationResponse;
  const attestationObject = response.attestationObject;
  if (!attestationObject) throw new Error("attestationObject missing");

  const authData = extractCosePublicKeyFromAttestation(attestationObject);
  const authDataArray = new Uint8Array(authData);

  // Parse according to WebAuthn spec: credentialIdLength starts at offset 53 (16-bit big-endian)
  const credentialIdLengthOffset = 53;
  const credIdLen = (authDataArray[credentialIdLengthOffset] << 8) | authDataArray[credentialIdLengthOffset + 1];
  const credentialPublicKeyOffset = credentialIdLengthOffset + 2 + credIdLen;
  const coseKeyCBOR = authDataArray.slice(credentialPublicKeyOffset);
  const coseKey = decode(coseKeyCBOR);
  const pubkeyHash = ethers.keccak256(coseKeyCBOR) as `0x${string}`;
  return pubkeyHash;
};

export function parseASN1Signature(signatureDER: Uint8Array | ArrayBuffer): { r: string; s: string } {
  const sig = signatureDER instanceof Uint8Array ? signatureDER : new Uint8Array(signatureDER);
  if (sig[0] !== 0x30) throw new Error('Not ASN.1 DER sequence');
  let idx = 2;
  if (sig[1] & 0x80) idx += (sig[1] & 0x7f);
  if (sig[idx++] !== 0x02) throw new Error('Missing R int marker');
  const rLen = sig[idx++];
  let r = sig.slice(idx, idx + rLen); idx += rLen;
  if (sig[idx++] !== 0x02) throw new Error('Missing S int marker');
  const sLen = sig[idx++];
  let s = sig.slice(idx, idx + sLen);
  if (r.length < 32) { const tmp = new Uint8Array(32); tmp.set(r, 32 - r.length); r = tmp; }
  if (s.length < 32) { const tmp = new Uint8Array(32); tmp.set(s, 32 - s.length); s = tmp; }
  return {
    r: ethers.hexlify(r),
    s: ethers.hexlify(s)
  };
}