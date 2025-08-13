import { type NextRequest, NextResponse } from "next/server"
import { ipfsService, VideoMetadata } from "@/lib/ipfs"
import { originService } from "@/lib/origin"

interface UploadRequest {
  title: string
  description?: string
  tags: string[]
  allowRemixing: boolean
  parentTokenId?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const tags = formData.get("tags") as string
    const allowRemixing = formData.get("allowRemixing") === "true"

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Validate file
    const maxSize = 150 * 1024 * 1024 // 150MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const allowedTypes = ["video/mp4", "video/quicktime"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Create video metadata
    const videoMetadata: VideoMetadata = {
      title,
      description: title, // Use title as description for now
      creator: "0x0000000000000000000000000000000000000000", // Will be set from authenticated user
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      duration: 0, // Will be extracted during processing
      resolution: "1080p", // Will be detected during processing
      format: file.type.split('/')[1],
    }

    // Upload to IPFS
    console.log('🚀 Starting IPFS upload process...')
    const ipfsResult = await ipfsService.uploadVideo(file, videoMetadata)
    const metadataHash = await ipfsService.uploadMetadata(videoMetadata)

    // Generate a unique video ID
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    console.log('📝 Video uploaded to IPFS, preparing for Origin SDK integration...')
    
    // Prepare for Origin SDK integration (IP-NFT minting will be done after wallet connection)
    const response = {
      success: true,
      data: {
        id: videoId,
        title,
        description: videoMetadata.description,
        ipfsHash: ipfsResult.hash,
        ipfsUrl: ipfsResult.url,
        gatewayUrl: ipfsResult.gatewayUrl,
        metadataHash,
        metadataUrl: ipfsService.getGatewayUrl(metadataHash),
        size: ipfsResult.size,
        tags: videoMetadata.tags,
        allowRemixing,
        status: "uploaded", // Will change to "minting" when IP-NFT creation starts
        createdAt: new Date().toISOString(),
        // Add Origin SDK integration info
        readyForMinting: true,
        nextSteps: {
          mintIPNFT: `/api/ipnft/mint`,
          createOriginPost: true
        }
      }
    }

    console.log('✅ Video upload completed:', videoId)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Upload failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
