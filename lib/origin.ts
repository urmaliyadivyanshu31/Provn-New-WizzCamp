import { Origin } from '@campnetwork/origin'
import { useAccount, useWalletClient } from 'wagmi'

interface OriginConfig {
  environment: 'mainnet' | 'testnet'
  apiKey: string
  clientId: string
}

class OriginService {
  private origin: typeof Origin | null = null
  private isInitialized = false
  private config: OriginConfig

  constructor() {
    this.config = {
      environment: (process.env.NEXT_PUBLIC_CAMP_NETWORK_ENVIRONMENT as 'mainnet' | 'testnet') || 'testnet',
      apiKey: process.env.NEXT_PUBLIC_CAMP_NETWORK_API_KEY || '',
      clientId: process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID || ''
    }
  }

  async initialize(walletClient?: any) {
    if (this.isInitialized) return this.origin

    try {
      // Initialize Origin SDK with proper configuration
      await Origin.init({
        environment: this.config.environment,
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        walletClient: walletClient // Pass the wallet client for transactions
      })

      this.origin = Origin
      this.isInitialized = true
      console.log('✅ Origin SDK initialized successfully', {
        environment: this.config.environment,
        clientId: this.config.clientId
      })
      return this.origin
    } catch (error) {
      console.error('❌ Failed to initialize Origin SDK:', error)
      this.isInitialized = false
      throw error
    }
  }

  async createPost(params: {
    title: string
    content: string
    tags?: string[]
    ipfsHash?: string
    metadata?: any
  }) {
    if (!this.isInitialized || !this.origin) {
      throw new Error('Origin SDK not initialized')
    }

    try {
      // Use Origin SDK to create a post
      const post = await this.origin.createPost({
        title: params.title,
        content: params.content,
        tags: params.tags || [],
        metadata: {
          ipfsHash: params.ipfsHash,
          contentType: 'video',
          platform: 'provn',
          ...params.metadata
        }
      })

      console.log('✅ Post created via Origin SDK:', post)
      return post
    } catch (error) {
      console.error('❌ Failed to create post via Origin SDK:', error)
      throw error
    }
  }

  async createIPNFT(params: {
    title: string
    description: string
    ipfsHash: string
    metadataUri: string
    tags: string[]
    allowRemixing: boolean
    royaltyPercentage: number
    licensePrice: string
    creator: string
  }) {
    if (!this.isInitialized || !this.origin) {
      throw new Error('Origin SDK not initialized')
    }

    try {
      console.log('🎭 Creating IP-NFT via Origin SDK...', { title: params.title, creator: params.creator })
      
      // Use Origin SDK to create an IP-NFT
      const ipNFT = await this.origin.createIPNFT({
        name: params.title,
        description: params.description,
        metadataUri: params.metadataUri,
        creator: params.creator,
        royaltyPercentage: params.royaltyPercentage,
        licensing: {
          allowRemixing: params.allowRemixing,
          price: params.licensePrice
        },
        attributes: params.tags.map(tag => ({ trait_type: 'Tag', value: tag }))
      })

      console.log('✅ IP-NFT created via Origin SDK:', ipNFT)
      return ipNFT
    } catch (error) {
      console.error('❌ Failed to create IP-NFT via Origin SDK:', error)
      throw error
    }
  }

  async getUserProfile(address: string) {
    if (!this.isInitialized || !this.origin) {
      throw new Error('Origin SDK not initialized')
    }

    try {
      const profile = await this.origin.getProfile(address)
      return profile
    } catch (error) {
      console.error('❌ Failed to get user profile:', error)
      return null
    }
  }

  async updateProfile(params: {
    name?: string
    bio?: string
    avatar?: string
    handle?: string
  }) {
    if (!this.isInitialized || !this.origin) {
      throw new Error('Origin SDK not initialized')
    }

    try {
      const updatedProfile = await this.origin.updateProfile(params)
      console.log('✅ Profile updated via Origin SDK:', updatedProfile)
      return updatedProfile
    } catch (error) {
      console.error('❌ Failed to update profile via Origin SDK:', error)
      throw error
    }
  }

  async getUserPosts(address: string) {
    if (!this.isInitialized || !this.origin) {
      throw new Error('Origin SDK not initialized')
    }

    try {
      const posts = await this.origin.getUserPosts(address)
      return posts
    } catch (error) {
      console.error('❌ Failed to get user posts:', error)
      return []
    }
  }

  async getFeed(limit = 20, offset = 0) {
    if (!this.isInitialized || !this.origin) {
      throw new Error('Origin SDK not initialized')
    }

    try {
      const feed = await this.origin.getFeed({
        limit,
        offset,
        filters: {
          contentType: 'video',
          platform: 'provn'
        }
      })
      return feed
    } catch (error) {
      console.error('❌ Failed to get feed:', error)
      return []
    }
  }

  get initialized() {
    return this.isInitialized
  }
}

// Export singleton instance
export const originService = new OriginService()

// Hook to use Origin SDK with wallet connection
export function useOrigin() {
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  
  const initializeOrigin = async () => {
    if (!isConnected || !walletClient) {
      throw new Error('Wallet not connected')
    }
    return await originService.initialize(walletClient)
  }

  const createIPNFT = async (params: {
    title: string
    description: string
    ipfsHash: string
    metadataUri: string
    tags: string[]
    allowRemixing: boolean
    royaltyPercentage?: number
    licensePrice?: string
  }) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    if (!originService.initialized) {
      await initializeOrigin()
    }

    return await originService.createIPNFT({
      ...params,
      creator: address,
      royaltyPercentage: params.royaltyPercentage || 5,
      licensePrice: params.licensePrice || "10000000000000000000"
    })
  }

  const createPost = async (params: {
    title: string
    content: string
    tags?: string[]
    ipfsHash?: string
    metadata?: any
  }) => {
    if (!originService.initialized) {
      await initializeOrigin()
    }

    return await originService.createPost(params)
  }

  return {
    originService,
    isConnected,
    address,
    initializeOrigin,
    createIPNFT,
    createPost,
    isInitialized: originService.initialized
  }
}