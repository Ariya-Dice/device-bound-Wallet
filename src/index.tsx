
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletProvider } from './hooks/useWallet';
import { ThemeProvider } from './hooks/useTheme';
import { LanguageProvider } from './hooks/useLanguage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
