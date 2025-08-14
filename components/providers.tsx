'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { CampProvider } from "@campnetwork/origin/react";
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [isConfigReady, setIsConfigReady] = useState(false);

  useEffect(() => {
    // Set up Origin SDK configuration for BaseCAMP network
    if (typeof window !== 'undefined') {
      // Clear any existing config first
      delete (window as any).__ORIGIN_CONFIG__;
      
      // Set new config using environment variables
      (window as any).__ORIGIN_CONFIG__ = {
        apiUrl: process.env.NEXT_PUBLIC_ORIGIN_API || 'https://api.origin.campnetwork.xyz',
        clientId: process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID || '9123887d-94f0-4427-a2f7-cd04d16c1fc3',
        environment: process.env.NEXT_PUBLIC_CAMP_NETWORK_ENVIRONMENT || 'testnet',
        network: {
          chainId: process.env.NEXT_PUBLIC_CHAIN_ID || '123420001114',
          chainIdHex: '0x1cbc67c35a',
          name: 'BaseCAMP',
          rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.basecamp.t.raas.gelato.cloud',
          explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://basecamp.cloud.blockscout.com',
          currency: 'CAMP'
        }
      }
      
      console.log('🔧 Origin SDK configuration set:', (window as any).__ORIGIN_CONFIG__);
      
      // Wait a bit to ensure config is set
      setTimeout(() => {
        setIsConfigReady(true);
        console.log('🔧 Origin SDK configuration ready, rendering CampProvider');
      }, 1000);
    }
  }, []);

  // Don't render CampProvider until config is ready
  if (!isConfigReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing Origin SDK...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
        <CampProvider clientId={process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID || '9123887d-94f0-4427-a2f7-cd04d16c1fc3'}>
            {children}
            <Toaster position="top-right" richColors />
        </CampProvider>
    </QueryClientProvider>
  );
} 