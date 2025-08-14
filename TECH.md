# Technical Architecture

## Core Technologies

### Frontend
- **Next.js 15**: App router with RSC
- **React 19**: Latest hooks and concurrent features
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling

### Blockchain & Web3
- **Origin SDK (@campnetwork/origin)**: IP-NFT minting on Camp Network
- **Wagmi**: Ethereum wallet connector
- **Viem**: Low-level Ethereum library
- **Camp Network**: Testnet blockchain (Chain ID: 123420001114)

### Storage & APIs
- **Pinata**: IPFS pinning service
- **IPFS**: Decentralized file storage
- **PostgreSQL**: Main database
- **Redis**: Job queue and caching

## Key Components

### `/app/simple-mint/page.tsx`
Main minting interface with:
- Drag & drop file upload
- IPFS integration via Pinata
- Origin SDK wallet connection
- IP-NFT metadata creation

### `/components/providers.tsx`
Provider configuration:
- WagmiProvider for wallet connection
- CampProvider for Origin SDK
- QueryClient for data fetching

### `/lib/wagmi.ts`
Wagmi configuration:
- Camp Network chain definition
- RainbowKit wallet connectors
- WalletConnect project setup

## Data Flow

1. **File Upload**: User selects file → validate size/type → create preview
2. **IPFS Upload**: File → Pinata API → IPFS hash → Gateway URL
3. **Metadata Creation**: Form data + IPFS URL → NFT metadata JSON
4. **Minting**: File + metadata + license → Origin SDK → Transaction
5. **Success**: Clear form → show success message

## Environment Setup

### Required Variables
```bash
NEXT_PUBLIC_PINATA_JWT=eyJ...          # Pinata authentication
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # WalletConnect project
NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID=    # Origin SDK client ID
```

### Network Configuration
- **RPC**: https://rpc-campnetwork.xyz
- **Explorer**: https://basecamp.cloud.blockscout.com
- **Chain ID**: 123420001114
- **Native Token**: CAMP

## File Structure

```
/app/
  simple-mint/page.tsx    # Main minting UI
  layout.tsx              # Root layout
/components/
  providers.tsx           # Web3 providers
  provn/                  # UI components
/lib/
  wagmi.ts               # Wallet config
  origin.ts              # Origin SDK utils
```

## Dependencies

### Core
- `@campnetwork/origin`: ^0.0.17
- `wagmi`: ^2.16.3
- `viem`: ^2.33.3
- `@rainbow-me/rainbowkit`: ^2.2.8

### UI
- `sonner`: Toast notifications
- `framer-motion`: Animations
- `lucide-react`: Icons

### Dev
- TypeScript, Tailwind CSS, PostCSS