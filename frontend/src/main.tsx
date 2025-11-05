// Buffer is polyfilled in polyfill.ts which runs before this file
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './pages/App';

import { WagmiProvider, http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { injected } from 'wagmi/connectors';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Read envs directly - fail gracefully in production if missing
const rpcUrl = ((import.meta as any).env?.VITE_SOMNIA_RPC_URL as string | undefined);
const walletConnectId = ((import.meta as any).env?.VITE_WALLETCONNECT_ID as string | undefined) || '';

if (!rpcUrl) {
  console.error('VITE_SOMNIA_RPC_URL is required. Please set it in your environment variables.');
}

const somnia = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network',
    },
  },
});

// Always include RainbowKitProvider - configure wallets based on WalletConnect availability
let connectors: any[] = [];
try {
  if (walletConnectId && walletConnectId.trim() !== '') {
    // Full RainbowKit setup with WalletConnect
    const result = getDefaultWallets({ appName: 'RescueStream', projectId: walletConnectId });
    connectors = result.wallets || [];
  }
  // Always include injected connector for MetaMask and other injected wallets
  if (connectors.length === 0 || !connectors.some((c: any) => c.id === 'injected')) {
    connectors = [injected(), ...connectors];
  }
} catch (e) {
  console.warn('Failed to initialize wallets, using injected wallets only:', e);
  // Ultimate fallback: just use injected connector
  connectors = [injected()];
}

const config = createConfig({
  chains: [somnia],
  transports: { [somnia.id]: http(rpcUrl) },
  connectors,
});

const queryClient = new QueryClient();

// Always wrap in RainbowKitProvider to support ConnectButton
// Even without WalletConnect ID, it will work with injected wallets (MetaMask, etc.)
const AppTree = (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

createRoot(document.getElementById('root')!).render(AppTree);
