// Mock IPFS service for frontend development
// This allows the app to run without actual IPFS setup

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

export class MockIPFSService {
  private gatewayUrl: string
  private isInitialized: boolean = true

  constructor() {
    this.gatewayUrl = "https://gateway.pinata.cloud"
    console.log('🔧 Using mock IPFS service for frontend development')
  }

  async uploadVideo(file: File, metadata: VideoMetadata): Promise<IPFSUploadResult> {
    console.log('🔧 Mock IPFS upload:', { fileName: file.name, fileSize: file.size, metadata })
    
    // Generate mock IPFS hash
    const mockHash = `QmMock${Date.now()}${Math.random().toString(36).substring(2, 15)}`
    
    return {
      hash: mockHash,
      url: `ipfs://${mockHash}`,
      size: file.size,
      gatewayUrl: `${this.gatewayUrl}/ipfs/${mockHash}`
    }
  }

  async uploadFile(file: File): Promise<IPFSUploadResult> {
    console.log('🔧 Mock IPFS file upload:', { fileName: file.name, fileSize: file.size })
    
    // Generate mock IPFS hash
    const mockHash = `QmMock${Date.now()}${Math.random().toString(36).substring(2, 15)}`
    
    return {
      hash: mockHash,
      url: `ipfs://${mockHash}`,
      size: file.size,
      gatewayUrl: `${this.gatewayUrl}/ipfs/${mockHash}`
    }
  }

  async uploadMetadata(metadata: any): Promise<IPFSUploadResult> {
    console.log('🔧 Mock IPFS metadata upload:', metadata)
    
    // Generate mock IPFS hash
    const mockHash = `QmMock${Date.now()}${Math.random().toString(36).substring(2, 15)}`
    
    return {
      hash: mockHash,
      url: `ipfs://${mockHash}`,
      size: JSON.stringify(metadata).length,
      gatewayUrl: `${this.gatewayUrl}/ipfs/${mockHash}`
    }
  }

  getGatewayUrl(hash: string): string {
    return `${this.gatewayUrl}/ipfs/${hash}`
  }

  get isReady(): boolean {
    return this.isInitialized
  }
}

// Export mock IPFS service
export const ipfsService = new MockIPFSService()

// Export the class for compatibility
export { MockIPFSService as IPFSService }
