# 🚀 Real Wallet Connection Test Guide

## 🎯 **Overview**

The Provn Platform now has **REAL wallet connection** using the Camp Network Origin SDK! This guide will help you test the complete wallet connection flow and verify that everything is working correctly.

## ✅ **What's Been Implemented**

### **Real Wallet Connection System:**
- ✅ **Camp Network Origin SDK Integration** - Full integration with official SDK
- ✅ **Real Contract Addresses** - All BaseCAMP Network contracts configured
- ✅ **Real Network Configuration** - BaseCAMP Network (Chain ID: 123420001114)
- ✅ **Real RPC Endpoint** - `https://rpc-campnetwork.xyz`
- ✅ **Real Block Explorer** - `https://basecamp.cloud.blockscout.com/`

### **Contract Addresses:**
- **wCAMP Token**: `0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b`
- **IpNFT**: `0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1`
- **Marketplace**: `0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981`
- **DisputeModule**: `0x84EAac1B2dc3f84D92Ff84c3ec205B1FA74671fC`

## 🧪 **Testing the Real Wallet Connection**

### **Step 1: Start the Development Server**
```bash
npm run dev
```
The server should start on `http://localhost:3000`

### **Step 2: Visit the Upload Page**
Navigate to: `http://localhost:3000/upload`

You should see:
- ✅ Upload form with video drag & drop
- ✅ "Connect Wallet" button (should be clickable)
- ✅ All form fields for video metadata

### **Step 3: Test Wallet Connection**
1. **Click "Connect Wallet"** button
2. **Camp Network Origin SDK Modal** should open
3. **Wallet Options** should be displayed (MetaMask, WalletConnect, etc.)
4. **Select your wallet** (e.g., MetaMask)
5. **Approve connection** in your wallet
6. **Verify connection** - should show your wallet address and chain ID

### **Step 4: Verify Connection State**
After successful connection, you should see:
- ✅ **Green dot** indicating connected status
- ✅ **Your wallet address** (shortened format: `0x1234...5678`)
- ✅ **Chain ID** displayed (should show `123420001114`)
- ✅ **Disconnect button** available

### **Step 5: Test Disconnection**
1. **Click "Disconnect"** button
2. **Wallet should disconnect** cleanly
3. **Return to "Connect Wallet"** state
4. **No wallet address** should be displayed

## 🔍 **What to Look For**

### **✅ Success Indicators:**
- Wallet connection modal opens properly
- Wallet connects without errors
- Real wallet address is displayed
- Chain ID shows correct BaseCAMP Network ID
- Connection state persists across page refreshes
- Clean disconnection works

### **❌ Potential Issues:**
- **Modal doesn't open**: Check Camp Network Origin SDK configuration
- **Connection fails**: Verify API keys and client ID
- **Wrong network**: Ensure wallet is on BaseCAMP Network
- **Address not displayed**: Check authentication state management

## 🌐 **Network Configuration**

### **BaseCAMP Network Details:**
- **Chain ID**: `123420001114`
- **RPC URL**: `https://rpc-campnetwork.xyz`
- **Block Explorer**: `https://basecamp.cloud.blockscout.com/`
- **Currency**: wCAMP tokens

### **Adding BaseCAMP Network to MetaMask:**
1. Open MetaMask
2. Click Network dropdown
3. Select "Add Network"
4. Enter:
   - **Network Name**: BaseCAMP Network
   - **RPC URL**: `https://rpc-campnetwork.xyz`
   - **Chain ID**: `123420001114`
   - **Currency Symbol**: wCAMP
   - **Block Explorer**: `https://basecamp.cloud.blockscout.com/`

## 🎬 **Testing the Complete Video Upload Flow**

### **Prerequisites:**
- ✅ Wallet connected to BaseCAMP Network
- ✅ Some wCAMP tokens for gas fees
- ✅ Video file ready for upload

### **Upload Process:**
1. **Connect Wallet** (as tested above)
2. **Upload Video File** (MP4/MOV, up to 150MB)
3. **Fill Metadata**:
   - Title
   - Tags
   - License settings
4. **Submit Upload**
5. **Watch Processing**:
   - File validation
   - Video transcoding
   - IPFS upload
   - IP-NFT minting
   - Blockchain confirmation

### **Expected Results:**
- ✅ Processing job created
- ✅ Real-time status updates
- ✅ IP-NFT minted on BaseCAMP Network
- ✅ Transaction hash displayed
- ✅ Video available on IPFS
- ✅ License terms enforced on-chain

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. Wallet Connection Fails**
- **Check**: API keys and client ID in `.env`
- **Verify**: Camp Network Origin SDK is properly imported
- **Ensure**: No console errors in browser dev tools

#### **2. Wrong Network**
- **Check**: Wallet is connected to BaseCAMP Network
- **Verify**: Chain ID shows `123420001114`
- **Switch**: Use MetaMask network switcher

#### **3. Transaction Fails**
- **Check**: Sufficient wCAMP tokens for gas
- **Verify**: Contract addresses are correct
- **Ensure**: Wallet has approved necessary permissions

#### **4. IPFS Upload Fails**
- **Check**: Helia service is running
- **Verify**: IPFS gateway configuration
- **Ensure**: File size is within limits

### **Debug Commands:**
```bash
# Check server logs
npm run dev

# Test API endpoints
curl http://localhost:3000/api/videos/upload

# Verify environment variables
cat .env | grep CAMP_NETWORK
```

## 📱 **Mobile Testing**

### **WalletConnect Testing:**
1. **Use mobile wallet** (MetaMask Mobile, Trust Wallet, etc.)
2. **Scan QR code** from desktop
3. **Approve connection** on mobile
4. **Verify connection** works across devices

### **Responsive Design:**
- ✅ Upload form adapts to mobile screens
- ✅ Wallet connection modal is mobile-friendly
- ✅ Touch interactions work properly

## 🎉 **Success Criteria**

### **Wallet Connection:**
- ✅ Modal opens and closes properly
- ✅ Real wallet connects successfully
- ✅ Address and chain ID display correctly
- ✅ Connection state persists
- ✅ Clean disconnection works

### **Network Integration:**
- ✅ Correct BaseCAMP Network connection
- ✅ Real contract addresses accessible
- ✅ RPC endpoint responds
- ✅ Block explorer links work

### **User Experience:**
- ✅ Smooth connection flow
- ✅ Clear status indicators
- ✅ Error handling works
- ✅ Loading states display

## 🚀 **Next Steps After Testing**

### **If Everything Works:**
1. **Deploy to production**
2. **Onboard content creators**
3. **Test with real users**
4. **Monitor blockchain transactions**

### **If Issues Found:**
1. **Debug specific problems**
2. **Check SDK documentation**
3. **Verify network configuration**
4. **Test with different wallets**

## 📚 **Additional Resources**

- **Camp Network Origin SDK**: [Documentation](https://docs.campnetwork.xyz)
- **BaseCAMP Network**: [Network Info](https://basecamp.cloud.blockscout.com/)
- **wCAMP Token**: [Contract Details](https://basecamp.cloud.blockscout.com/address/0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b)
- **IP-NFT Contract**: [Contract Details](https://basecamp.cloud.blockscout.com/address/0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1)

---

**🎯 The Provn Platform is now ready for real-world testing with actual wallets and blockchain transactions!**

**Test thoroughly and enjoy the power of real decentralized content protection! 🚀✨**
