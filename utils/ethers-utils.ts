// Utility functions for ethers.js integration
import { logger } from '@/lib/logger';

let ethers: any = null;

export const ensureEthersAvailable = async (): Promise<boolean> => {
  if (ethers) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Dynamic import of ethers
    const ethersModule = await import('ethers');
    // Handle both default and named exports
    ethers = ethersModule.default || ethersModule;
    logger.debug('Ethers.js loaded successfully');
    return true;
  } catch (error) {
    logger.error('Failed to load ethers', { error });
    return false;
  }
};

export const getEthers = async () => {
  if (ethers) {
    return ethers;
  }
  
  const isAvailable = await ensureEthersAvailable();
  if (!isAvailable) {
    throw new Error('Ethers.js not available');
  }
  
  return ethers;
};

export const createProvider = async () => {
  const ethers = await getEthers();
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }
  
  // Handle both ethers v5 and v6 API
  if (ethers.providers && ethers.providers.Web3Provider) {
    // ethers v5
    return new ethers.providers.Web3Provider(window.ethereum);
  } else if (ethers.BrowserProvider) {
    // ethers v6
    return new ethers.BrowserProvider(window.ethereum);
  } else {
    // Try direct access for different module structures
    const EthersProvider = ethers.ethers?.BrowserProvider || ethers.default?.BrowserProvider;
    if (EthersProvider) {
      return new EthersProvider(window.ethereum);
    }
    throw new Error('Could not find BrowserProvider in ethers module');
  }
};

export const getSigner = async (provider: any) => {
  const ethers = await getEthers();
  // Handle both ethers v5 and v6 API
  if (provider.getSigner) {
    // Both v5 and v6 have getSigner, but v6 doesn't take parameters
    try {
      return await provider.getSigner();
    } catch (error) {
      // If getSigner() fails, try getSigner(0) for v5 compatibility
      return await provider.getSigner(0);
    }
  } else {
    throw new Error('Provider does not support getSigner');
  }
};

export const createContract = async (address: string, abi: any[], signerOrProvider: any) => {
  const ethers = await getEthers();
  
  // Handle different module structures
  const Contract = ethers.Contract || ethers.ethers?.Contract || ethers.default?.Contract;
  if (!Contract) {
    throw new Error('Could not find Contract in ethers module');
  }
  
  return new Contract(address, abi, signerOrProvider);
};

export const parseUnits = async (value: string | number, decimals: number) => {
  const ethers = await getEthers();
  
  // Handle both ethers v5 and v6 API
  if (ethers.utils && ethers.utils.parseUnits) {
    // ethers v5
    return ethers.utils.parseUnits(value.toString(), decimals);
  } else if (ethers.parseUnits) {
    // ethers v6
    return ethers.parseUnits(value.toString(), decimals);
  } else {
    // Try different module structures
    const parseUnitsFn = ethers.ethers?.parseUnits || ethers.default?.parseUnits;
    if (parseUnitsFn) {
      return parseUnitsFn(value.toString(), decimals);
    }
    throw new Error('Could not find parseUnits in ethers module');
  }
};

export const formatUnits = async (value: any, decimals: number) => {
  const ethers = await getEthers();
  
  // Handle both ethers v5 and v6 API
  if (ethers.utils && ethers.utils.formatUnits) {
    // ethers v5
    return ethers.utils.formatUnits(value, decimals);
  } else if (ethers.formatUnits) {
    // ethers v6
    return ethers.formatUnits(value, decimals);
  } else {
    // Try different module structures
    const formatUnitsFn = ethers.ethers?.formatUnits || ethers.default?.formatUnits;
    if (formatUnitsFn) {
      return formatUnitsFn(value, decimals);
    }
    throw new Error('Could not find formatUnits in ethers module');
  }
};
