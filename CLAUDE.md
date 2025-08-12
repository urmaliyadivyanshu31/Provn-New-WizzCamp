# CLAUDE.md - Provn Platform Technical Documentation

This document contains comprehensive technical information about the Provn platform codebase for Claude AI assistant.

## Project Overview

**Provn** is a decentralized short-form video platform with on-chain IP protection built on the Camp Network. It enables creators to upload, protect, and monetize their content through blockchain technology.

## Build & Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
# Note: No test framework configured yet
```

## Technology Stack

- **Framework**: Next.js 15.2.4 (React 19)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion + GSAP 3.12.5
- **3D Graphics**: Three.js 0.169.0
- **Forms**: React Hook Form + Zod validation
- **Blockchain**: Camp Network (BaseCAMP)
- **Database**: PostgreSQL (schema defined)
- **Storage**: IPFS integration

## Directory Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── auth/          # Authentication (wallet)
│   │   ├── derivatives/   # Derivative content creation
│   │   ├── disputes/      # Content dispute system
│   │   ├── processing/    # Video processing status
│   │   ├── users/         # User profile management
│   │   └── videos/        # Video upload/licensing/tips
│   ├── dashboard/         # Creator dashboard
│   ├── disputes/          # Dispute filing interface
│   ├── profile/           # User profile pages
│   ├── provs/             # Video browsing/discovery
│   ├── upload/            # Content upload interface
│   ├── video/             # Individual video pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── provn/             # Platform-specific components
│   │   ├── animated-counter.tsx   # Animated number counter
│   │   ├── badge.tsx              # Badge component
│   │   ├── button.tsx             # Button component
│   │   ├── card.tsx               # Card component
│   │   ├── feature-showcase.tsx   # Feature display
│   │   ├── hero-3d.tsx            # 3D animated hero section
│   │   ├── navigation.tsx         # Main navigation
│   │   └── video-player.tsx       # Video player component
│   └── theme-provider.tsx # Theme management
├── lib/                   # Utility libraries
│   ├── blockchain.ts      # Blockchain service integration
│   ├── ipfs.ts           # IPFS storage utilities
│   ├── processing.ts     # Video processing logic
│   └── utils.ts          # General utilities
├── public/               # Static assets
├── scripts/              # Database and utility scripts
│   └── database-schema.sql # Complete PostgreSQL schema
└── styles/               # Additional stylesheets
    └── globals.css
```

## Key Components

### Core Pages

- **`app/page.tsx`**: Landing page with 3D hero, feature showcase, stats
- **`app/upload/page.tsx`**: Video upload interface with blockchain integration
- **`app/dashboard/page.tsx`**: Creator analytics and content management
- **`app/video/[id]/page.tsx`**: Individual video viewing with tip/license options
- **`app/disputes/new/page.tsx`**: Content dispute filing system

### UI Components (`components/provn/`)

- **`hero-3d.tsx`**: Advanced 3D animated hero with particle system and floating elements
- **`navigation.tsx`**: Main navigation with wallet integration
- **`video-player.tsx`**: Custom video player with blockchain features
- **`feature-showcase.tsx`**: Interactive feature demonstration
- **`animated-counter.tsx`**: Smooth number animations for stats

### Blockchain Integration (`lib/blockchain.ts`)

- **`BlockchainService`**: Main service class for Camp Network integration
- **`IpNFTMetadata`**: Interface for NFT metadata structure
- **`BASECAMP_CONFIG`**: Network configuration for Camp Network
- **Functions**:
  - `mintIpNFT()`: Mint IP-protected NFTs
  - `transferTokens()`: Handle token transfers
  - `verifyOwnership()`: Verify NFT ownership
  - `getTokenMetadata()`: Retrieve NFT metadata

### Database Schema (`scripts/database-schema.sql`)

Complete PostgreSQL schema including:

- **`users`**: User profiles and wallet addresses
- **`videos`**: Video metadata, IPFS hashes, blockchain references
- **`video_tags`**: Tag system for content categorization
- **`video_stats`**: View counts, earnings, tips aggregation
- **`tips`**: Tip transactions and messages
- **`licenses`**: Content licensing agreements
- **`disputes`**: Content dispute management
- **`processing_jobs`**: Async video processing status
- **`user_follows`**: Social follow relationships
- **`notifications`**: User notification system

## API Routes

