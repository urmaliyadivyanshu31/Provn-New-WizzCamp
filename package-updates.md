# 📦 Package.json Updates for PROVN Token System

## 🔧 **Required Dependencies**

Add these to your `package.json`:

### **Development Dependencies (Hardhat)**
```json
{
  "devDependencies": {
    "hardhat": "^2.19.0",
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "^5.0.0"
  }
}
```

### **Runtime Dependencies (Ethers.js)**
```json
{
  "dependencies": {
    "ethers": "^5.7.2"
  }
}
```

## 📥 **Installation Commands**

```bash
# Install Hardhat and OpenZeppelin
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts

# Install ethers.js
npm install ethers@5.7.2
```

## 🎯 **Why These Versions?**

- **Hardhat 2.19+**: Latest stable version with BaseCAMP support
- **OpenZeppelin 5.0+**: Latest contracts with security improvements
- **Ethers.js 5.7.2**: Stable version compatible with our utils

## 🔄 **After Installation**

1. **Restart your dev server** (`npm run dev`)
2. **Compile contracts** (`npx hardhat compile`)
3. **Deploy to BaseCAMP** (follow deployment guide)

## ⚠️ **Important Notes**

- **Don't upgrade** to ethers.js v6 yet (incompatible with our utils)
- **Keep Hardhat** in devDependencies (not needed in production)
- **OpenZeppelin** provides industry-standard security patterns
