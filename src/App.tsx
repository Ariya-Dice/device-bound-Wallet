// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import CreateWallet from '@/pages/CreateWallet';
import Dashboard from '@/pages/Dashboard';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import RecoverWallet from '@/components/RecoverWallet';
import '@/index.css';


const App: React.FC = () => {
  const { walletData, isLoading, checkWallet } = useWallet();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkWallet();
      setIsInitialized(true);
    };
    init();
  }, [checkWallet]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {walletData ? (
          <Dashboard />
        ) : (
          <div>
            <div className="flex justify-center mb-6">
              <button
                className={`mr-4 px-4 py-2 rounded ${!showRecovery ? 'bg-brand-primary text-white' : 'bg-background text-brand-primary border border-brand-primary'}`}
                onClick={() => setShowRecovery(false)}
              >
                New Wallet
              </button>
              <button
                className={`px-4 py-2 rounded ${showRecovery ? 'bg-brand-primary text-white' : 'bg-background text-brand-primary border border-brand-primary'}`}
                onClick={() => setShowRecovery(true)}
              >
                Recover Wallet
              </button>
            </div>
            {showRecovery ? <RecoverWallet onRecovered={checkWallet} /> : <CreateWallet />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;