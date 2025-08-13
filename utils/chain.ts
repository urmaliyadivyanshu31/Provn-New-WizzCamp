import { Chain } from 'viem';

export const baseCAMPChain: Chain = {
  id: 123420001114,
  name: "BaseCAMP Network",
  nativeCurrency: {
    decimals: 18,
    name: "wCAMP",
    symbol: "wCAMP",
  },
  rpcUrls: {
    default: {
      http: [
        "https://rpc-campnetwork.xyz",
        "https://rpc.basecamp.t.raas.gelato.cloud",
      ],
    },
    public: {
      http: [
        "https://rpc-campnetwork.xyz",
        "https://rpc.basecamp.t.raas.gelato.cloud",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseCAMP Explorer",
      url: "https://basecamp.cloud.blockscout.com/",
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1,
    },
  },
};

// Legacy export for backward compatibility
export const testnet = baseCAMPChain;