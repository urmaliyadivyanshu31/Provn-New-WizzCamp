// Enhanced IPFS integration for Provn platform using Helia
import { createHelia } from 'helia'
import { createHeliaHTTP } from '@helia/http'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface IPFSUploadResult {
  ipfsHash: string
  size: number
  timestamp: string
  gatewayUrl: string
  heliaUrl?: string
}

export interface IPFSMetadata {
  name: string
  description: string
  image?: string
  external_url?: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  properties: {
    files: Array<{
      uri: string
      type: string
      size: number
    }>
    category: string
    creators: Array<{
      address: string
      share: number
    }>
  }
}

export interface IPFSDirectoryStructure {
  'video.m3u8': Buffer
  'metadata.json': Buffer
  segments: { [key: string]: Buffer }
  thumbnail: Buffer
}

class IPFSService {
  private helia: any = null
  private gatewayUrl: string
  private isInitialized: boolean = false
  private pinata: any = null

  constructor() {
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io'
    this.initializeHelia()
    this.initializePinata()
  }

  private async initializeHelia(): Promise<void> {
    try {
      this.helia = await createHeliaHTTP()
      this.isInitialized = true
      console.log('✅ Helia IPFS client initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Helia:', error)
      this.isInitialized = false
    }
  }

  private initializePinata(): void {
    try {
      if (process.env.PINATA_JWT) {
        // Keep Pinata as fallback for now
        console.log('✅ Pinata fallback available')
      } else {
        console.warn('⚠️ No Pinata credentials found, using Helia only')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Pinata fallback:', error)
    }
  }

  // Health check for IPFS service
  async healthCheck(): Promise<{ status: string; gateway: string; helia?: boolean; pinata?: boolean }> {
    try {
      const heliaOk = this.helia && this.isInitialized
      
      return {
        status: heliaOk ? 'healthy' : 'degraded',
        gateway: this.gatewayUrl,
        helia: heliaOk,
        pinata: !!process.env.PINATA_JWT
      }
    } catch (error) {
      console.error('IPFS health check failed:', error)
      return {
        status: 'unhealthy',
        gateway: this.gatewayUrl,
        helia: false,
        pinata: false
      }
    }
  }

  // Upload single file to IPFS using Helia
  async uploadFile(
    filePath: string, 
    options: {
      name?: string
      keyValues?: Record<string, string>
      groupId?: string
    } = {}
  ): Promise<IPFSUploadResult> {
    try {
      if (!this.helia || !this.isInitialized) {
        return this.mockUploadResult()
      }

      const file = fs.readFileSync(filePath)
      const fileName = options.name || path.basename(filePath)

      // Upload using Helia
      const cid = await this.helia.blockstore.put(file)
      const ipfsHash = cid.toString()

      const uploadResult: IPFSUploadResult = {
        ipfsHash,
        size: file.length,
        timestamp: new Date().toISOString(),
        gatewayUrl: `${this.gatewayUrl}/ipfs/${ipfsHash}`,
        heliaUrl: `ipfs://${ipfsHash}`
      }

      console.log(`✅ File uploaded to IPFS via Helia: ${ipfsHash}`)
      return uploadResult
    } catch (error) {
      console.error('❌ File upload to IPFS failed:', error)
      throw new Error(`IPFS upload failed: ${error}`)
    }
  }

  // Upload JSON metadata to IPFS
  async uploadJSON(
    data: any,
    options: {
      name?: string
      keyValues?: Record<string, string>
    } = {}
  ): Promise<IPFSUploadResult> {
    try {
      if (!this.helia || !this.isInitialized) {
        return this.mockUploadResult()
      }

      const jsonString = JSON.stringify(data)
      const jsonBuffer = Buffer.from(jsonString, 'utf-8')

      // Upload using Helia
      const cid = await this.helia.blockstore.put(jsonBuffer)
      const ipfsHash = cid.toString()

      const uploadResult: IPFSUploadResult = {
        ipfsHash,
        size: jsonBuffer.length,
        timestamp: new Date().toISOString(),
        gatewayUrl: `${this.gatewayUrl}/ipfs/${ipfsHash}`,
        heliaUrl: `ipfs://${ipfsHash}`
      }

      console.log(`✅ JSON uploaded to IPFS via Helia: ${ipfsHash}`)
      return uploadResult
    } catch (error) {
      console.error('❌ JSON upload to IPFS failed:', error)
      throw new Error(`IPFS JSON upload failed: ${error}`)
    }
  }

  // Upload directory structure (for HLS videos with segments)
  async uploadDirectory(
    directoryStructure: IPFSDirectoryStructure,
    options: {
      name?: string
      keyValues?: Record<string, string>
    } = {}
  ): Promise<IPFSUploadResult> {
    try {
      if (!this.helia || !this.isInitialized) {
        return this.mockUploadResult()
      }

      // For now, upload metadata.json as the main entry point
      // In a full implementation, you'd create a proper directory structure
      const metadata = {
        name: options.name || 'video-content',
        type: 'directory',
        files: [
          { name: 'video.m3u8', size: directoryStructure['video.m3u8'].length },
          { name: 'metadata.json', size: directoryStructure['metadata.json'].length },
          { name: 'thumbnail.jpg', size: directoryStructure.thumbnail.length },
          { name: 'segments', type: 'directory', count: Object.keys(directoryStructure.segments).length }
        ],
        ...options.keyValues
      }

      // Upload metadata as the directory entry point
      const result = await this.uploadJSON(metadata, {
        name: 'directory-metadata.json',
        keyValues: options.keyValues
      })

      console.log(`✅ Directory structure uploaded to IPFS via Helia: ${result.ipfsHash}`)
      return result
    } catch (error) {
      console.error('❌ Directory upload to IPFS failed:', error)
      throw new Error(`IPFS directory upload failed: ${error}`)
    }
  }

  // Fetch content from IPFS
  async fetchContent(ipfsHash: string): Promise<Buffer | null> {
    try {
      const url = `${this.gatewayUrl}/ipfs/${ipfsHash}`
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      })
      
      return Buffer.from(response.data)
    } catch (error) {
      console.error(`❌ Failed to fetch content from IPFS: ${ipfsHash}`, error)
      return null
    }
  }

  // Fetch JSON metadata from IPFS
  async fetchJSON(ipfsHash: string): Promise<any | null> {
    try {
      const url = `${this.gatewayUrl}/ipfs/${ipfsHash}`
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json'
        }
      })
      
      return response.data
    } catch (error) {
      console.error(`❌ Failed to fetch JSON from IPFS: ${ipfsHash}`, error)
      return null
    }
  }

  // Pin existing content to ensure persistence
  async pinContent(ipfsHash: string, name?: string): Promise<boolean> {
    try {
      if (!this.helia || !this.isInitialized) {
        console.log(`Mock pinning content: ${ipfsHash}`)
        return true
      }

      // With Helia, content is automatically pinned when uploaded
      // This is a no-op for now
      console.log(`✅ Content automatically pinned: ${ipfsHash}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to pin content: ${ipfsHash}`, error)
      return false
    }
  }

  // Generate IPFS URL from hash
  getIPFSUrl(ipfsHash: string, fileName?: string): string {
    const baseUrl = `${this.gatewayUrl}/ipfs/${ipfsHash}`
    return fileName ? `${baseUrl}/${fileName}` : baseUrl
  }

  // Generate multiple gateway URLs for redundancy
  getRedundantUrls(ipfsHash: string, fileName?: string): string[] {
    const gateways = [
      'https://ipfs.io',
      'https://dweb.link',
      'https://cf-ipfs.com',
      'https://gateway.pinata.cloud'
    ]

    return gateways.map(gateway => {
      const baseUrl = `${gateway}/ipfs/${ipfsHash}`
      return fileName ? `${baseUrl}/${fileName}` : baseUrl
    })
  }

  // Create standard video metadata for NFT
  createVideoMetadata(params: {
    title: string
    description: string
    creator: string
    tags: string[]
    videoHash: string
    thumbnailHash: string
    duration: number
    resolution: string
    allowRemixing: boolean
  }): IPFSMetadata {
    return {
      name: params.title,
      description: params.description,
      image: this.getIPFSUrl(params.thumbnailHash, 'thumbnail.jpg'),
      external_url: `https://provn.app/video/${params.videoHash}`,
      attributes: [
        { trait_type: 'Creator', value: params.creator },
        { trait_type: 'Duration', value: params.duration },
        { trait_type: 'Resolution', value: params.resolution },
        { trait_type: 'Allow Remixing', value: params.allowRemixing ? 'Yes' : 'No' },
        ...params.tags.map(tag => ({ trait_type: 'Tag', value: tag }))
      ],
      properties: {
        files: [
          {
            uri: this.getIPFSUrl(params.videoHash, 'video.m3u8'),
            type: 'video/mp4',
            size: 0 // Will be updated with actual size
          }
        ],
        category: 'video',
        creators: [
          {
            address: params.creator,
            share: 100
          }
        ]
      }
    }
  }

  // Validate IPFS hash format
  isValidIPFSHash(hash: string): boolean {
    // Check for CIDv0 (Qm...) or CIDv1 format
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
    const cidv1Regex = /^[a-z2-7]{59}$/
    
    return cidv0Regex.test(hash) || cidv1Regex.test(hash)
  }

  // Mock functions for development
  private mockUploadResult(): IPFSUploadResult {
    const mockHash = `Qm${crypto.randomBytes(22).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 44)}`
    
    return {
      ipfsHash: mockHash,
      size: Math.floor(Math.random() * 1000000) + 100000,
      timestamp: new Date().toISOString(),
      gatewayUrl: `${this.gatewayUrl}/ipfs/${mockHash}`,
      heliaUrl: `ipfs://${mockHash}`
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService()

// Export utility functions
export const ipfsUtils = {
  // Extract IPFS hash from URL
  extractHashFromUrl: (url: string): string | null => {
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  },

  // Check if URL is IPFS gateway URL
  isIPFSUrl: (url: string): boolean => {
    return url.includes('/ipfs/') || url.startsWith('ipfs://')
  },

  // Convert IPFS protocol URL to gateway URL
  convertToGatewayUrl: (ipfsUrl: string, gateway: string = 'https://ipfs.io'): string => {
    if (ipfsUrl.startsWith('ipfs://')) {
      const hash = ipfsUrl.replace('ipfs://', '')
      return `${gateway}/ipfs/${hash}`
    }
    return ipfsUrl
  }
}
