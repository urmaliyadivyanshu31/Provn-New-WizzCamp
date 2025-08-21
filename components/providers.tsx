'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { CampProvider } from "@campnetwork/origin/react";
import { createConfig, WagmiProvider } from 'wagmi';
import { http } from 'viem';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';
import { Toaster } from 'sonner';
import { VideoModalProvider } from '@/contexts/VideoModalContext';
import { FollowStateProvider } from '@/contexts/FollowStateContext';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { ProvnBrandLoader } from '@/components/common/LoadingStates';

// Define BaseCAMP chain with correct configuration
const baseCamp = defineChain({
  id: 123420001114,
  name: 'BaseCAMP',
  nativeCurrency: {
    decimals: 18,
    name: 'CAMP',
    symbol: 'CAMP',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.basecamp.t.raas.gelato.cloud', 'https://rpc-campnetwork.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseCAMP Explorer',
      url: 'https://basecamp.cloud.blockscout.com',
    },
  },
  contracts: {
    // Add Origin Protocol contracts
    marketplace: {
      address: '0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981',
    },
  },
});

// Wagmi configuration for BaseCAMP network
const config = createConfig({
  chains: [baseCamp],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [baseCamp.id]: http('https://rpc.basecamp.t.raas.gelato.cloud'),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  // Register service worker for performance optimizations
  useServiceWorker();
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes, then refetch in background
        staleTime: 5 * 60 * 1000,
        // Keep in cache for 10 minutes total
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus for video feeds (expensive)
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect for explore videos
        refetchOnReconnect: false,
        // Use network-first for video data
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        networkMode: 'online',
      },
    },
  }));
  const [isConfigReady, setIsConfigReady] = useState(false);

  useEffect(() => {
    // Handle ethereum object conflicts from multiple wallet extensions
    const handleEthereumConflict = () => {
      if (typeof window !== 'undefined') {
        // Prevent ethereum property redefinition errors
        try {
          // If ethereum already exists, make it non-configurable to prevent redefinition
          if (window.ethereum) {
            const existingDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
            if (existingDescriptor && existingDescriptor.configurable !== false) {
              Object.defineProperty(window, 'ethereum', {
                value: window.ethereum,
                writable: true,
                enumerable: true,
                configurable: false
              });
            }
            return;
          }

          const originalDefineProperty = Object.defineProperty;
          Object.defineProperty = function<T>(obj: T, prop: PropertyKey, descriptor: PropertyDescriptor & ThisType<any>): T {
            try {
              if (prop === 'ethereum' && obj === window) {
                // Check if ethereum already exists and is configurable
                const existingDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
                if (existingDescriptor) {
                  if (existingDescriptor.configurable === false) {
                    // Property already exists and is not configurable
                    return obj;
                  }
                  if (window.ethereum) {
                    // Ethereum object already exists, don't redefine
                    return obj;
                  }
                }
                
                // Set ethereum property as non-configurable to prevent further redefinition
                const newDescriptor = {
                  ...descriptor,
                  configurable: false
                };
                return originalDefineProperty.call(this, obj, prop, newDescriptor) as T;
              }
              return originalDefineProperty.call(this, obj, prop, descriptor) as T;
            } catch (error) {
              // Error defining property - silently handle
              return obj;
            }
          };
          
          // Restore after extensions load
          setTimeout(() => {
            Object.defineProperty = originalDefineProperty;
          }, 5000);
        } catch (error) {
          // Error setting up ethereum conflict handler - silently handle
        }
      }
    };

    // Set up Origin SDK configuration for BaseCAMP network
    if (typeof window !== 'undefined') {
      // Handle ethereum conflicts first
      handleEthereumConflict();
      
      // Clear any existing config first
      delete (window as any).__ORIGIN_CONFIG__;
      
      // Let CampProvider handle configuration automatically
      setIsConfigReady(true);
      // Ready to initialize CampProvider
    }
  }, []);

  // Don't render CampProvider until config is ready
  if (!isConfigReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex items-center justify-center min-h-screen bg-provn-bg">
          <ProvnBrandLoader size="lg" message="Initializing Origin SDK..." />
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config} reconnectOnMount={true}>
        <CampProvider 
          clientId={process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID || '9123887d-94f0-4427-a2f7-cd04d16c1fc3'}
          redirectUri={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
          allowAnalytics={false}
        >
          <FollowStateProvider>
            <VideoModalProvider>
              {children}
              <Toaster position="top-right" richColors />
            </VideoModalProvider>
          </FollowStateProvider>
        </CampProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 