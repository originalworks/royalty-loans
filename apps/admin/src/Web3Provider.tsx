import React from 'react';
import { base, baseSepolia, polygon } from 'wagmi/chains';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

import { injected, walletConnect } from '@wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { BASE_RPC_URL, ENVIRONMENT, POLYGON_RPC_URL } from './config/config';

const prodConfig = createConfig(
  getDefaultConfig({
    // Required App Info
    appName: 'OW Admin',
    walletConnectProjectId: 'ddf84945a65baaea510744142de8d6a6',
    // Your dApps chains
    chains: [base, polygon],
    transports: {
      [base.id]: http(BASE_RPC_URL, {
        batch: true,
      }),
      [polygon.id]: http(POLYGON_RPC_URL, {
        batch: true,
      }),
    },
    enableFamily: false,
  }),
);

const stageConfig = createConfig(
  getDefaultConfig({
    // Required App Info
    appName: 'OW Admin',
    walletConnectProjectId: 'ddf84945a65baaea510744142de8d6a6',
    // Your dApps chains
    chains: [baseSepolia],
    transports: {
      [baseSepolia.id]: http(BASE_RPC_URL, {
        batch: true,
      }),
    },
    enableFamily: false,
  }),
);

const queryClient = new QueryClient();

export const Web3Provider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const config = ENVIRONMENT === 'PROD' ? prodConfig : stageConfig;
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
