'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { CampProvider } from "@campnetwork/origin/react";
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [isConfigReady, setIsConfigReady] = useState(false);

  useEffect(() => {
    // Handle ethereum object conflicts from multiple wallet extensions
    const handleEthereumConflict = () => {
      if (typeof window !== 'undefined') {
        const originalDefineProperty = Object.defineProperty;
        Object.defineProperty = function<T>(obj: T, prop: PropertyKey, descriptor: PropertyDescriptor & ThisType<any>): T {
          if (prop === 'ethereum' && obj === window && window.ethereum) {
            console.warn('ethereum object already exists, skipping redefinition');
            return obj;
          }
          return originalDefineProperty.call(this, obj, prop, descriptor) as T;
        };
        
        // Restore after extensions load
        setTimeout(() => {
          Object.defineProperty = originalDefineProperty;
        }, 5000);
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
      console.log('🔧 Ready to initialize CampProvider');
    }
  }, []);

  // Don't render CampProvider until config is ready
  if (!isConfigReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex items-center justify-center min-h-screen bg-provn-bg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-provn-accent mx-auto mb-4"></div>
            <p className="text-provn-muted">Initializing Origin SDK...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
        <CampProvider 
          clientId={process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID || '9123887d-94f0-4427-a2f7-cd04d16c1fc3'}
          redirectUri={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
          allowAnalytics={false}
        >
            {children}
            <Toaster position="top-right" richColors />
        </CampProvider>
    </QueryClientProvider>
  );
} 