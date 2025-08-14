#!/bin/bash

# Setup script for Provn Platform environment variables
echo "Setting up environment variables for Provn Platform..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    
    # Create .env.local with Camp Network configuration
    cat > .env.local << EOF
# Camp Network Origin SDK Configuration
NEXT_PUBLIC_CAMP_NETWORK_API_KEY=4f1a2c9c-008e-4a2e-8712-055fa04f9ffa
NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID=fce77d7a-8085-47ca-adff-306a933e76aa
NEXT_PUBLIC_CAMP_NETWORK_ENVIRONMENT=testnet
NEXT_PUBLIC_ORIGIN_API=https://api.origin.campnetwork.xyz
NEXT_PUBLIC_SUBGRAPH_URL=https://api.origin.campnetwork.xyz/graphql

# Para API Configuration (Wallet Connection) - Test Credentials
NEXT_PUBLIC_PARA_API_KEY=4f1a2c9c-008e-4a2e-8712-055fa04f9ffa

# BaseCAMP Network Configuration
NEXT_PUBLIC_RPC_URL=https://rpc-campnetwork.xyz
NEXT_PUBLIC_EXPLORER_URL=https://basecamp.cloud.blockscout.com/
NEXT_PUBLIC_CHAIN_ID=123420001114
NEXT_PUBLIC_IPNFT_CONTRACT=0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981
NEXT_PUBLIC_TOKEN_CONTRACT=0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b

# IPFS Configuration (Pinata) - Update with your actual token
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token_here

# Database Configuration (if needed)
DATABASE_URL=postgresql://username:password@localhost:5432/provn

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
EOF

    echo "✅ .env.local file created successfully!"
    echo "⚠️  Please update the following values in .env.local:"
    echo "   - NEXT_PUBLIC_PINATA_JWT: Your Pinata JWT token"
    echo "   - DATABASE_URL: Your database connection string"
    echo "   - JWT_SECRET: A secure random string"
else
    echo "✅ .env.local file already exists"
fi

echo ""
echo "Environment setup complete! 🎉"
echo "Next steps:"
echo "1. Update the values in .env.local with your actual credentials"
echo "2. Restart your development server"
echo "3. Try minting an IP-NFT again"
echo ""
echo "🔑 Test credentials have been configured:"
echo "   - Camp Network API Key: 4f1a2c9c-008e-4a2e-8712-055fa04f9ffa"
echo "   - Camp Network Client ID: fce77d7a-8085-47ca-adff-306a933e76aa"
echo "   - Para API Key: 4f1a2c9c-008e-4a2e-8712-055fa04f9ffa"
echo "   - Origin API URL: https://api.origin.campnetwork.xyz"
