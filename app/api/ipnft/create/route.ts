import { type NextRequest, NextResponse } from "next/server"
import { originService } from "@/lib/origin"
import { ipfsService } from "@/lib/ipfs"

interface CreateIPNFTRequest {
  videoId: string
  title: string
  description: string
  ipfsHash: string
  metadataHash: string
  tags: string[]
  allowRemixing: boolean
  creatorAddress: string
  royaltyPercentage?: number
  licensePrice?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateIPNFTRequest = await request.json()
    
    const {
      videoId,
      title,
      description,
      ipfsHash,
      metadataHash,
      tags,
      allowRemixing,
      creatorAddress,
      royaltyPercentage = 5,
      licensePrice = "10000000000000000000" // 10 tokens in wei
    } = body

    // Validate required fields
    if (!videoId || !title || !ipfsHash || !creatorAddress) {
      return NextResponse.json(
        { error: "Missing required fields: videoId, title, ipfsHash, creatorAddress" },
        { status: 400 }
      )
    }

    console.log('🎭 Starting IP-NFT creation with Origin SDK...', {
      videoId,
      title,
      creatorAddress
    })

    // Initialize Origin SDK
    await originService.initialize()

    // Create IP-NFT metadata for Origin SDK
    const ipNFTMetadata = {
      name: title,
      description,
      image: ipfsService.getGatewayUrl(ipfsHash),
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/video/${videoId}`,
      attributes: [
        { trait_type: "Creator", value: creatorAddress },
        { trait_type: "Content Type", value: "Video" },
        { trait_type: "Platform", value: "Provn" },
        { trait_type: "Allow Remixing", value: allowRemixing ? "Yes" : "No" },
        { trait_type: "Royalty Percentage", value: royaltyPercentage.toString() },
        ...tags.map(tag => ({ trait_type: "Tag", value: tag }))
      ],
      properties: {
        files: [{
          uri: ipfsService.getGatewayUrl(ipfsHash),
          type: "video/mp4"
        }],
        category: "video",
        license: {
          allowRemixing,
          royaltyPercentage,
          price: licensePrice
        }
      }
    }

    // Upload IP-NFT metadata to IPFS
    const ipNFTMetadataUpload = await ipfsService.uploadJSON(ipNFTMetadata, {
      name: `${title}-ipnft-metadata.json`,
      keyValues: {
        videoId,
        creator: creatorAddress,
        contentType: 'ipnft-metadata',
        platform: 'provn'
      }
    })

    // Create IP-NFT using Origin SDK
    console.log('🔨 Creating IP-NFT via Origin SDK...')
    
    const ipNFTResult = await originService.createIPNFT({
      title,
      description,
      ipfsHash,
      metadataUri: `ipfs://${ipNFTMetadataUpload.ipfsHash}`,
      tags,
      allowRemixing,
      royaltyPercentage,
      licensePrice,
      creator: creatorAddress
    })

    // Create a post on Origin Network
    console.log('📮 Creating Origin post...')
    const originPost = await originService.createPost({
      title,
      content: description,
      tags,
      ipfsHash,
      metadata: {
        videoId,
        ipNFTTokenId: ipNFTResult.tokenId,
        contentType: 'video',
        platform: 'provn'
      }
    })

    const response = {
      success: true,
      message: "IP-NFT created successfully",
      data: {
        videoId,
        ipNFT: {
          tokenId: ipNFTResult.tokenId,
          contractAddress: ipNFTResult.contractAddress,
          transactionHash: ipNFTResult.transactionHash,
          blockNumber: ipNFTResult.blockNumber,
          metadataUri: `ipfs://${ipNFTMetadataUpload.ipfsHash}`,
          metadataGatewayUrl: ipNFTMetadataUpload.gatewayUrl
        },
        originPost: {
          postId: originPost.id,
          networkTxHash: originPost.transactionHash
        },
        blockchain: {
          network: "Camp Network",
          chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
          explorerUrl: `${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${ipNFTResult.transactionHash}`
        },
        ipfs: {
          videoHash: ipfsHash,
          videoUrl: ipfsService.getGatewayUrl(ipfsHash),
          metadataHash: ipNFTMetadataUpload.ipfsHash,
          metadataUrl: ipNFTMetadataUpload.gatewayUrl
        },
        status: "minted",
        createdAt: new Date().toISOString()
      }
    }

    console.log('✅ IP-NFT creation completed:', {
      tokenId: ipNFTResult.tokenId,
      transactionHash: ipNFTResult.transactionHash
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ IP-NFT creation failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: "IP-NFT creation failed",
        message: error instanceof Error ? error.message : "Unknown error",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check Origin SDK status
export async function GET() {
  try {
    const status = {
      originSDK: {
        initialized: originService.initialized,
        environment: process.env.NEXT_PUBLIC_CAMP_NETWORK_ENVIRONMENT,
        clientId: process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID ? 'configured' : 'missing'
      },
      ipfs: {
        initialized: ipfsService.initialized,
        gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL
      },
      blockchain: {
        network: "Camp Network",
        chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
        contracts: {
          ipnft: process.env.NEXT_PUBLIC_IPNFT_CONTRACT,
          marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
          token: process.env.NEXT_PUBLIC_TOKEN_CONTRACT
        }
      }
    }

    return NextResponse.json({
      success: true,
      status,
      ready: originService.initialized && ipfsService.initialized
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Status check failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}