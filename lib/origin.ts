// Origin SDK integration for Camp Network
import { Origin } from '@campnetwork/origin/react';

// Export the Origin type for use in API routes
export type { Origin };

// Helper function to get Origin SDK instance
export const getOriginSDK = (): Origin | null => {
  if (typeof window !== 'undefined') {
    return (window as any).__ORIGIN_INSTANCE__ || null;
  }
  return null;
};

// Helper function to initialize Origin SDK
export const initializeOriginSDK = (config: any): void => {
  if (typeof window !== 'undefined') {
    (window as any).__ORIGIN_CONFIG__ = config;
  }
};

// Export default for backward compatibility
export default { getOriginSDK, initializeOriginSDK };
