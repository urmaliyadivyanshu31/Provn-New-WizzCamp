import { errorToast } from '@/lib/toast';

export const BASE_CAMP_CHAIN_ID = "123420001114";
export const BASE_CAMP_CHAIN_ID_HEX = "0x1cbc67c35a";

export const BASECAMP_NETWORK_CONFIG = {
  chainId: BASE_CAMP_CHAIN_ID_HEX,
  chainName: 'BaseCAMP',
  nativeCurrency: {
    name: 'CAMP',
    symbol: 'CAMP',
    decimals: 18
  },
  rpcUrls: [
    'https://rpc.basecamp.t.raas.gelato.cloud',
    'https://rpc-campnetwork.xyz'
  ],
  blockExplorerUrls: ['https://basecamp.cloud.blockscout.com/']
};

export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const switchToBaseCampNetwork = async (): Promise<{ success: boolean; error?: string }> => {
  if (!window.ethereum) {
    return { success: false, error: "No wallet detected. Please install a Web3 wallet." };
  }

  try {
    const mobile = isMobileDevice();
    
    if (mobile) {
      // Mobile strategy: Try adding network first (often works better)
      try {
        console.log('📱 Mobile detected: Adding BaseCAMP network...');
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BASECAMP_NETWORK_CONFIG]
        });
        console.log('✅ Successfully added BaseCAMP network on mobile');
      } catch (addError: any) {
        // If network already exists, try to switch
        if (addError.code === 4001 || addError.code === -32601 || addError.message?.includes('already exists')) {
          console.log('🔄 Network exists, switching...');
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CAMP_CHAIN_ID_HEX }]
          });
          console.log('✅ Successfully switched to BaseCAMP network on mobile');
        } else {
          throw addError;
        }
      }
    } else {
      // Desktop strategy: Try switch first, then add if needed
      try {
        console.log('🖥️ Desktop detected: Switching to BaseCAMP network...');
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_CAMP_CHAIN_ID_HEX }]
        });
        console.log('✅ Successfully switched to BaseCAMP network');
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          console.log('➕ BaseCAMP network not found, adding it...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASECAMP_NETWORK_CONFIG]
          });
          console.log('✅ Successfully added BaseCAMP network');
        } else {
          throw switchError;
        }
      }
    }
    
    return { success: true };
    
  } catch (error: any) {
    console.error("Network switch/add error:", error);
    
    const mobile = isMobileDevice();
    let errorMessage: string;
    
    // Handle specific error codes
    if (error.code === 4001) {
      errorMessage = "Network switch cancelled by user";
    } else if (error.code === -32602) {
      errorMessage = "Invalid network parameters";
    } else if (error.code === -32603) {
      errorMessage = mobile 
        ? "Please manually switch to BaseCAMP network in your wallet"
        : "Internal wallet error. Please try again";
    } else if (error.message?.includes('User rejected')) {
      errorMessage = "Network switch cancelled by user";
    } else {
      errorMessage = mobile 
        ? "Please manually add BaseCAMP network in your wallet settings" 
        : "Failed to switch network. Please try again";
    }
    
    return { success: false, error: errorMessage };
  }
};

export const isOnBaseCampNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId === BASE_CAMP_CHAIN_ID_HEX || 
           parseInt(chainId, 16).toString() === BASE_CAMP_CHAIN_ID;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

export const getNetworkDisplayInfo = (chainId: string) => {
  if (chainId === BASE_CAMP_CHAIN_ID || chainId === BASE_CAMP_CHAIN_ID_HEX) {
    return {
      name: "BaseCAMP",
      color: "text-green-500",
      isCorrect: true
    };
  }
  
  return {
    name: `Network ${chainId}`,
    color: "text-orange-500",
    isCorrect: false
  };
};