### Authentication
- **`POST /api/auth/wallet`**: Wallet connection and authentication

### Video Management
- **`POST /api/videos/upload`**: Upload and mint video as IP-NFT
- **`GET /api/videos/[id]`**: Get video metadata and stats
- **`POST /api/videos/[id]/tip`**: Send tips to creators
- **`POST /api/videos/[id]/license`**: Purchase content licenses

### User Management
- **`GET /api/users/[address]/profile`**: Get user profile
- **`PUT /api/users/[address]/profile`**: Update user profile

### Content Creation
- **`POST /api/derivatives/create`**: Create derivative content

### Dispute System
- **`POST /api/disputes`**: File content disputes

### Analytics
- **`GET /api/analytics/dashboard`**: Creator dashboard analytics

### Processing
- **`GET /api/processing/[id]/status`**: Get processing job status

## Features Implemented

### ✅ Core Platform Features

1. **3D Animated Landing Page**
   - Particle system with dynamic animations
   - Floating video frames with mouse interaction
   - Framer Motion transitions and GSAP effects
   - Fixed hydration issues for SSR compatibility

2. **Blockchain Integration**
   - Camp Network (BaseCAMP) configuration
   - IP-NFT minting system
   - Wallet authentication framework
   - Token transfer utilities

3. **Content Management**
   - Video upload interface
   - Metadata management
   - Tag system
   - Content processing pipeline

4. **Social Features**
   - User profiles with handles
   - Follow system
   - Tip functionality
   - Creator analytics

5. **Dispute System**
   - Content reporting mechanism
   - Case management
   - Evidence collection
   - Moderation workflow

6. **Database Architecture**
   - Complete PostgreSQL schema
   - Automatic timestamp triggers
   - Stats aggregation functions
   - Performance indexes

### 🚧 Partial Implementation

1. **Video Processing**
   - Processing job tracking
   - Status monitoring
   - Mock processing implementation

2. **Payment System**
   - Tip transaction structure
   - License purchasing framework
   - Revenue sharing logic

### 📋 Planned Features

1. **Mobile Responsiveness**
2. **Advanced Search & Discovery**
3. **Live Streaming Integration**
4. **NFT Marketplace Integration**
5. **Advanced Analytics Dashboard**

## Configuration Files

- **`next.config.mjs`**: Next.js configuration with build optimizations
- **`package.json`**: Dependencies and scripts
- **`tsconfig.json`**: TypeScript configuration
- **`components.json`**: UI component configuration
- **`postcss.config.mjs`**: PostCSS and Tailwind setup

## Environment Variables

```bash
# Blockchain
NEXT_PUBLIC_CHAIN_ID=0x2105
NEXT_PUBLIC_RPC_URL=https://rpc.basecamp.network
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678

# Database
DATABASE_URL=postgresql://...

# IPFS
IPFS_GATEWAY_URL=https://gateway.ipfs.io
IPFS_API_URL=https://api.ipfs.io

# Processing
PROCESSING_WEBHOOK_SECRET=...
```

## Security Considerations

- Wallet-based authentication only
- No centralized user accounts
- IPFS for decentralized storage
- On-chain IP protection
- Input validation with Zod
- Rate limiting on API routes

## Performance Optimizations

- Next.js Image optimization disabled for flexibility
- Framer Motion lazy loading
- Database indexes for common queries
- Component-level code splitting
- Static asset optimization

## Known Issues

1. **Fixed**: Hydration errors in hero-3d.tsx (particles now render client-side only)
2. ESLint/TypeScript errors ignored during builds (temporary)
3. No test framework configured yet
4. Mock blockchain implementations need real integration

## Development Notes

- Uses latest React 19 features
- Tailwind CSS 4.x with CSS-in-JS support
- Extensive use of Framer Motion for animations
- Radix UI for accessible component primitives
- TypeScript strict mode enabled
- Auto-formatting with Prettier (implied)

## Content Types Supported

- Short-form videos (primary)
- Derivative/remix content
- User-generated tags
- Creator profiles
- Licensing agreements
- Tip messages

## Blockchain Integration Status

- ✅ Service layer architecture
- ✅ Camp Network configuration
- ✅ NFT metadata interfaces
- ✅ Mock implementation for development
- ❌ Real Web3 provider integration
- ❌ Smart contract deployment
- ❌ Wallet connection UI

This documentation should be updated as features are implemented and the codebase evolves.