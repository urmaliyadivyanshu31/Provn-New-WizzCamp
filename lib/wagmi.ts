import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

// Define Camp Network chain
export const campNetwork = defineChain({
  id: 123420001114,
  name: 'BaseCAMP Network',
  nativeCurrency: {
    decimals: 18,
    name: 'Camp',
    symbol: 'CAMP',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-campnetwork.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseCAMP Explorer',
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://basecamp.cloud.blockscout.com',
    },
  },
  testnet: true,
})

export const config = getDefaultConfig({
  appName: 'Provn',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [campNetwork],
  ssr: true,
})