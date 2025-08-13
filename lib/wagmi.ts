import { createConfig, http } from 'wagmi'
import { injected, walletConnect } from '@wagmi/connectors'
import { baseCAMP } from 'viem/chains'

// Custom BaseCAMP chain configuration
const baseCAMPChain = {
  ...baseCAMP,
  id: 123420001114,
  name: 'BaseCAMP Network',
  nativeCurrency: {
    name: 'wCAMP',
    symbol: 'wCAMP',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BASECAMP_RPC_URL || 'https://rpc-campnetwork.xyz'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_BASECAMP_RPC_URL || 'https://rpc-campnetwork.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseCAMP Explorer',
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://basecamp.cloud.blockscout.com/',
    },
  },
} as const

export const config = createConfig({
  chains: [baseCAMPChain],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
      metadata: {
        name: 'Provn Platform',
        description: 'Decentralized video platform with on-chain IP protection',
        url: 'https://provn.xyz',
        icons: ['https://provn.xyz/icon.png']
      }
    })
  ],
  transports: {
    [baseCAMPChain.id]: http(process.env.NEXT_PUBLIC_BASECAMP_RPC_URL || 'https://rpc-campnetwork.xyz')
  }
})
