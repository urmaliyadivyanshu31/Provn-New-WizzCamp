import { Chain } from 'viem';

export const testnet: Chain = {
  id: 123420001114,
  name: 'BaseCAMP',
  nativeCurrency: {
    name: 'CAMP',
    symbol: 'CAMP',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.basecamp.t.raas.gelato.cloud'],
    },
    public: {
      http: ['https://rpc.basecamp.t.raas.gelato.cloud'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseCAMP Explorer',
      url: 'https://basecamp.cloud.blockscout.com',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1,
    },
  },
};