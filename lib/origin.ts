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

// Mock origin service for API routes (server-side)
// Since Origin SDK is client-side only, this is a placeholder
export const originService = {
  initialized: false,
  
  async initialize() {
    console.log('🔧 Origin service initialize called (server-side mock)');
    this.initialized = true;
  },
  
  async createIPNFT(params: any): Promise<{ tokenId: string; contractAddress?: string; transactionHash?: string; blockNumber?: number }> {
    console.log('🔧 Origin service createIPNFT called (server-side mock)', params);
    throw new Error('Origin SDK createIPNFT should be called from client-side only');
  },
  
  async createPost(params: any): Promise<{ postId: string; id?: string; transactionHash?: string }> {
    console.log('🔧 Origin service createPost called (server-side mock)', params);
    throw new Error('Origin SDK createPost should be called from client-side only');
  }
};

// Export default for backward compatibility
export default { getOriginSDK, initializeOriginSDK, originService };