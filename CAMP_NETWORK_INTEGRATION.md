# Camp Network Origin SDK Integration Guide

This document provides implementation guidance for integrating Camp Network's Origin SDK into the Provn platform for IP protection and NFT functionality.

## Installation

```bash
npm install @campnetwork/origin
```

## Core Dependencies

Based on the sample implementation, the main package required is:
- `@campnetwork/origin`: ^0.0.10

## Key SDK Components

### React Hooks
- `useAuthState()` - Track authentication state
- `useConnect()` - Handle wallet connections
- `useCampModal()` - Control authentication modal

### Components
- `CampModal` - Pre-built authentication modal

## Basic Implementation Pattern

### 1. Authentication Setup

```tsx
import { useAuthState, useConnect, useCampModal } from '@campnetwork/origin/react';
import { CampModal } from '@campnetwork/origin/react';

export default function App() {
  const { authenticated } = useAuthState();
  const { openCampModal } = useCampModal();
  
  return (
    <>
      {!authenticated ? (
        <button onClick={openCampModal}>
          Connect Wallet
        </button>
      ) : (
        <div>Authenticated Content</div>
      )}
      
      <CampModal 
        defaultProvider={generateProvider()} 
        injectButton={false} 
      />
    </>
  );
}
```

### 2. Provider Generation

The sample app uses a `generateProvider()` utility function to create dynamic providers for the modal configuration.

### 3. Section-Based Workflow

The reference implementation uses a section-based approach:
- Wallet connection section
- File upload section  
- IP details section
- Gallery view section

## Integration Points for Provn

### 1. Update Blockchain Service (`lib/blockchain.ts`)

Replace the current mock implementation with Origin SDK:

```tsx
import { /* Origin SDK imports */ } from '@campnetwork/origin';

export class BlockchainService {
  // Replace existing methods with Origin SDK calls
  
  async mintIpNFT(metadata: IpNFTMetadata) {
    // Use Origin SDK for actual IP-NFT minting
  }
  
  async verifyOwnership(tokenId: string, userAddress: string) {
    // Use Origin SDK for ownership verification
  }
}
```

### 2. Authentication Integration

Update navigation component to use Origin SDK authentication:

```tsx
// components/provn/navigation.tsx
import { useAuthState, useCampModal } from '@campnetwork/origin/react';

export function Navigation() {
  const { authenticated } = useAuthState();
  const { openCampModal } = useCampModal();
  
  // Replace existing wallet connection logic
}
```

### 3. Upload Flow Enhancement

Integrate Origin SDK into the upload process:

```tsx
// app/upload/page.tsx
import { /* IP minting functions */ } from '@campnetwork/origin';

export default function UploadPage() {
  // Integrate Origin SDK IP protection during upload
}
```

## Required Environment Variables

Update `.env.local` with Camp Network configuration:

```bash
# Camp Network Configuration
NEXT_PUBLIC_CAMP_NETWORK_CHAIN_ID=your_chain_id
NEXT_PUBLIC_CAMP_NETWORK_RPC_URL=your_rpc_url
NEXT_PUBLIC_CAMP_NETWORK_CONTRACT_ADDRESS=your_contract_address
```

## Implementation Steps

1. **Install Origin SDK**: `npm install @campnetwork/origin`

2. **Update Authentication**: Replace wallet connection logic with Origin SDK hooks

3. **Enhance Blockchain Service**: Integrate real IP-NFT minting functionality

4. **Add CampModal**: Include the authentication modal in the root layout

5. **Update Upload Flow**: Integrate IP protection during content upload

6. **Test Integration**: Verify authentication and minting workflows

## Modal Configuration

The CampModal component supports:
- Custom provider configuration
- Button injection control (`injectButton={false}`)
- Dynamic provider generation

## State Management

The Origin SDK provides built-in state management for:
- Authentication status
- Wallet connection
- Modal visibility
- Provider configuration

## Next Steps

1. Study the complete sample app structure
2. Implement authentication flow first
3. Gradually replace mock blockchain functionality
4. Test IP protection features
5. Integrate with existing Provn UI components

## Resources

- Sample Implementation: https://github.com/Camp-DevRel-Learnings/origin-app
- Camp Network Docs: https://docs.campnetwork.xyz/
- Package: @campnetwork/origin

## Notes

- The Origin SDK appears to be in early development (v0.0.10)
- Focus on authentication and basic IP protection first
- Maintain compatibility with existing Provn features
- Test thoroughly before production deployment