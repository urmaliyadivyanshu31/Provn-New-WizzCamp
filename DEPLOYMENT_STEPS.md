# 🚀 PROVN Token Deployment Steps

## ✅ **Step 1: Environment Setup (COMPLETED)**

The environment is already configured with:
- ✅ Hardhat v2.19.0 installed
- ✅ OpenZeppelin contracts v5.4.0 installed
- ✅ Ethers.js v5.7.2 installed
- ✅ PROVN token contract compiled successfully
- ✅ BaseCAMP network configuration ready

## 🔑 **Step 2: Set Your Private Key**

1. **Copy the environment file:**
   ```bash
   cp env.provn .env
   ```

2. **Edit `.env` and replace:**
   ```env
   PRIVATE_KEY=your_actual_private_key_here
   ```
   
   **⚠️ IMPORTANT:** Use a wallet with some testnet ETH for gas fees

## 🌐 **Step 3: Configure MetaMask**

Add BaseCAMP network to MetaMask:

- **Network Name**: BaseCAMP
- **RPC URL**: https://rpc.basecamp.t.raas.gelato.cloud
- **Chain ID**: 123420001114
- **Currency Symbol**: CAMP
- **Block Explorer**: https://basecamp.cloud.blockscout.com/

## 🚀 **Step 4: Deploy PROVN Token**

```bash
# Deploy to BaseCAMP network
npx hardhat run scripts/deploy-provn-token.js --network basecamp
```

**Expected Output:**
```
🚀 Deploying PROVN Token Contract to BaseCAMP Network...
📝 Deploying contract...
✅ PROVN Token deployed to: 0x...
🔗 Contract address: 0x...
📊 Initial supply: 1,000,000 PROVN
🎁 Faucet amount: 100 PROVN per user
⏰ Faucet cooldown: 24 hours
```

## 📝 **Step 5: Update Environment**

After successful deployment, copy the contract address and update `.env`:

```env
PROVN_TOKEN_ADDRESS=0x... # Address from deployment
NEXT_PUBLIC_PROVN_TOKEN_ADDRESS=0x... # Same address for frontend
```

## 🧪 **Step 6: Test the System**

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Connect wallet** to BaseCAMP network
3. **Open tip modal** - should show 0 PROVN balance
4. **Click "Get Free PROVN Tokens"** - should receive 100 PROVN
5. **Try tipping** - should work with real blockchain transactions

## 🎯 **What You'll Have After Deployment:**

✅ **PROVN Token Contract** deployed on BaseCAMP  
✅ **Auto-faucet system** giving 100 PROVN to new users  
✅ **Real-time balance** from smart contract  
✅ **Professional tipping** with blockchain transactions  
✅ **Complete security** using OpenZeppelin standards  

## 🚨 **Troubleshooting:**

### **"Insufficient funds"**
- Need testnet ETH for gas fees
- Get from BaseCAMP faucet if available

### **"Wrong network"**
- Ensure MetaMask is on BaseCAMP network
- Chain ID must be 123420001114

### **"Contract not found"**
- Check contract address in .env
- Verify deployment was successful

## 🎉 **Success Indicators:**

✅ Contract deployed with address saved  
✅ Frontend shows PROVN balance  
✅ Faucet works - users get 100 PROVN  
✅ Tipping works - real blockchain transactions  
✅ Balance updates after successful tips  

---

**🎯 Ready to deploy? Run the deployment command above!**
