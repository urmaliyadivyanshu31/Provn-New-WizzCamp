import { useState, useCallback } from 'react';
import { useAuth } from '@campnetwork/origin/react';
import { errorToast } from '@/lib/toast';
import { ensureEthersAvailable, createProvider, getSigner, createContract, parseUnits, formatUnits } from '@/utils/ethers-utils';

// PROVN Token Contract ABI
const PROVN_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function autoFaucet(address recipient)",
  "function getFaucetStatus(address user) view returns (bool canReceive, uint256 timeUntilNextFaucet)"
];

// PROVN Token Contract Address (BaseCAMP Network)
const PROVN_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PROVN_TOKEN_ADDRESS || "0xa673B3E946A64037AdBAe22a0f56916dE43c678c";

// BaseCAMP Network Configuration
const BASECAMP_CHAIN_ID = 123420001114;
const BASECAMP_RPC_URL = "https://rpc.basecamp.t.raas.gelato.cloud";
const EXPLORER_BASE_URL = "https://basecamp.cloud.blockscout.com";

export const useProvnTipping = () => {
  const { origin, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send tip using real blockchain transaction
  const sendTip = useCallback(async (recipientAddress: string, amount: number) => {
    if (!isAuthenticated || !origin) {
      throw new Error('Please connect your wallet first');
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure ethers.js is available
      const ethersAvailable = await ensureEthersAvailable();
      if (!ethersAvailable) {
        throw new Error('Ethers.js not loaded. Please refresh the page and try again.');
      }

      // Get the signer from the connected wallet
      if (!window.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or another wallet.');
      }

      // Create provider and signer
      const provider = await createProvider();
      const signer = await getSigner(provider);

      // Check if user is on correct network
      const network = await provider.getNetwork();
      const targetChainId = BigInt(BASECAMP_CHAIN_ID);
      const currentChainId = BigInt(network.chainId);
      
      if (currentChainId !== targetChainId) {
        const networkError = `Please switch to BaseCAMP network (Chain ID: ${BASECAMP_CHAIN_ID})`;
        errorToast.network(networkError);
        throw new Error(networkError);
      }

      // Create contract instance with signer
      const provnContract = await createContract(PROVN_TOKEN_ADDRESS, PROVN_ABI, signer);

      // Convert amount to wei (18 decimals)
      const amountInWei = await parseUnits(amount.toString(), 18);

      // Send transaction
      const tx = await provnContract.transfer(recipientAddress, amountInWei);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send tip';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, origin]);

  // Get user's PROVN balance
  const getBalance = useCallback(async (userAddress: string): Promise<string> => {
    try {
      const provider = await createProvider();
      const provnContract = await createContract(PROVN_TOKEN_ADDRESS, PROVN_ABI, provider);
      const balance = await provnContract.balanceOf(userAddress);
      const decimals = await provnContract.decimals();
      
      // Convert from wei to PROVN tokens
      return formatUnits(balance, decimals);
    } catch (err: any) {
      console.error('Failed to get balance:', err);
      throw new Error('Failed to fetch PROVN balance');
    }
  }, []);

  // Check faucet status
  const checkFaucetStatus = useCallback(async (userAddress: string) => {
    try {
      const provider = await createProvider();
      const provnContract = await createContract(PROVN_TOKEN_ADDRESS, PROVN_ABI, provider);
      const [canReceive, timeUntilNextFaucet] = await provnContract.getFaucetStatus(userAddress);
      return { canReceive, timeUntilNextFaucet: timeUntilNextFaucet.toString() };
    } catch (err: any) {
      console.error('Failed to check faucet status:', err);
      return { canReceive: false, timeUntilNextFaucet: '0' };
    }
  }, []);

  // Request faucet tokens
  const requestFaucet = useCallback(async (userAddress: string) => {
    if (!isAuthenticated || !origin) {
      throw new Error('Please connect your wallet first');
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure ethers.js is available
      const ethersAvailable = await ensureEthersAvailable();
      if (!ethersAvailable) {
        throw new Error('Ethers.js not loaded. Please refresh the page and try again.');
      }

      // Get the signer from the connected wallet
      if (!window.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or another wallet.');
      }

      // Create provider and signer
      const provider = await createProvider();
      const signer = await getSigner(provider);

      // Check if user is on correct network
      const network = await provider.getNetwork();
      const targetChainId = BigInt(BASECAMP_CHAIN_ID);
      const currentChainId = BigInt(network.chainId);
      
      if (currentChainId !== targetChainId) {
        const networkError = `Please switch to BaseCAMP network (Chain ID: ${BASECAMP_CHAIN_ID})`;
        errorToast.network(networkError);
        throw new Error(networkError);
      }

      // Create contract instance with signer
      const provnContract = await createContract(PROVN_TOKEN_ADDRESS, PROVN_ABI, signer);

      // Call autoFaucet function
      const tx = await provnContract.autoFaucet(userAddress);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to request faucet';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, origin]);

  return {
    sendTip,
    getBalance,
    checkFaucetStatus,
    requestFaucet,
    loading,
    error,
    clearError: () => setError(null)
  };
};
