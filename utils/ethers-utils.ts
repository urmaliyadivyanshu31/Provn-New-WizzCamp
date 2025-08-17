// Utility functions for ethers.js integration
export const ensureEthersAvailable = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // First check if ethers is already available
    if (typeof window !== 'undefined' && (window as any).ethers) {
      console.log('✅ Ethers.js is already available');
      resolve(true);
      return;
    }
    
    // Listen for ethers loaded event
    const handleEthersLoaded = () => {
      console.log('✅ Ethers.js loaded via event');
      window.removeEventListener('ethersLoaded', handleEthersLoaded);
      window.removeEventListener('ethersLoadFailed', handleEthersLoadFailed);
      resolve(true);
    };
    
    const handleEthersLoadFailed = () => {
      console.error('❌ Ethers.js failed to load via event');
      window.removeEventListener('ethersLoaded', handleEthersLoaded);
      window.removeEventListener('ethersLoadFailed', handleEthersLoadFailed);
      resolve(false);
    };
    
    window.addEventListener('ethersLoaded', handleEthersLoaded);
    window.addEventListener('ethersLoadFailed', handleEthersLoadFailed);
    
    // Fallback: check periodically
    const checkEthers = () => {
      if (typeof window !== 'undefined' && (window as any).ethers) {
        console.log('✅ Ethers.js is available via polling');
        window.removeEventListener('ethersLoaded', handleEthersLoaded);
        window.removeEventListener('ethersLoadFailed', handleEthersLoadFailed);
        resolve(true);
        return;
      }
      
      // Wait a bit and try again
      setTimeout(checkEthers, 100);
    };
    
    checkEthers();
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.error('❌ Ethers.js failed to load within 10 seconds');
      window.removeEventListener('ethersLoaded', handleEthersLoaded);
      window.removeEventListener('ethersLoadFailed', handleEthersLoadFailed);
      resolve(false);
    }, 10000);
  });
};

export const getEthers = () => {
  if (typeof window !== 'undefined' && (window as any).ethers) {
    return (window as any).ethers;
  }
  throw new Error('Ethers.js not available');
};

export const createProvider = () => {
  const ethers = getEthers();
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }
  return new ethers.providers.Web3Provider(window.ethereum);
};

export const createContract = (address: string, abi: any[], signerOrProvider: any) => {
  const ethers = getEthers();
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const parseUnits = (value: string | number, decimals: number) => {
  const ethers = getEthers();
  return ethers.utils.parseUnits(value.toString(), decimals);
};

export const formatUnits = (value: any, decimals: number) => {
  const ethers = getEthers();
  return ethers.utils.formatUnits(value, decimals);
};
