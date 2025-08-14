# Provn - Simple IP-NFT Minting Platform

A streamlined platform for minting files as IP-NFTs using Origin SDK on Camp Network.

## Features

- 📁 **File Upload**: Support for images, videos, and audio files (up to 10MB)
- 🔗 **IPFS Integration**: Automatic upload to IPFS via Pinata
- 🎯 **Origin SDK Minting**: Direct IP-NFT creation on Camp Network
- 💼 **Wallet Connection**: Seamless authentication with Origin SDK
- 📱 **Responsive Design**: Works on desktop and mobile

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Add your Pinata JWT token to .env.local
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Visit the app**
   - Main app: http://localhost:3000
   - Simple mint: http://localhost:3000/simple-mint

## Usage

1. Navigate to `/simple-mint`
2. Upload any image, video, or audio file
3. Connect wallet through Origin SDK
4. Fill in IP name and description
5. Click "Mint IP-NFT"

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Blockchain**: Camp Network (testnet)
- **Wallet**: Origin SDK + Wagmi
- **Storage**: IPFS via Pinata
- **Styling**: Tailwind CSS
- **UI**: Custom Provn components

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## License

MIT
