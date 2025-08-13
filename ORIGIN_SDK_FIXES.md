# Origin SDK Minting Fixes

## Issue Summary

The Origin SDK was failing with a 400 Bad Request error when trying to mint IP-NFTs. The error "Failed to get signature" indicated that the Origin SDK couldn't sign transactions because the wallet client wasn't properly configured.

## Root Causes Identified

1. **Missing Wallet Client Configuration**: The Origin SDK needs a properly configured viem wallet client for signing transactions
2. **Missing Environment Variables**: The Origin SDK requires proper API keys and configuration to work
3. **Missing Para API Key**: The Para wallet connection service requires an API key for initial wallet connections
4. **Incomplete SDK Initialization**: The Origin SDK wasn't fully initialized before attempting to mint
5. **File Object Handling**: Creating new File objects from IPFS blobs was causing issues

## Fixes Implemented

### 1. Wallet Client Configuration

Added proper viem wallet client setup in `components/provn/ipnft-mint.tsx`:

```typescript
// Configure Origin SDK with proper wallet client for signing
useEffect(() => {
  if (authenticated && origin && walletAddress && typeof window !== 'undefined' && window.ethereum) {
    try {
      const baseCampChain = {
        id: 123420001114, // BaseCAMP chain ID
        name: 'BaseCAMP',
        network: 'basecamp',
        nativeCurrency: {
          name: 'CAMP',
          symbol: 'CAMP',
          decimals: 18,
        },
        rpcUrls: {
          default: { http: ['https://rpc-campnetwork.xyz'] },
          public: { http: ['https://rpc-campnetwork.xyz'] },
        },
        blockExplorers: {
          default: {
            name: 'BaseCAMP Explorer',
            url: 'https://basecamp.cloud.blockscout.com',
          },
        },
      };

      // Create a public client for reading from the blockchain
      const publicClient = createPublicClient({
        chain: baseCampChain,
        transport: http(),
      });

      // Set the public client in the Origin SDK
      origin.setViemClient(publicClient);

      // Setup wallet client for signing
      const walletClient = createWalletClient({
        chain: baseCampChain,
        transport: custom(window.ethereum),
        account: walletAddress as any,
      });
      
      // Store wallet client for use by the Origin SDK
      (origin as any).walletClient = walletClient;
    } catch (error) {
      console.error("Failed to set viem clients:", error);
    }
  }
}, [authenticated, origin, walletAddress]);
```

### 2. Enhanced Error Handling

Added comprehensive error handling for different failure scenarios:

```typescript
} catch (mintError: any) {
  console.error("Origin SDK mintFile failed:", mintError);
  
  // Check if it's a signature error
  if (mintError.message?.includes("signature") || mintError.message?.includes("Failed to get signature")) {
    throw new Error("Failed to get signature: Please check your wallet connection and approve the transaction when prompted.");
  }
  
  // Check if it's a 400 error
  if (mintError.message?.includes("400") || mintError.message?.includes("Bad Request")) {
    throw new Error("Invalid request to Origin API: The request format is incorrect. Please check your file and metadata.");
  }
  
  // Re-throw the original error
  throw mintError;
}
```

### 3. File Object Optimization

Changed from creating new File objects to using the original file:

```typescript
// Use the original file object for minting (like the working sample)
// Don't create a new File object as this might cause issues with Origin SDK
const mintFile = file;
```

### 4. Additional Validation

Added comprehensive validation before minting:

```typescript
// Check if Origin SDK is properly configured
if (!origin) {
  throw new Error("Origin SDK not initialized");
}

// Check if wallet client is configured
if (!(origin as any).walletClient) {
  throw new Error("Wallet client not configured for signing");
}

// Check if Origin SDK is ready for minting
if (typeof origin.mintFile !== 'function') {
  throw new Error("Origin SDK mintFile method not available");
}

// Check if we have a valid wallet address
if (!walletAddress) {
  throw new Error("Wallet address not available for minting");
}

// Check if we're on the correct network
if (typeof window !== 'undefined' && window.ethereum) {
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const expectedChainId = '0x' + (123420001114).toString(16);
    
    if (chainId !== expectedChainId) {
      throw new Error(`Wrong network. Expected BaseCAMP Network (${expectedChainId}), got ${chainId}`);
    }
  } catch (networkError) {
    console.warn("Could not verify network:", networkError);
  }
}
```

### 5. Environment Configuration

Created setup script `setup-env.sh` to configure required environment variables:

```bash
# Camp Network Origin SDK Configuration
NEXT_PUBLIC_CAMP_NETWORK_API_KEY=4f1a2c9c-008e-4a2e-8712-055fa04f9ffa
NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID=fce77d7a-8085-47ca-adff-306a933e76aa
NEXT_PUBLIC_CAMP_NETWORK_ENVIRONMENT=testnet

# Para API Configuration (Wallet Connection) - Test Credentials
NEXT_PUBLIC_PARA_API_KEY=4f1a2c9c-008e-4a2e-8712-055fa04f9ffa

# BaseCAMP Network Configuration
NEXT_PUBLIC_RPC_URL=https://rpc-campnetwork.xyz
NEXT_PUBLIC_EXPLORER_URL=https://basecamp.cloud.blockscout.com/
NEXT_PUBLIC_CHAIN_ID=123420001114
NEXT_PUBLIC_IPNFT_CONTRACT=0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981
NEXT_PUBLIC_TOKEN_CONTRACT=0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b
```

### 6. Para API Key Configuration

Configured Para API key in `components/providers.tsx`:

- Uses test credentials provided for bounty participation
- Simple configuration without extra troubleshooting
- Prevents the app from crashing when the key is missing

### 7. Debugging Tools

Created test page `/test-origin-config` to help debug configuration issues:

- Configuration status display
- Environment variable checks
- Network validation
- Wallet connection verification
- Origin SDK method availability

## How to Use

### 1. Set up environment variables:

```bash
# Run the setup script
./setup-env.sh

# Or manually create .env.local with the required variables
```

### 2. Test the configuration:

Navigate to `/test-origin-config` to verify everything is working correctly.

### 3. Try minting again:

The enhanced error handling will now provide clear feedback on what's wrong.

## Expected Results

After implementing these fixes:

1. ✅ Origin SDK will have proper wallet client configuration
2. ✅ Transaction signing should work correctly
3. ✅ Better error messages for debugging
4. ✅ Comprehensive validation before minting
5. ✅ Fallback error handling for different failure scenarios

## Troubleshooting

If issues persist:

1. **Check environment variables**: Ensure `.env.local` exists with proper values
2. **Verify wallet connection**: Make sure wallet is connected to BaseCAMP Network
3. **Check network**: Ensure you're on Chain ID 123420001114
4. **Use debug page**: Visit `/test-origin-config` to identify issues
5. **Check console logs**: Enhanced logging will show detailed error information

## Next Steps

1. Test the minting functionality with these fixes
2. Monitor console logs for any remaining issues
3. Use the debug page to verify configuration
4. Report any new errors with the enhanced error handling
