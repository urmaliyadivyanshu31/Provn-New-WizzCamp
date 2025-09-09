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
  // Only register service worker if running in browser
  if (typeof window !== 'undefined') {
    useServiceWorker();
  }
  
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true to avoid hydration mismatches
    setMounted(true);

    // Simple ethereum object conflict handler
    const handleEthereumConflict = () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Prevent multiple wallet extensions from conflicting
        let ethereumProviders: any[] = [];
        let primaryProvider: any = null;

        // Collect existing providers before any conflicts occur
        if (window.ethereum) {
          primaryProvider = window.ethereum;
          if (window.ethereum.providers) {
            ethereumProviders = [...window.ethereum.providers];
          }
          console.log('🔒 Found existing ethereum provider');
        }

        // Store original defineProperty
        const originalDefineProperty = Object.defineProperty;
        let redefineAttempts = 0;

        // Override defineProperty to prevent ethereum conflicts
        Object.defineProperty = function<T>(obj: T, prop: PropertyKey, descriptor: PropertyDescriptor & ThisType<any>): T {
          if (prop === 'ethereum' && obj === window) {
            redefineAttempts++;
            console.log(`🔍 Ethereum redefinition attempt #${redefineAttempts}`);
            
            // If we already have a provider, prevent redefinition
            if (primaryProvider && redefineAttempts > 1) {
              console.log('⚠️ Preventing ethereum redefinition to avoid conflicts');
              return obj;
            }
            
            // Allow first definition
            if (!primaryProvider && descriptor.value) {
              primaryProvider = descriptor.value;
              console.log('✅ Setting primary ethereum provider');
            }
          }
          
          // Use original method for all properties
          return originalDefineProperty.call(this, obj, prop, descriptor) as T;
        };
        
        // Restore original defineProperty after extensions load
        setTimeout(() => {
          Object.defineProperty = originalDefineProperty;
          console.log('🔄 Restored original Object.defineProperty');
        }, 3000);
        
      } catch (error) {
        console.error('❌ Ethereum conflict handler failed:', error);
      }
    };

    // Set up Origin SDK configuration for BaseCAMP network
    if (typeof window !== 'undefined') {
      // Handle ethereum conflicts first
      handleEthereumConflict();
      
      // Clear any existing config first
      try {
        delete (window as any).__ORIGIN_CONFIG__;
      } catch (e) {
        // Silently handle config deletion errors
      }
      
      // Let CampProvider handle configuration automatically
      setIsConfigReady(true);
    } else {
      // For SSR, immediately mark as ready
      setIsConfigReady(true);
    }
  }, []);

  // Don't render CampProvider until mounted and config is ready
  if (!mounted || !isConfigReady) {
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
      <WagmiProvider config={config} reconnectOnMount={false}>
        <CampProvider 
          clientId={process.env.NEXT_PUBLIC_ORIGIN_CLIENT_ID || 'fce77d7a-8085-47ca-adff-306a933e76aa'}
          redirectUri={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3004'}
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