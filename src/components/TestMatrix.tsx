import React, { useState, useEffect } from 'react';

interface TestResult {
  browser: string;
  device: string;
  webauthn: boolean;
  es256k: boolean;
  p256: boolean;
  ed25519: boolean;
}

const TestMatrix: React.FC = () => {
  const [results, setResults] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const detectBrowser = (): string => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const detectDevice = (): string => {
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'iOS';
    if (/Android/.test(navigator.userAgent)) return 'Android';
    if (/Windows/.test(navigator.userAgent)) return 'Windows';
    if (/Mac/.test(navigator.userAgent)) return 'macOS';
    if (/Linux/.test(navigator.userAgent)) return 'Linux';
    return 'Unknown';
  };

  const testWebAuthn = async (): Promise<boolean> => {
    return !!window.PublicKeyCredential;
  };

  const testAlgorithm = async (alg: number): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: { name: 'Test', id: window.location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'test',
          displayName: 'Test User',
        },
        pubKeyCredParams: [{ type: 'public-key', alg }],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        timeout: 5000,
      };

      const credential = await navigator.credentials.create({ publicKey });
      return !!credential;
    } catch (error) {
      return false;
    }
  };

  const runTests = async () => {
    setIsTesting(true);
    try {
      const webauthn = await testWebAuthn();
      const es256k = await testAlgorithm(-47); // ES256K
      const p256 = await testAlgorithm(-7); // ES256 (P-256)
      const ed25519 = await testAlgorithm(-8); // Ed25519

      setResults({
        browser: detectBrowser(),
        device: detectDevice(),
        webauthn,
        es256k,
        p256,
        ed25519,
      });
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  if (!results) {
    return (
      <div className="bg-surface p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Device Compatibility Test</h2>
        <div className="text-center">
          <p className="text-text-secondary">{isTesting ? 'Testing...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (supported: boolean) => supported ? '✅' : '❌';
  const getStatusColor = (supported: boolean) => supported ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-surface p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-text-primary mb-4">Device Compatibility Test</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-text-secondary">Browser:</span>
            <span className="ml-2 text-text-primary font-medium">{results.browser}</span>
          </div>
          <div>
            <span className="text-text-secondary">Device:</span>
            <span className="ml-2 text-text-primary font-medium">{results.device}</span>
          </div>
        </div>
        <div className="border-t border-gray-600 pt-4">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Algorithm Support</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">WebAuthn API:</span>
              <span className={getStatusColor(results.webauthn)}>
                {getStatusIcon(results.webauthn)} {results.webauthn ? 'Supported' : 'Not Supported'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">ES256K (secp256k1):</span>
              <span className={getStatusColor(results.es256k)}>
                {getStatusIcon(results.es256k)} {results.es256k ? 'Supported' : 'Not Supported'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">P-256 (ES256):</span>
              <span className={getStatusColor(results.p256)}>
                {getStatusIcon(results.p256)} {results.p256 ? 'Supported' : 'Not Supported'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Ed25519:</span>
              <span className={getStatusColor(results.ed25519)}>
                {getStatusIcon(results.ed25519)} {results.ed25519 ? 'Supported' : 'Not Supported'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={runTests}
          disabled={isTesting}
          className="w-full bg-brand-primary hover:bg-brand-light text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-500"
        >
          {isTesting ? 'Testing...' : 'Re-run Tests'}
        </button>
      </div>
    </div>
  );
};

export default TestMatrix;

