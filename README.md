# Provn - Own Your Content, Own Your Future

<div align="center">

![Provn Logo](./public/placeholder-logo.svg)

**The first short-form video platform with on-chain IP protection on Camp Network**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-06B6D4)](https://tailwindcss.com/)
[![Camp Network](https://img.shields.io/badge/Camp_Network-Blockchain-orange)](https://camp.network/)

[🚀 Live Demo](#) • [📖 Documentation](./CLAUDE.md) • [🐛 Report Bug](https://github.com/your-org/provn/issues) • [💡 Feature Request](https://github.com/your-org/provn/issues)

</div>

## 🌟 Overview

Provn revolutionizes content creation by providing creators with true ownership and protection of their intellectual property through blockchain technology. Built on the Camp Network, Provn enables creators to:

- **Upload & Protect**: Secure your content with on-chain IP protection via NFT minting
- **Monetize**: Earn from tips, licensing fees, and derivative work royalties
- **Connect**: Build a community around your creative work
- **Dispute**: Resolve content disputes through decentralized mechanisms

## ✨ Key Features

### 🎬 Content Creation & Protection
- **IP-NFT Minting**: Automatic blockchain registration for uploaded content
- **Derivative Tracking**: Track and monetize derivative works
- **Perceptual Hashing**: Advanced content fingerprinting for duplicate detection
- **Metadata Management**: Rich content tagging and categorization

### 💰 Creator Economy
- **Direct Tipping**: Fans can tip creators directly with crypto
- **Licensing System**: Monetize content through flexible licensing agreements
- **Revenue Sharing**: Transparent, automated royalty distribution
- **Creator Analytics**: Comprehensive dashboard with earnings insights

### 🔒 Security & Trust
- **Wallet-First Authentication**: No passwords, only crypto wallet integration
- **Decentralized Storage**: IPFS integration for censorship-resistant content
- **Dispute Resolution**: Community-driven content dispute system
- **Verification System**: Verified creator badges and authenticity checks

### 🎨 User Experience
- **3D Interactive Hero**: Stunning WebGL animations and particle effects
- **Responsive Design**: Optimized for all devices and screen sizes
- **Real-time Updates**: Live stats and notifications
- **Social Features**: Follow creators, discover trending content

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **PostgreSQL** 14+ database
- **IPFS** node or gateway access
- **Crypto Wallet** (MetaMask, WalletConnect, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/provn.git
   cd provn
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/provn"
   
   # Blockchain (Camp Network)
   NEXT_PUBLIC_CHAIN_ID="0x2105"
   NEXT_PUBLIC_RPC_URL="https://rpc.basecamp.network"
   NEXT_PUBLIC_CONTRACT_ADDRESS="0x1234567890abcdef1234567890abcdef12345678"
   NEXT_PUBLIC_EXPLORER_URL="https://explorer.basecamp.network"
   
   # IPFS
   IPFS_GATEWAY_URL="https://gateway.ipfs.io"
   IPFS_API_URL="https://api.ipfs.io"
   
   # Processing
   PROCESSING_WEBHOOK_SECRET="your-webhook-secret"
   
   # Optional: Analytics
   NEXT_PUBLIC_ANALYTICS_ID="your-analytics-id"
   ```

4. **Set up the database**
   ```bash
   # Create database and run schema
   psql -U postgres -c "CREATE DATABASE provn;"
   psql -U postgres -d provn -f scripts/database-schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **Three.js**: 3D graphics and WebGL effects
- **Radix UI**: Accessible component primitives

### Backend & Blockchain
- **Next.js API Routes**: Serverless API endpoints
- **PostgreSQL**: Relational database with full schema
- **Camp Network**: Layer 2 blockchain for IP protection
- **IPFS**: Decentralized content storage
- **Web3 Integration**: Wallet connectivity and smart contracts

### Key Components
```
├── 🏠 Landing Page          # 3D hero with feature showcase
├── 📤 Upload Interface      # Content creation and IP minting
├── 📊 Creator Dashboard     # Analytics and content management
├── 🎥 Video Player          # Custom player with blockchain features
├── 👤 User Profiles         # Creator profiles and social features
├── ⚖️ Dispute System        # Content dispute resolution
└── 🔍 Discovery Feed        # Content browsing and search
```

## 📊 Database Schema

Our comprehensive PostgreSQL schema includes:

- **Users**: Wallet-based profiles with social features
- **Videos**: Content metadata with blockchain references
- **Tips & Licenses**: Monetization transaction records
- **Disputes**: Community-driven dispute resolution
- **Processing Jobs**: Asynchronous content processing
- **Analytics**: Performance metrics and insights

[View complete schema →](./scripts/database-schema.sql)

## 🔧 API Reference

### Authentication
```bash
POST /api/auth/wallet          # Connect crypto wallet
```

### Content Management
```bash
POST /api/videos/upload        # Upload and mint video
GET  /api/videos/[id]          # Get video details
POST /api/videos/[id]/tip      # Send tip to creator
POST /api/videos/[id]/license  # Purchase content license
```

### User Management
```bash
GET  /api/users/[address]/profile    # Get user profile
PUT  /api/users/[address]/profile    # Update profile
```

### Analytics & Processing
```bash
GET  /api/analytics/dashboard        # Creator analytics
GET  /api/processing/[id]/status     # Check processing status
```

[View complete API documentation →](./CLAUDE.md#api-routes)

## 🎨 Design System

### Colors (CSS Custom Properties)
```css
--provn-bg: #0a0a0b           /* Primary background */
--provn-surface: #111113      /* Surface elements */
--provn-accent: #3b82f6       /* Brand accent */
--provn-text: #f8fafc         /* Primary text */
--provn-muted: #94a3b8         /* Secondary text */
```

### Typography
- **Headlines**: Space Grotesk (headings, hero text)
- **Body**: Inter (UI elements, content)

### Components
All components follow design system principles with consistent spacing, typography, and interaction patterns.

## 🔒 Security & Privacy

### Blockchain Security
- **Wallet-Only Authentication**: No centralized user accounts
- **On-Chain IP Protection**: Immutable content registration
- **Decentralized Storage**: IPFS for censorship resistance
- **Smart Contract Audited**: [Audit Report](#) (coming soon)

### Data Protection
- **GDPR Compliant**: Minimal data collection
- **End-to-End Encryption**: Sensitive data protection
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Zod schema validation

## 🚦 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```bash
docker build -t provn .
docker run -p 3000:3000 provn
```

### Environment Setup
1. **Database**: PostgreSQL with schema deployed
2. **IPFS**: Configure gateway and API access
3. **Blockchain**: Deploy smart contracts to Camp Network
4. **CDN**: Configure image and video optimization
5. **Monitoring**: Set up analytics and error tracking

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code quality
- **Prettier**: Automated code formatting
- **Testing**: Jest + Testing Library (coming soon)

## 📈 Roadmap

### Q1 2024
- [x] 3D Landing Page with Advanced Animations
- [x] Core UI Components and Design System
- [x] Database Schema and API Architecture
- [x] Blockchain Integration Framework
- [ ] Smart Contract Deployment
- [ ] IPFS Integration
- [ ] Wallet Connection UI

### Q2 2024
- [ ] Video Upload and Processing Pipeline
- [ ] Creator Dashboard and Analytics
- [ ] Tip and Licensing System
- [ ] Mobile App (React Native)

### Q3 2024
- [ ] Advanced Discovery and Search
- [ ] Social Features and Communities
- [ ] NFT Marketplace Integration
- [ ] Live Streaming Support

### Q4 2024
- [ ] Cross-Chain Integration
- [ ] Creator Monetization Tools
- [ ] Enterprise Features
- [ ] Global Launch

## 📞 Support & Community

- **Documentation**: [Technical Docs](./CLAUDE.md)
- **Discord**: [Join our community](#)
- **Twitter**: [@ProvnPlatform](#)
- **Email**: support@provn.io
- **Bug Reports**: [GitHub Issues](https://github.com/your-org/provn/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Camp Network** - Blockchain infrastructure
- **IPFS** - Decentralized storage
- **Vercel** - Deployment platform
- **Next.js Team** - Amazing React framework
- **Open Source Community** - Countless contributions

---

<div align="center">

**Built with ❤️ by the Provn Team**

[Website](#) • [Discord](#) • [Twitter](#) • [GitHub](https://github.com/your-org/provn)

</div>
