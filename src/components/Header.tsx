import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

const Header: React.FC = () => {
    const { chain, walletData } = useWallet();
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage, isRTL } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstallButton(false);
        }
        setDeferredPrompt(null);
    };

    return (
        <header className="bg-surface shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-brand-primary">
                    DeviceBound Wallet
                </h1>
                <div className="flex items-center gap-4">
                    {walletData && chain && (
                         <span className="text-sm px-3 py-1 bg-brand-dark text-accent rounded-full">
                            {chain.name}
                         </span>
                    )}
                    {showInstallButton && (
                        <button
                            onClick={handleInstall}
                            className="text-sm px-3 py-1 bg-brand-primary text-white rounded-full hover:bg-brand-light"
                        >
                            Install App
                        </button>
                    )}
                    <button
                        onClick={toggleLanguage}
                        className="text-sm px-3 py-1 bg-background text-text-primary rounded-full hover:bg-surface"
                    >
                        {language === 'en' ? 'فا' : 'EN'}
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="text-sm px-3 py-1 bg-background text-text-primary rounded-full hover:bg-surface"
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
