import React from 'react';
import { useWallet } from '../hooks/useWallet';

const Header: React.FC = () => {
    const { chain, walletData } = useWallet();

    return (
        <header className="bg-surface shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-brand-primary">
                    DeviceBound Wallet
                </h1>
                <div className="flex items-center space-x-4">
                    {walletData && chain && (
                         <span className="text-sm px-3 py-1 bg-brand-dark text-accent rounded-full">
                            {chain.name}
                         </span>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
