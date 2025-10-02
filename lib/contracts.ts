/**
 * PROVN Platform - Unified Contract Configuration
 *
 * SINGLE SOURCE OF TRUTH for all blockchain contract addresses.
 * All components must import from this file.
 *
 * ⚠️ CRITICAL: After deploying new marketplace, update MARKETPLACE address below
 */

// ============================================================================
// CONTRACT ADDRESSES (BaseCAMP Network - Chain ID: 123420001114)
// ============================================================================

export const CONTRACTS = {
  // Origin Protocol (Third-Party - Immutable)
  IP_NFT: '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1' as `0x${string}`,

  // PROVN Contracts (Verified On-Chain)
  MARKETPLACE: (process.env.NEXT_PUBLIC_PROVN_MARKETPLACE_CONTRACT ||
               '0xd11Cf3497ed8De9cbdD535e5B3624126170E4D0a') as `0x${string}`, // NEW: Deployed 2025-01-02 with syncLicenseTermsFromIPNFT()
  PROVN_TOKEN: '0xa673B3E946A64037AdBAe22a0f56916dE43c678c' as `0x${string}`, // Verified: symbol() returns "PROVN"

  // Network Configuration
  CHAIN_ID: 123420001114,
  RPC_URL: 'https://rpc.basecamp.t.raas.gelato.cloud',
  EXPLORER: 'https://basecamp.cloud.blockscout.com',
  EXPLORER_API: 'https://basecamp.cloud.blockscout.com/api',
} as const

// ============================================================================
// CONTRACT ABIs
// ============================================================================

/**
 * Origin Protocol IP-NFT Contract ABI
 * Handles: NFT minting, ownership, license terms storage
 */
export const IP_NFT_ABI = [
  'function getTerms(uint256 tokenId) external view returns (uint128 price, uint32 duration, uint16 royaltyBps, address paymentToken)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function approve(address to, uint256 tokenId) external',
  'function setApprovalForAll(address operator, bool approved) external',
] as const

/**
 * PROVN Marketplace Contract ABI (Updated 2025-01-02)
 * Handles: License syncing, purchases, expiry tracking
 * Note: Function names match deployed contract exactly
 */
export const MARKETPLACE_ABI = [
  // License Syncing
  'function syncLicenseTermsFromIPNFT(uint256 tokenId) external',

  // License Purchase
  'function purchaseLicense(uint256 tokenId, uint32 periods) external',

  // View Functions
  'function hasActiveLicense(address user, uint256 tokenId) external view returns (bool)',
  'function licenseExpiry(uint256 tokenId, address user) external view returns (uint64)',
  'function licenseTerms(uint256 tokenId) external view returns (tuple(uint128 price, uint32 duration, uint8 licenseType, bool transferable, uint16 royaltyBps, bool active))',

  // Creator Stats
  'function creatorRevenue(address creator) external view returns (uint256)',
  'function creatorLicensesSold(address creator) external view returns (uint256)',

  // Configuration
  'function ipToken() external view returns (address)',
  'function campToken() external view returns (address)',
  'function treasury() external view returns (address)',
  'function protocolFeeBps() external view returns (uint16)',
  'function paused() external view returns (bool)',

  // Events
  'event LicenseTermsSet(uint256 indexed tokenId, uint128 price, uint32 duration, uint8 licenseType, bool transferable, uint16 royaltyBps)',
  'event LicensePurchased(uint256 indexed tokenId, address indexed licensee, uint8 licenseType, uint128 price, uint64 expiryTimestamp)',
] as const

/**
 * PROVN Token (ERC-20) ABI
 * Handles: Payment approvals and transfers
 */
export const PROVN_TOKEN_ABI = [
  // Core ERC-20
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',

  // Metadata
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================

/**
 * Expected constructor arguments for ProvnMarketplace deployment
 * Use these values when deploying via Foundry
 */
export const DEPLOYMENT_CONFIG = {
  IP_NFT_CONTRACT: '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1',
  PROVN_TOKEN_CONTRACT: '0xa673B3E946A64037AdBAe22a0f56916dE43c678c',
  TREASURY_ADDRESS: '0x7669aB66996022A0d2fAFcdB1c4Dc20FB3dc1961', // Admin wallet
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ChainConfig = typeof CONTRACTS
export type ContractAddresses = typeof CONTRACTS

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get explorer URL for a transaction
 */
export function getTxUrl(txHash: string): string {
  return `${CONTRACTS.EXPLORER}/tx/${txHash}`
}

/**
 * Get explorer URL for an address
 */
export function getAddressUrl(address: string): string {
  return `${CONTRACTS.EXPLORER}/address/${address}`
}

/**
 * Get explorer URL for a token
 */
export function getTokenUrl(contractAddress: string, tokenId: string): string {
  return `${CONTRACTS.EXPLORER}/token/${contractAddress}/instance/${tokenId}`
}

/**
 * Check if marketplace contract is configured correctly
 */
export async function verifyMarketplaceConfig(publicClient: any): Promise<boolean> {
  try {
    // Read IP-NFT address from marketplace
    const ipNftAddress = await publicClient.readContract({
      address: CONTRACTS.MARKETPLACE,
      abi: MARKETPLACE_ABI,
      functionName: 'ipToken',
    })

    // Verify it matches expected address
    const isCorrect = ipNftAddress.toLowerCase() === CONTRACTS.IP_NFT.toLowerCase()

    if (!isCorrect) {
      console.error('❌ Marketplace has wrong IP-NFT address:')
      console.error('   Expected:', CONTRACTS.IP_NFT)
      console.error('   Got:', ipNftAddress)
    }

    return isCorrect
  } catch (error) {
    console.error('❌ Failed to verify marketplace config:', error)
    return false
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CONTRACTS
