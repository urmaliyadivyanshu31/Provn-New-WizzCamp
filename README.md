# Provn - Content Licensing & IP-NFT Platform

<div align="center">

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/urmaliyadivyanshu31/Provn-New-WizzCamp)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Camp Network](https://img.shields.io/badge/powered%20by-Camp%20Network-ff6d01.svg)](https://camp.network)
[![Origin SDK](https://img.shields.io/badge/built%20with-Origin%20SDK-purple.svg)](https://docs.originprotocol.com)

**Live Platform**: [provn.fun](https://provn.fun) | **Demo**: [Watch Platform Demo](https://www.loom.com/share/e228fc775d8645e2a4bb68922dea8104)

*The decentralized platform where creators mint content as IP-NFTs and monetize through licensing*

</div>

---

## 🎯 What is Provn?

**Provn** is a decentralized content licensing platform that transforms how creators monetize and protect their intellectual property. Built on Camp Network using Origin SDK, Provn enables creators to:

- **Mint content as IP-NFTs** - Turn videos, images, and media into blockchain-protected assets
- **Set licensing terms** - Configure pricing, duration, and usage rights for your content
- **Earn from licensing** - Generate revenue when others license your IP for remixes and derivatives
- **Maintain ownership** - Retain full control and attribution rights over your intellectual property

### Core Platform Sections

```
📤 Upload Section - Mint content as IP-NFTs with licensing settings
🔍 Explore Section - Discover and license content from other creators  
👤 Profile Section - Manage your content portfolio and licensing analytics
📊 Dashboard Section - View creator leaderboards and platform statistics
⚖️ Licensing System - Configure pricing, duration, and usage rights
```

---

## ✨ Key Features

### 🎨 Content Creation & Minting
- **Multi-format Upload** - Support for video, audio, images, and documents
- **IP-NFT Minting** - Blockchain-based content protection via Origin SDK
- **Metadata Management** - Rich content descriptions, tags, and categorization
- **IPFS Storage** - Decentralized storage via Pinata integration

### 💰 Flexible Licensing System
- **Configurable Pricing** - Set CAMP token prices for content licensing
- **License Duration** - Define time periods (days, weeks, months, years)
- **License Types** - Basic, Commercial, and Full Rights licensing options
- **Quick Presets** - Pre-configured pricing and duration options for efficiency

### 🔄 Content Licensing & Remixing
- **License Marketplace** - Browse and purchase licenses for existing content
- **Derivative Creation** - Upload content based on licensed IP with proper attribution
- **Usage Tracking** - Monitor how your licensed content is being used
- **Attribution System** - Automatic crediting of original creators

### 👥 Creator Economy
- **Creator Profiles** - Customizable profiles with handles and portfolio display  
- **Social Features** - Follow creators, like content, and build community
- **Leaderboards** - Ranking system based on content performance and licensing revenue
- **Analytics Dashboard** - Track earnings, views, and licensing metrics

---

## 🏗 Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15 with React 18
- **Styling**: Tailwind CSS with custom Provn design system
- **Animations**: Framer Motion for smooth interactions
- **State Management**: React hooks + TanStack Query for server state
- **TypeScript**: Full type safety across the application

### Blockchain Integration  
- **Network**: Camp Network (EVM-compatible L2)
- **IP-NFT SDK**: Origin Protocol SDK for intellectual property tokenization
- **Wallet Connection**: Wagmi + Viem for Web3 integration
- **Smart Contracts**: Origin SDK contracts for IP-NFT minting and licensing

### Backend Infrastructure
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Storage**: IPFS via Pinata for decentralized content storage
- **API**: Next.js API routes with RESTful endpoints
- **Authentication**: Wallet-based authentication via signature verification

### Database Schema

```sql
-- Creator profiles
profiles (
  id, wallet_address, handle, display_name, 
  avatar_url, bio, twitter_handle, created_at
)

-- Content assets minted as IP-NFTs  
platform_videos (
  id, token_id, creator_id, title, description, video_url,
  thumbnail_url, ipfs_hash, price_per_period, license_duration,
  remixing_enabled, remixing_template, created_at
)

-- Social interactions
likes (video_id, user_address, created_at)
follows (follower_id, following_id, created_at)
comments (id, video_id, user_address, content, created_at)

-- Licensing system
licensing_transactions (
  id, token_id, licensee_address, license_type,
  price_paid, duration, transaction_hash, created_at
)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ 
- npm 9.8+
- Web3 wallet (MetaMask recommended)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/urmaliyadivyanshu31/Provn-New-WizzCamp.git
cd Provn-New-WizzCamp

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Configure your environment variables (see below)

# Start development server
npm run dev
```

### Environment Configuration

Create `.env.local` with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# IPFS Storage (Pinata)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token

# Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Camp Network RPC
NEXT_PUBLIC_CAMP_NETWORK_RPC=https://rpc.camp.network
```

### Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Create production build
npm run start    # Start production server  
npm run lint     # Run ESLint code analysis
```

---

## 🎮 Platform Usage Guide

### For Content Creators

#### 1. Upload & Mint Content
1. Navigate to `/upload`
2. Select your content file (video, image, etc.)
3. Fill in title, description, and tags
4. Configure licensing settings:
   - Set price in CAMP tokens
   - Choose license duration  
   - Select license type (Basic/Commercial/Full Rights)
5. Click "Upload & Mint" to create your IP-NFT

#### 2. Manage Licensing Settings
- **Pricing**: Set cost per licensing period in CAMP tokens
- **Duration**: Define how long each license lasts (1 day to 1 year)
- **License Types**:
  - **Basic License**: Social media reposting with attribution
  - **Commercial License**: Use in videos & commercial content
  - **Full Rights**: Complete usage freedom

#### 3. Track Performance
- View your content in your profile at `/u/[your-handle]`
- Monitor licensing revenue and content views
- Check creator leaderboards at `/dashboard`

### For Content Licensees

#### 1. Discover Content
- Browse content at `/explore` 
- Use search and filters to find specific content types
- View creator profiles and their content portfolios

#### 2. License Content
1. Click on content you want to license
2. Review licensing terms and pricing
3. Select number of license periods needed
4. Connect wallet and approve transaction
5. Content is now licensed for your use

#### 3. Create Derivatives
- Upload derivative content at `/upload/derivative`  
- Reference original licensed content
- Automatic attribution to original creators
- Your derivative can also be licensed by others

---

## 🔌 API Reference

### Content Management
```http
POST   /api/minted-content           # Upload and mint new content
GET    /api/video/[tokenId]          # Get content metadata  
POST   /api/videos/[id]/view         # Track content views
POST   /api/videos/[id]/like         # Like/unlike content
```

### Profile Management  
```http
GET    /api/profile/[id]             # Get creator profile
POST   /api/profile/[id]/sync-videos # Sync blockchain content data
POST   /api/follow                   # Follow/unfollow creators
```

### Licensing System
```http
GET    /api/licensing/[tokenId]      # Get licensing terms
POST   /api/licensing/purchase       # Purchase content license  
GET    /api/licensing/owned          # Get user's licensed content
```

### Platform Data
```http
GET    /api/explore/feed             # Get content discovery feed
GET    /api/leaderboard              # Get creator rankings
GET    /api/platform-stats           # Get platform metrics
```

### Response Format
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "metadata": {}
  },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

## 🛡 Licensing System Deep Dive

### License Types

#### Basic License
- **Use Case**: Social media reposting, sharing
- **Requirements**: Attribution required
- **Restrictions**: No commercial use, no derivatives
- **Typical Duration**: 30-90 days
- **Price Range**: 0.1 - 1 CAMP

#### Commercial License  
- **Use Case**: Videos, advertisements, commercial content
- **Requirements**: Attribution required
- **Permissions**: Commercial use, derivatives allowed
- **Typical Duration**: 90 days - 1 year  
- **Price Range**: 1 - 10 CAMP

#### Full Rights
- **Use Case**: Complete creative freedom
- **Requirements**: No attribution required
- **Permissions**: All usage rights, full ownership transfer
- **Typical Duration**: Perpetual or 1+ years
- **Price Range**: 10+ CAMP

### Pricing Strategy
- **Free Content**: 0 CAMP (open licensing)
- **Quick Presets**: 0.1, 0.5, 1.0, 2.0, 5.0 CAMP
- **Duration Presets**: 1 day, 1 week, 1 month, 3 months, 1 year
- **Custom Settings**: Flexible pricing and duration

---

## 🌊 User Flow Examples

### Creator Journey
```
1. Connect Wallet → 2. Upload Content → 3. Set Licensing Terms → 
4. Mint IP-NFT → 5. Content Goes Live → 6. Earn from Licenses
```

### Licensee Journey  
```
1. Explore Content → 2. Find Desired Content → 3. Review License Terms →
4. Purchase License → 5. Download/Use Content → 6. Create Derivatives
```

### Platform Ecosystem
```
Creators ←→ Content Library ←→ Licensees
    ↓           ↓                ↓
Earn Revenue → IP Protection → Creative Freedom
```

---

## 🔧 Development Guide

### Project Structure
```
app/                 # Next.js app router
├── upload/         # Content upload & minting
├── explore/        # Content discovery
├── dashboard/      # Creator leaderboards  
├── profile/        # Creator profile pages
├── u/[handle]/     # Public creator profiles
├── video/[tokenId] # Individual content pages
└── api/            # API endpoints

components/
├── upload/         # Upload flow components
├── explore/        # Content discovery UI
├── licensing/      # Licensing system UI
├── profile/        # Profile management
└── provn/          # Design system components

types/              # TypeScript definitions
services/           # API service layers
hooks/              # Custom React hooks
styles/             # CSS and styling
```

### Key Components

- **RemixingSettings.tsx** - Configure licensing terms during upload
- **LicensingModal.tsx** - Purchase licenses for existing content  
- **VideoFeed.tsx** - Content discovery and browsing
- **VideoDetailsModal.tsx** - View content details and licensing info
- **ProfilePage.tsx** - Creator profile with content portfolio

### Adding New Features

1. **New License Type**: Update `LICENSE_TYPES` in `RemixingSettings.tsx`
2. **New Content Format**: Extend upload validation in `upload/page.tsx`
3. **New API Endpoint**: Create in `app/api/` with proper authentication
4. **New UI Component**: Follow design system patterns in `components/provn/`

---

## 📊 Platform Statistics

### Current Metrics
- **Active Creators**: 10+
- **Content Library**: 50+ IP-NFTs minted
- **License Revenue**: Generated through CAMP token transactions
- **Supported Formats**: Video, audio, images, documents

### Content Categories
- Educational content and tutorials
- Creative media and art
- Music and audio content  
- Photography and visual assets
- Template and design resources

---

## 🚀 Deployment

### Production Build
```bash
# Create optimized build
npm run build

# Start production server
npm start
```

### Environment Variables for Production
Ensure all environment variables are configured in your deployment platform:
- Supabase credentials
- Pinata IPFS configuration  
- WalletConnect project ID
- Camp Network RPC endpoint

### Deployment Platforms
- **Vercel** (recommended): Optimized for Next.js
- **Netlify**: Alternative with serverless functions
- **Docker**: Containerized deployment option

---

## 🤝 Contributing

We welcome contributions to improve Provn! Here's how you can help:

### Areas for Contribution
- **Frontend Development**: New features, UI improvements, mobile optimization
- **Smart Contract Integration**: Enhanced Origin SDK integration  
- **API Development**: New endpoints, optimization, caching
- **Documentation**: User guides, technical docs, API documentation
- **Testing**: Unit tests, integration tests, end-to-end testing

### Development Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. Test thoroughly on local development environment
5. Submit pull request with clear description

### Code Standards
- **TypeScript**: Strict mode with comprehensive typing
- **Components**: Functional components with custom hooks
- **Styling**: Tailwind CSS following design system
- **API**: RESTful endpoints with proper error handling

---

## 🛡 Security & Privacy

### Smart Contract Security
- **Origin SDK Integration**: Using audited contracts from Origin Protocol
- **Wallet Security**: Non-custodial wallet connections
- **Transaction Verification**: All blockchain transactions verified on-chain

### Application Security  
- **Input Validation**: Comprehensive sanitization and validation
- **CORS Configuration**: Properly configured cross-origin policies
- **Rate Limiting**: API endpoint protection against abuse
- **Content Moderation**: Automated screening for inappropriate content

### Privacy Protection
- **Minimal Data Collection**: Only essential information stored
- **Decentralized Storage**: IPFS for content, not centralized servers
- **User Control**: Creators maintain full control over their content

---

## 🔗 Ecosystem Integration

### Camp Network
- **Layer 2 Solution**: Fast, cheap transactions for content licensing
- **EVM Compatible**: Use existing Ethereum tools and wallets
- **Origin SDK**: Native IP-NFT minting and management

### Origin Protocol
- **IP-NFT Standard**: Proven intellectual property tokenization
- **Licensing Framework**: Built-in licensing and revenue sharing
- **Creator Tools**: Comprehensive creator economy infrastructure

### IPFS Network
- **Decentralized Storage**: Content stored across distributed network
- **Pinata Integration**: Reliable pinning service for content availability
- **Content Addressing**: Cryptographic content verification

---

## 📋 Roadmap

### Phase 1 ✅ (Current - MVP)
- [x] Content upload and IP-NFT minting
- [x] Basic licensing system with pricing
- [x] Content discovery and exploration  
- [x] Creator profiles and social features
- [x] Mobile-responsive design

### Phase 2 🔄 (In Progress)
- [ ] Advanced analytics dashboard for creators
- [ ] Batch licensing for multiple content pieces
- [ ] Enhanced content search and filtering
- [ ] Creator collaboration tools
- [ ] Mobile app development

### Phase 3 📅 (Planned)
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Creator marketplace for exclusive content
- [ ] Subscription-based licensing models
- [ ] AI-powered content recommendations
- [ ] Advanced royalty splitting

### Long-term Vision 🚀
- [ ] Decentralized governance (DAO)
- [ ] Cross-platform content syndication
- [ ] Creator fund and grants program
- [ ] Enterprise licensing solutions

---

## 🆘 Support & Community

### Getting Help
- **Documentation**: Comprehensive guides in this README
- **GitHub Issues**: Report bugs and request features
- **Discord Community**: Join creator discussions (coming soon)

### Contact
- **Creator**: [Divyanshu Urmaliya](https://twitter.com/divyanshueth)
- **Platform**: [provn.fun](https://provn.fun)
- **Twitter**: [@provndotfun](https://twitter.com/provndotfun)

---

## 📄 License & Legal

### Open Source License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Intellectual Property
- Content uploaded to Provn remains owned by original creators
- Platform code is open source under MIT license
- Origin SDK usage follows Origin Protocol terms

### Attribution
- **Built on**: [Camp Network](https://camp.network)
- **Powered by**: [Origin Protocol SDK](https://docs.originprotocol.com)  
- **Created by**: [Divyanshu Urmaliya](https://twitter.com/divyanshueth)
- **Storage**: [IPFS](https://ipfs.tech) via [Pinata](https://pinata.cloud)

---

<div align="center">

**🚀 Ready to revolutionize content licensing?**

[Start Creating](https://provn.fun/upload) • [Explore Content](https://provn.fun/explore) • [Join Community](https://twitter.com/provndotfun)

*Built for the future of creator intellectual property*

</div>