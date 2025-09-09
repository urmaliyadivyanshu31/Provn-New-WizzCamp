'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';

interface WalletConnectContextType {
  isAvailable: boolean;
  error: string | null;
}

const WalletConnectContext = createContext<WalletConnectContextType>({
  isAvailable: false,
  error: null,
});

export const useWalletConnectStatus = () => useContext(WalletConnectContext);

interface WalletConnectWrapperProps {
  children: ReactNode;
}

export function WalletConnectWrapper({ children }: WalletConnectWrapperProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if WalletConnect project ID is configured
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    
    if (!projectId) {
      setError('WalletConnect project ID not configured');
      setIsAvailable(false);
      return;
    }

    // Simplified health check - don't block loading
    const checkWalletConnectHealth = () => {
      if (projectId) {
        setIsAvailable(true);
        setError(null);
      } else {
        setError('WalletConnect project ID not configured');
        setIsAvailable(false);
      }
    };

    // Run check without await to avoid blocking
    checkWalletConnectHealth();
  }, []);

  return (
    <WalletConnectContext.Provider value={{ isAvailable, error }}>
      {children}
    </WalletConnectContext.Provider>
  );
}