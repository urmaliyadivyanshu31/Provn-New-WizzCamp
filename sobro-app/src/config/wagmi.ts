import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, polygon, polygonAmoy, base, baseSepolia } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia, polygon, polygonAmoy],
  connectors: [
    metaMask(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}