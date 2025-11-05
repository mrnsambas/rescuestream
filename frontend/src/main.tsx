import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './pages/App';

import { WagmiProvider, http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { needEnv } from './lib/env';
import { Buffer } from 'buffer';

// Polyfill Node Buffer for browser libs that expect it
if (!(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

const somnia = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: [needEnv('VITE_SOMNIA_RPC_URL')] },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network',
    },
  },
});

const { wallets } = getDefaultWallets({
  appName: 'RescueStream',
  projectId: needEnv('VITE_WALLETCONNECT_ID'),
});

const config = createConfig({
  chains: [somnia],
  transports: {
    [somnia.id]: http(needEnv('VITE_SOMNIA_RPC_URL')),
  },
  connectors: wallets,
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
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
