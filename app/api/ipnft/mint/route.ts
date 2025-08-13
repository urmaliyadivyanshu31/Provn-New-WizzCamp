// IpNFT minting endpoint for Provn platform
import { NextRequest, NextResponse } from 'next/server'
import { blockchainService } from '@/lib/blockchain'
import { ipfsService } from '@/lib/ipfs'
import { queueService } from '@/lib/queue'
import { db } from '@/lib/database'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const authResult = await authService.verifyToken(token)
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const userAddress = authResult.data.address

    // Parse request body
    const body = await request.json()
    const {
      videoId,
      title,
      description,
      tags = [],
      allowRemixing = true,
      royaltyPercentage = 5,
      licenseTerms = 'Standard Creator License'
    } = body

    // Validate required fields
    if (!videoId || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, title, description' },
        { status: 400 }
      )
    }

    // Validate royalty percentage
    if (royaltyPercentage < 0 || royaltyPercentage > 10) {
      return NextResponse.json(
        { error: 'Royalty percentage must be between 0-10%' },
        { status: 400 }
      )
    }

    // Check if video exists and belongs to user
    const videoResult = await db.query(
      'SELECT * FROM videos WHERE id = $1 AND creator_address = $2',
      [videoId, userAddress]
    )

    if (videoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Video not found or unauthorized' },
        { status: 404 }
      )
    }

    const video = videoResult.rows[0]

    // Check if video is already minted
    if (video.token_id) {
      return NextResponse.json(
        { error: 'Video already minted as IpNFT', tokenId: video.token_id },
        { status: 409 }
      )
    }

    // Check if video processing is complete
    if (video.processing_status !== 'completed') {
      return NextResponse.json(
        { error: 'Video processing not complete', status: video.processing_status },
        { status: 400 }
      )
    }

    // Create metadata for IpNFT
    const metadata = {
      name: title,
      description,
      image: video.thumbnail_ipfs_hash ? 
        ipfsService.getIPFSUrl(video.thumbnail_ipfs_hash) : 
        undefined,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/video/${videoId}`,
      attributes: [
        { trait_type: 'Creator', value: userAddress },
        { trait_type: 'Duration', value: video.duration || 0 },
        { trait_type: 'Resolution', value: video.resolution || 'unknown' },
        { trait_type: 'Allow Remixing', value: allowRemixing ? 'Yes' : 'No' },
        { trait_type: 'Content Type', value: 'Video' },
        { trait_type: 'Platform', value: 'Provn' },
        ...tags.map((tag: string) => ({ trait_type: 'Tag', value: tag }))
      ],
      properties: {
        files: [
          {
            uri: video.ipfs_hash ? ipfsService.getIPFSUrl(video.ipfs_hash) : '',
            type: 'video/mp4',
            size: video.file_size || 0
          }
        ],
        category: 'video',
        creators: [
          {
            address: userAddress,
            share: 100
          }
        ],
        license: {
          type: licenseTerms,
          allowRemixing,
          royaltyPercentage
        }
      }
    }

    // Upload metadata to IPFS
    console.log('📤 Uploading metadata to IPFS...')
    const metadataUpload = await ipfsService.uploadJSON(metadata, {
      name: `${title}-metadata.json`,
      keyValues: {
        videoId,
        creator: userAddress,
        contentType: 'video-metadata'
      }
    })

    if (!metadataUpload.ipfsHash) {
      return NextResponse.json(
        { error: 'Failed to upload metadata to IPFS' },
        { status: 500 }
      )
    }

    console.log(`✅ Metadata uploaded to IPFS: ${metadataUpload.ipfsHash}`)

    // Create IpNFT metadata object for blockchain service
    const ipNFTMetadata = {
      title,
      description,
      creator: userAddress,
      tags,
      ipfsHash: metadataUpload.ipfsHash,
      allowRemixing,
      createdAt: new Date().toISOString(),
      royaltyPercentage,
      licenseTerms,
      contentType: 'video' as const,
      duration: video.duration,
      resolution: video.resolution
    }

    // Estimate gas costs
    const gasEstimate = await blockchainService.estimateGas('mint', {
      to: userAddress,
      tokenURI: `ipfs://${metadataUpload.ipfsHash}`,
      royalty: royaltyPercentage * 100
    })

    // Add blockchain minting job to queue
    const mintJobId = `mint-${videoId}-${Date.now()}`
    
    console.log('📝 Adding blockchain mint job to queue...')
    const mintJob = await queueService.addBlockchainMintJob({
      id: mintJobId,
      videoId,
      metadataHash: metadataUpload.ipfsHash,
      creator: userAddress,
      royaltyPercentage,
      licensePrice: '10000000000000000000' // 10 wCAMP default
    })

    // Update video record with minting info
    await db.query(`
      UPDATE videos 
      SET 
        mint_job_id = $1,
        metadata_ipfs_hash = $2,
        minting_status = 'pending',
        mint_requested_at = NOW()
      WHERE id = $3
    `, [mintJobId, metadataUpload.ipfsHash, videoId])

    // Return response with job info
    const response = {
      success: true,
      message: 'IpNFT minting initiated successfully',
      data: {
        videoId,
        mintJobId,
        metadataHash: metadataUpload.ipfsHash,
        metadataUrl: `ipfs://${metadataUpload.ipfsHash}`,
        gatewayUrl: metadataUpload.gatewayUrl,
        estimatedGas: gasEstimate,
        queuePosition: mintJob.opts?.priority || 0,
        estimatedTime: '2-5 minutes'
      },
      links: {
        status: `/api/processing/${mintJobId}/status`,
        video: `/api/videos/${videoId}`,
        metadata: metadataUpload.gatewayUrl
      }
    }

    console.log(`✅ IpNFT minting initiated for video ${videoId}`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ IpNFT minting failed:', error)
    
    return NextResponse.json(
      {
        error: 'IpNFT minting failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check minting eligibility
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId parameter required' },
        { status: 400 }
      )
    }

    // Get video details
    const videoResult = await db.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    )

    if (videoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    const video = videoResult.rows[0]

    // Check eligibility criteria
    const eligibility = {
      canMint: false,
      reasons: [] as string[],
      requirements: {
        processingComplete: video.processing_status === 'completed',
        notAlreadyMinted: !video.token_id,
        hasIPFSHash: !!video.ipfs_hash,
        validDuration: video.duration > 0 && video.duration <= 300 // Max 5 minutes
      }
    }

    // Check each requirement
    if (!eligibility.requirements.processingComplete) {
      eligibility.reasons.push('Video processing not complete')
    }

    if (!eligibility.requirements.notAlreadyMinted) {
      eligibility.reasons.push('Video already minted as IpNFT')
    }

    if (!eligibility.requirements.hasIPFSHash) {
      eligibility.reasons.push('Video not uploaded to IPFS')
    }

    if (!eligibility.requirements.validDuration) {
      eligibility.reasons.push('Video duration must be between 1 second and 5 minutes')
    }

    eligibility.canMint = eligibility.reasons.length === 0

    const response = {
      videoId,
      eligible: eligibility.canMint,
      requirements: eligibility.requirements,
      blockers: eligibility.reasons,
      video: {
        title: video.title,
        duration: video.duration,
        status: video.processing_status,
        tokenId: video.token_id,
        ipfsHash: video.ipfs_hash
      },
      limits: {
        maxDuration: 300, // 5 minutes
        maxFileSize: '150MB',
        supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm']
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Minting eligibility check failed:', error)
    
    return NextResponse.json(
      {
        error: 'Eligibility check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}