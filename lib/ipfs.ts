// IPFS integration utilities for Provn platform
import { PinataSDK } from "pinata"

export interface IPFSUploadResult {
  hash: string
  url: string
  size: number
  gatewayUrl?: string
}

export interface VideoMetadata {
  title: string
  description: string
  creator: string
  tags: string[]
  duration: number
  resolution: string
  format: string
  thumbnail?: string
}

export class IPFSService {
  private pinata: PinataSDK | null = null
  private gatewayUrl: string
  private isInitialized: boolean = false

  constructor() {
    this.gatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://gateway.pinata.cloud"
    this.initializePinata()
  }

  private async initializePinata() {
    try {
      if (process.env.PINATA_JWT) {
        this.pinata = new PinataSDK({
          pinataJwt: process.env.PINATA_JWT,
          pinataGateway: this.gatewayUrl
        })
        
        // Test the connection
        try {
          const testAuth = await this.pinata.testAuthentication()
          this.isInitialized = true
          console.log('✅ Pinata IPFS client initialized and authenticated:', testAuth)
        } catch (authError) {
          console.error('❌ Pinata authentication failed:', authError)
          this.isInitialized = false
        }
      } else {
        console.warn('⚠️ No Pinata JWT found in environment variables')
        console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('PINATA')))
        this.isInitialized = false
      }
    } catch (error) {
      console.error('❌ Failed to initialize Pinata:', error)
      this.isInitialized = false
    }
  }

  async uploadVideo(file: File, metadata: VideoMetadata): Promise<IPFSUploadResult> {
    try {
      if (this.isInitialized && process.env.PINATA_JWT) {
        // Use Pinata REST API for file upload
        console.log('📤 Uploading video to IPFS via Pinata REST API...', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        })
        
        const formData = new FormData()
        formData.append('file', file)
        
        // Add metadata
        const pinataMetadata = JSON.stringify({
          name: `${metadata.title}.${metadata.format}`,
          keyvalues: {
            creator: metadata.creator,
            title: metadata.title,
            contentType: 'video',
            platform: 'provn',
            tags: metadata.tags.join(',')
          }
        })
        formData.append('pinataMetadata', pinataMetadata)

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          },
          body: formData
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        const hash = result.IpfsHash
        const gatewayUrl = `${this.gatewayUrl}/ipfs/${hash}`

        console.log('✅ Video uploaded to IPFS:', { hash, size: file.size })
        return {
          hash,
          url: gatewayUrl,
          size: file.size,
          gatewayUrl,
        }
      } else {
        // Mock upload for development
        console.log('⚠️ Using mock IPFS upload - Pinata not initialized')
        const mockHash = `QmVideo${Math.random().toString(36).substring(2, 15).padEnd(40, 'x')}`
        
        return {
          hash: mockHash,
          url: `${this.gatewayUrl}/ipfs/${mockHash}`,
          size: file.size,
          gatewayUrl: `${this.gatewayUrl}/ipfs/${mockHash}`,
        }
      }
    } catch (error) {
      console.error("❌ Video upload to IPFS failed:", error)
      throw new Error(`Failed to upload video to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async uploadMetadata(metadata: VideoMetadata): Promise<string> {
    try {
      if (this.isInitialized && process.env.PINATA_JWT) {
        // Use REST API directly for reliable uploads
        console.log('📤 Uploading metadata to IPFS via Pinata REST API...', { title: metadata.title })
        
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          },
          body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
              name: `${metadata.title}-metadata.json`,
              keyvalues: {
                creator: metadata.creator,
                title: metadata.title,
                contentType: 'video-metadata',
                platform: 'provn',
                tags: metadata.tags.join(',')
              }
            }
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        const hash = result.IpfsHash
        
        console.log('✅ Metadata uploaded to IPFS:', hash)
        return hash
      } else {
        // Mock upload for development
        console.log('⚠️ Using mock metadata upload - Pinata not initialized')
        return `QmMeta${Math.random().toString(36).substring(2, 15).padEnd(40, 'x')}`
      }
    } catch (error) {
      console.error('❌ Failed to upload metadata to IPFS:', error)
      throw new Error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Add new method for uploading JSON with options using REST API
  async uploadJSON(data: any, options?: {
    name?: string
    keyValues?: Record<string, string>
  }): Promise<{ ipfsHash: string; gatewayUrl: string }> {
    try {
      if (this.isInitialized && process.env.PINATA_JWT) {
        console.log('📤 Uploading JSON to IPFS via Pinata REST API...', { name: options?.name })
        
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          },
          body: JSON.stringify({
            pinataContent: data,
            pinataMetadata: {
              name: options?.name || 'data.json',
              keyvalues: {
                platform: 'provn',
                ...options?.keyValues
              }
            }
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        const hash = result.IpfsHash
        const gatewayUrl = `${this.gatewayUrl}/ipfs/${hash}`
        
        console.log('✅ JSON uploaded to IPFS:', hash)
        return { ipfsHash: hash, gatewayUrl }
      } else {
        // Mock upload for development
        console.log('⚠️ Using mock JSON upload - Pinata not initialized')
        const mockHash = `QmJSON${Math.random().toString(36).substring(2, 15).padEnd(40, 'x')}`
        return { 
          ipfsHash: mockHash, 
          gatewayUrl: `${this.gatewayUrl}/ipfs/${mockHash}` 
        }
      }
    } catch (error) {
      console.error('❌ Failed to upload JSON to IPFS:', error)
      throw new Error(`Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async uploadThumbnail(thumbnailBlob: Blob): Promise<string> {
    try {
      if (this.isInitialized && process.env.PINATA_JWT) {
        console.log('📤 Uploading thumbnail to IPFS via Pinata REST API...')
        
        const formData = new FormData()
        const file = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' })
        formData.append('file', file)
        
        const pinataMetadata = JSON.stringify({
          name: 'thumbnail.jpg',
          keyvalues: {
            contentType: 'thumbnail',
            platform: 'provn'
          }
        })
        formData.append('pinataMetadata', pinataMetadata)

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          },
          body: formData
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Thumbnail uploaded to IPFS:', result.IpfsHash)
        return result.IpfsHash
      } else {
        // Mock upload for development
        const mockHash = `QmThumb${Math.random().toString(36).substring(2, 15).padEnd(40, 'x')}`
        console.log('⚠️ Using mock thumbnail upload:', mockHash)
        return mockHash
      }
    } catch (error) {
      console.error('❌ Failed to upload thumbnail to IPFS:', error)
      throw new Error(`Failed to upload thumbnail to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getGatewayUrl(hash: string): string {
    return `${this.gatewayUrl}/ipfs/${hash}`
  }

  getIPFSUrl(hash: string): string {
    return `ipfs://${hash}`
  }

  async pinContent(hash: string): Promise<boolean> {
    try {
      if (this.isInitialized && process.env.PINATA_JWT) {
        // Pin existing content by hash using REST API
        const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          },
          body: JSON.stringify({
            hashToPin: hash,
            pinataMetadata: {
              name: `pinned-${hash}`,
              keyvalues: {
                platform: 'provn',
                pinned: 'true'
              }
            }
          })
        })

        if (response.ok) {
          console.log('✅ Content pinned:', hash)
          return true
        } else {
          console.log('⚠️ Failed to pin content:', response.status)
          return false
        }
      } else {
        console.log('⚠️ Mock pinning service - content not actually pinned')
        return true
      }
    } catch (error) {
      console.error('❌ Failed to pin content:', error)
      return false
    }
  }

  get initialized(): boolean {
    return this.isInitialized
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.pinata) {
        await this.pinata.testAuthentication()
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      return false
    }
  }
}

export const ipfsService = new IPFSService()
