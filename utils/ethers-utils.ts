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
    ethers = ethersModule;
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
  return new ethers.providers.Web3Provider(window.ethereum);
};

export const createContract = async (address: string, abi: any[], signerOrProvider: any) => {
  const ethers = await getEthers();
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const parseUnits = async (value: string | number, decimals: number) => {
  const ethers = await getEthers();
  return ethers.parseUnits(value.toString(), decimals);
};

export const formatUnits = async (value: any, decimals: number) => {
  const ethers = await getEthers();
  return ethers.formatUnits(value, decimals);
};
