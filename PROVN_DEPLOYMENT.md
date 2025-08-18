# 🚀 PROVN Token Deployment Guide

## 🎯 **Complete PROVN Token Tipping System**

This guide will help you deploy the PROVN token contract and set up the complete tipping system on the BaseCAMP network.

## 📋 **Prerequisites**

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **MetaMask** or other Web3 wallet
4. **BaseCAMP network** configured in your wallet
5. **Some testnet ETH** for gas fees

## 🔧 **Step 1: Install Dependencies**

```bash
# Install Hardhat and OpenZeppelin contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts

# Install ethers.js for frontend integration
npm install ethers@5.7.2
```

## 🌐 **Step 2: Configure BaseCAMP Network**

Add BaseCAMP network to MetaMask:

- **Network Name**: BaseCAMP
- **RPC URL**: https://rpc.basecamp.t.raas.gelato.cloud
- **Chain ID**: 123420001114
- **Currency Symbol**: CAMP
- **Block Explorer**: https://basecamp.cloud.blockscout.com/

## 🔑 **Step 3: Set Environment Variables**

Create a `.env` file in your project root:

```env
# BaseCAMP Network Configuration
BASECAMP_RPC_URL=https://rpc.basecamp.t.raas.gelato.cloud
BASECAMP_CHAIN_ID=123420001114
BASECAMP_EXPLORER_URL=https://basecamp.cloud.blockscout.com

# Deployer Private Key (for contract deployment)
PRIVATE_KEY=your_private_key_here

# PROVN Token Contract (will be filled after deployment)
PROVN_TOKEN_ADDRESS=

# Frontend Environment Variable
NEXT_PUBLIC_PROVN_TOKEN_ADDRESS=
```

## 🚀 **Step 4: Deploy PROVN Token Contract**

```bash
# Compile contracts
npx hardhat compile

# Deploy to BaseCAMP network
npx hardhat run scripts/deploy-provn-token.js --network basecamp
```

## 📝 **Step 5: Update Frontend Configuration**

After successful deployment, update your `.env` file with the contract address:

```env
PROVN_TOKEN_ADDRESS=0x... # Address from deployment
NEXT_PUBLIC_PROVN_TOKEN_ADDRESS=0x... # Same address for frontend
```

## 🧪 **Step 6: Test the System**

1. **Connect wallet** to BaseCAMP network
2. **Open tip modal** - should show 0 PROVN balance
3. **Click "Get Free PROVN Tokens"** - should receive 100 PROVN
4. **Try tipping** - should work with real blockchain transactions

## 🎁 **How the Faucet Works**

- **New users** automatically get 100 PROVN tokens
- **24-hour cooldown** between faucet requests
- **One-time faucet** per address (can request again after cooldown)
- **Owner can manually** send tokens to any address

## 💰 **Tipping System Features**

- **Real-time balance** from smart contract
- **Balance validation** before sending tips
- **Transaction confirmation** with real blockchain hashes
- **Database tracking** of all tips for analytics
- **Professional UX** with loading states and error handling

## 🔒 **Security Features**

- **Reentrancy protection** using OpenZeppelin
- **Pausable functionality** for emergency situations
- **Owner-only functions** for administrative tasks
- **Input validation** and error handling
- **Gas optimization** for cost-effective transactions

## 📊 **Contract Specifications**

- **Token Name**: PROVN
- **Token Symbol**: PROVN
- **Decimals**: 18
- **Initial Supply**: 1,000,000 PROVN
- **Faucet Amount**: 100 PROVN per user
- **Faucet Cooldown**: 24 hours
- **Network**: BaseCAMP (Chain ID: 123420001114)

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Insufficient funds"** - Need testnet ETH for gas
2. **"Wrong network"** - Ensure wallet is on BaseCAMP
3. **"Contract not found"** - Check contract address in .env
4. **"Ethers.js not loaded"** - Check CDN loading in layout.tsx

### **Debug Commands:**

```bash
# Check contract on BaseCAMP explorer
# Replace with your contract address
curl "https://basecamp.cloud.blockscout.com/api/v2/addresses/YOUR_CONTRACT_ADDRESS"

# Verify contract compilation
npx hardhat verify --network basecamp YOUR_CONTRACT_ADDRESS
```

## 🎉 **Success Indicators**

✅ **Contract deployed** with address saved  
✅ **Frontend shows** PROVN balance  
✅ **Faucet works** - users get 100 PROVN  
✅ **Tipping works** - real blockchain transactions  
✅ **Balance updates** after successful tips  
✅ **Database tracks** all tip transactions  

## 🔄 **Next Steps**

1. **Test thoroughly** with multiple wallets
2. **Monitor gas costs** and optimize if needed
3. **Add analytics** dashboard for tip statistics
4. **Implement batch tipping** for multiple creators
5. **Add tip history** display in user profiles

## 📞 **Support**

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify network configuration in MetaMask
3. Ensure contract address is correctly set in .env
4. Check that you have sufficient testnet ETH for gas

---

**🎯 Your PROVN token tipping system is now ready for production use!**
