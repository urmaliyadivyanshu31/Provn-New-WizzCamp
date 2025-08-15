# SoBro App

A modern travel companion application that combines AI-powered travel planning with blockchain-powered memory preservation. Built with React, TypeScript, and integrated with Camp Network for decentralized identity and IP-NFT functionality.

## 🌟 Features

### 🤖 AI Travel Assistant
- **Intelligent Travel Planning**: AI-powered chat interface for personalized travel recommendations
- **Interactive Destinations**: Explore trending destinations with immersive visual cards
- **Real-time Assistance**: Get instant travel advice, itinerary planning, and local insights
- **Agent Mode**: Toggle between different AI personalities for specialized travel advice

### 🖼️ Memory Vault
- **Blockchain Memories**: Upload and mint your travel photos as IP-NFTs on the blockchain
- **Immutable Storage**: Photos stored on IPFS for permanent preservation
- **Custom Licensing**: Set licensing terms and royalties for your memory NFTs
- **Gallery View**: Browse and manage your minted memory collection

### 🔐 Web3 Integration
- **Camp Network Authentication**: Secure wallet connection using Camp Network Origin SDK
- **Decentralized Identity**: Connect with MetaMask and other supported wallets
- **IP-NFT Minting**: Turn memories into intellectual property NFTs
- **IPFS Storage**: Decentralized file storage via Pinata

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible component primitives
- **Framer Motion** for animations
- **GSAP** for advanced animations

### Blockchain & Web3
- **Camp Network Origin SDK** for authentication and IP-NFT minting
- **Viem** for Ethereum interactions
- **IPFS** via Pinata for decentralized storage
- **MetaMask** wallet integration

### UI/UX
- **Lucide React** for icons
- **Next Themes** for dark/light mode
- **Sonner** for toast notifications
- **React Router** for navigation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sobro-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Camp Network Configuration
   VITE_ORIGIN_API_KEY=your_origin_api_key
   VITE_ORIGIN_CLIENT_ID=your_origin_client_id
   VITE_ORIGIN_API=https://api.origin.campnetwork.xyz
   
   # IPFS Storage (Pinata)
   VITE_PINATA_JWT=your_pinata_jwt_token
   
   # Optional: Supabase (if using database features)
   SUPABASE_URL=your_supabase_url
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📱 Key Components

### Travel Planning
- **TravelHomeUi**: Main dashboard with destination cards and AI chat
- **TravelChatUI**: Full-featured AI chat interface for travel planning
- **MagicBento**: Interactive card grid for destinations and inspiration

### Memory Management
- **CampMemories**: Main memory vault interface
- **ImageUploader**: Upload and mint photos as IP-NFTs
- **Memories**: Gallery view of minted memories

### Authentication
- **CampAuth**: Camp Network wallet connection component
- **useUserProfile**: User profile management hook
- **useCampfireIntegration**: IP-NFT minting and IPFS upload logic

## 🔧 Configuration

### Camp Network Setup
1. Register at [Camp Network](https://camp.network)
2. Create an Origin application
3. Get your API key and client ID
4. Configure redirect URIs for your domain

### Pinata IPFS Setup
1. Create account at [Pinata](https://pinata.cloud)
2. Generate API key with appropriate scopes
3. Add JWT token to environment variables

## 📖 Usage

### Travel Planning
1. **Connect Wallet**: Use Camp Network authentication
2. **Explore Destinations**: Browse trending locations and inspiration
3. **Chat with AI**: Ask questions about travel planning
4. **Get Recommendations**: Receive personalized travel advice

### Memory Preservation
1. **Upload Photos**: Select travel photos from your device
2. **Add Metadata**: Provide title and description
3. **Set Licensing**: Configure royalties and usage terms
4. **Mint as NFT**: Create permanent blockchain record
5. **View Gallery**: Browse your memory collection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Camp Network** for Web3 authentication and IP-NFT infrastructure
- **Pinata** for IPFS storage solutions
- **OpenAI** for AI-powered travel assistance
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling

## 📞 Support

For support, email support@sobro-app.com or join our community Discord.

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Integration with travel booking APIs
- [ ] Social features for sharing memories
- [ ] Multi-chain support
- [ ] Advanced AI travel agent capabilities
- [ ] Travel itinerary NFTs
- [ ] Community marketplace for travel memories

---

Built with ❤️ for travelers and Web3 enthusiasts