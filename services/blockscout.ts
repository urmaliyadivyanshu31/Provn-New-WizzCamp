export interface BlockscoutTransaction {
  hash: string
  block_number: string
  from: { hash: string }
  to: { hash: string }
  value: string
  gas_price: string
  gas_used: string
  status: string
  timestamp: string
  token_transfers: Array<{
    token: {
      address: string
      name: string
      symbol: string
      type: string
    }
    total: {
      token_id: string
      value: string
    }
    from: { hash: string }
    to: { hash: string }
  }>
  decoded_input?: {
    method_call: string
    parameters: Array<{
      name: string
      type: string
      value: any
    }>
  }
}

export interface IPFSMetadata {
  name: string
  description: string
  image: string
  animation_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  creator?: string
  license_terms?: {
    commercial_use: boolean
    derivatives: boolean
    price_per_period: string
    currency: string
  }
}

export interface ProcessedVideo {
  tokenId: string
  transactionHash: string
  creator: string
  timestamp: string
  metadata: IPFSMetadata
  videoUrl?: string
  thumbnailUrl?: string
  blockNumber: string
}

const BLOCKSCOUT_BASE_URL = 'https://base-camp-testnet.blockscout.com/api/v2'
const ORIGIN_PROTOCOL_CONTRACT = '0x...' // Origin Protocol contract address

export class BlockscoutService {
  private static async fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Provn-Explorer/1.0'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return await response.json()
      } catch (error) {
        console.warn(`Fetch attempt ${i + 1} failed:`, error)
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  static async getIPNFTMintingTransactions(page = 1, limit = 20): Promise<{
    transactions: BlockscoutTransaction[]
    hasMore: boolean
  }> {
    try {
      // Fetch transactions involving IP-NFT minting
      // This would be filtered by the Origin Protocol contract address
      const url = `${BLOCKSCOUT_BASE_URL}/transactions?filter=to&type=token_transfer&page=${page}&limit=${limit}`
      
      console.log('🔗 Fetching IP-NFT transactions from Blockscout:', url)
      
      const data = await this.fetchWithRetry(url)
      
      // Filter for IP-NFT minting transactions
      const ipNftTransactions = data.items?.filter((tx: BlockscoutTransaction) => 
        tx.token_transfers?.some(transfer => 
          transfer.token.type === 'ERC-721' &&
          transfer.token.name?.toLowerCase().includes('ip') ||
          transfer.token.symbol?.toLowerCase().includes('ip')
        )
      ) || []

      return {
        transactions: ipNftTransactions,
        hasMore: data.next_page_params !== null
      }
    } catch (error) {
      console.error('❌ Failed to fetch IP-NFT transactions:', error)
      return { transactions: [], hasMore: false }
    }
  }

  static async getTransactionDetails(hash: string): Promise<BlockscoutTransaction | null> {
    try {
      const url = `${BLOCKSCOUT_BASE_URL}/transactions/${hash}`
      console.log('🔗 Fetching transaction details:', hash)
      
      const data = await this.fetchWithRetry(url)
      return data
    } catch (error) {
      console.error('❌ Failed to fetch transaction details:', error)
      return null
    }
  }

  static async fetchIPFSMetadata(ipfsUri: string): Promise<IPFSMetadata | null> {
    try {
      // Convert IPFS URI to HTTP URL
      let httpUrl = ipfsUri
      if (ipfsUri.startsWith('ipfs://')) {
        httpUrl = ipfsUri.replace('ipfs://', 'https://ipfs.io/ipfs/')
      }
      
      console.log('📁 Fetching IPFS metadata:', httpUrl)
      
      const response = await fetch(httpUrl, {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS metadata: ${response.status}`)
      }
      
      const metadata = await response.json()
      return metadata
    } catch (error) {
      console.error('❌ Failed to fetch IPFS metadata:', error)
      return null
    }
  }

  static async processTransactionToVideo(tx: BlockscoutTransaction): Promise<ProcessedVideo | null> {
    try {
      // Extract token ID from token transfers
      const nftTransfer = tx.token_transfers?.find(transfer => 
        transfer.token.type === 'ERC-721'
      )
      
      if (!nftTransfer?.total?.token_id) {
        console.warn('No NFT transfer found in transaction:', tx.hash)
        return null
      }

      const tokenId = nftTransfer.total.token_id
      
      // For now, we'll use mock metadata since we need the actual tokenURI
      // In production, you'd call the contract to get the tokenURI
      const mockMetadata: IPFSMetadata = {
        name: `IP-NFT #${tokenId}`,
        description: `Intellectual Property NFT representing creative content`,
        image: `https://picsum.photos/400/600?random=${tokenId}`,
        animation_url: `https://sample-videos.com/zip/10/mp4/SampleVideo_${Math.floor(Math.random() * 10) + 1}080x720_1mb.mp4`,
        creator: tx.from.hash,
        license_terms: {
          commercial_use: true,
          derivatives: false,
          price_per_period: '0.1',
          currency: 'wCAMP'
        }
      }

      return {
        tokenId,
        transactionHash: tx.hash,
        creator: tx.from.hash,
        timestamp: tx.timestamp,
        metadata: mockMetadata,
        videoUrl: mockMetadata.animation_url,
        thumbnailUrl: mockMetadata.image,
        blockNumber: tx.block_number
      }
    } catch (error) {
      console.error('❌ Failed to process transaction to video:', error)
      return null
    }
  }

  static async getVideoFeed(page = 0, limit = 10): Promise<{
    videos: ProcessedVideo[]
    hasMore: boolean
  }> {
    try {
      const { transactions, hasMore } = await this.getIPNFTMintingTransactions(page + 1, limit)
      
      const videos: ProcessedVideo[] = []
      
      for (const tx of transactions) {
        const video = await this.processTransactionToVideo(tx)
        if (video) {
          videos.push(video)
        }
      }
      
      return { videos, hasMore }
    } catch (error) {
      console.error('❌ Failed to get video feed:', error)
      return { videos: [], hasMore: false }
    }
  }

  static async getTokensByOwner(walletAddress: string): Promise<{
    items: Array<{
      id: string
      timestamp?: string
      metadata?: any
      token?: { address: string }
      transaction_hash?: string
      block_number?: string
      token_uri?: string
    }>
  }> {
    try {
      // This would typically fetch from the blockchain API
      // For now, return empty array as this is primarily for IP-NFTs
      const url = `${BLOCKSCOUT_BASE_URL}/addresses/${walletAddress}/nft`
      const data = await this.fetchWithRetry(url)
      return data || { items: [] }
    } catch (error) {
      console.warn('Failed to fetch tokens by owner:', error)
      return { items: [] }
    }
  }
}

// Export instance for use in other files
export const blockscoutService = new BlockscoutService()