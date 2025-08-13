import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { videoProcessingService } from "@/lib/processing"
import { blockchainService } from "@/lib/blockchain"
import { authService } from "@/lib/auth"
import { db } from "@/lib/database"

interface UploadRequest {
  title: string
  description?: string
  tags: string[]
  allowRemixing: boolean
  parentTokenId?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get wallet address from header
    const walletAddress = request.headers.get('X-Wallet-Address')
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("video") as File
    const metadata = JSON.parse(formData.get("metadata") as string) as UploadRequest

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
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

    // Create processing job
    const processingJob = await videoProcessingService.createProcessingJob(
      walletAddress,
      'upload',
      {
        title: metadata.title,
        description: metadata.description || '',
        tags: metadata.tags,
        allowRemixing: metadata.allowRemixing,
        creator: walletAddress,
        parentTokenId: metadata.parentTokenId
      }
    )

    // Save file to temporary storage
    const tempDir = join(process.cwd(), 'uploads', 'temp', processingJob.processingId)
    await mkdir(tempDir, { recursive: true })
    
    const filePath = join(tempDir, file.name)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Start processing in background (non-blocking)
    processVideoAsync(processingJob.processingId, filePath, metadata, walletAddress)

    return NextResponse.json({
      processingId: processingJob.processingId,
      status: "processing",
      steps: processingJob.steps.map(step => ({ id: step, status: "pending" })),
      estimatedTime: "5-10 minutes",
      message: "Video processing started successfully"
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

// Process video asynchronously
async function processVideoAsync(
  processingId: string, 
  filePath: string, 
  metadata: UploadRequest, 
  userAddress: string
) {
  try {
    // Update job status to processing
    await videoProcessingService.updateJobStatus(processingId, 'processing', 'validate', 10)

    // Process the video
    const result = await videoProcessingService.processVideo(
      {
        filepath: filePath,
        originalName: 'uploaded_video',
        mimetype: 'video/mp4',
        size: 0 // Will be updated by processing service
      },
      await videoProcessingService.getJobStatus(processingId)!
    )

    // Check for duplicates
    const duplicateCheck = await videoProcessingService.checkForDuplicate(result.perceptualHash)
    if (duplicateCheck.isDuplicate) {
      await videoProcessingService.updateJobStatus(
        processingId, 
        'failed', 
        'duplicate_check', 
        0, 
        undefined, 
        'Similar content already exists on the platform'
      )
      return
    }

    // Mint IP-NFT on blockchain
    const ipNFTMetadata = {
      title: metadata.title,
      description: metadata.description || '',
      creator: userAddress,
      tags: metadata.tags,
      ipfsHash: result.videoHash,
      parentTokenId: metadata.parentTokenId,
      allowRemixing: metadata.allowRemixing,
      createdAt: new Date().toISOString(),
      royaltyPercentage: 5, // 5% royalty
      licenseTerms: "Standard Creator License",
      contentType: 'video' as const,
      duration: result.duration,
      resolution: result.resolution
    }

    const mintResult = await blockchainService.mintIpNFT(ipNFTMetadata, userAddress)

    // Store video in database
    await db.query(`
      INSERT INTO videos (
        token_id, title, description, creator_address, parent_token_id,
        ipfs_hash, transaction_hash, block_number, contract_address,
        status, allow_remixing, perceptual_hash, duration, file_size,
        resolution, format
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      mintResult.tokenId,
      metadata.title,
      metadata.description || '',
      userAddress,
      metadata.parentTokenId || null,
      result.videoHash,
      mintResult.transactionHash,
      mintResult.blockNumber,
      mintResult.contractAddress,
      'active',
      metadata.allowRemixing,
      result.perceptualHash,
      result.duration,
      result.fileSize,
      result.resolution,
      result.format
    ])

    // Store tags
    for (const tag of metadata.tags) {
      await db.query(`
        INSERT INTO video_tags (video_id, tag)
        SELECT id, $1 FROM videos WHERE token_id = $2
      `, [tag, mintResult.tokenId])
    }

    // Initialize video stats
    await db.query(`
      INSERT INTO video_stats (video_id)
      SELECT id FROM videos WHERE token_id = $1
    `, [mintResult.tokenId])

    // Update job status to completed
    await videoProcessingService.updateJobStatus(
      processingId, 
      'completed', 
      'completed', 
      100, 
      result
    )

    console.log(`✅ Video processing completed successfully: ${processingId}`)
  } catch (error) {
    console.error(`❌ Video processing failed: ${processingId}`, error)
    await videoProcessingService.updateJobStatus(
      processingId, 
      'failed', 
      'error', 
      0, 
      undefined, 
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

// GET endpoint to check upload status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const processingId = searchParams.get('processingId')

    if (!processingId) {
      return NextResponse.json({ error: "Processing ID required" }, { status: 400 })
    }

    const jobStatus = await videoProcessingService.getJobStatus(processingId)
    if (!jobStatus) {
      return NextResponse.json({ error: "Processing job not found" }, { status: 404 })
    }

    return NextResponse.json({
      processingId: jobStatus.processingId,
      status: jobStatus.status,
      currentStep: jobStatus.currentStep,
      progress: jobStatus.progress,
      steps: jobStatus.steps.map(step => ({
        id: step,
        status: jobStatus.currentStep === step ? jobStatus.status : 
               jobStatus.steps.indexOf(step) < jobStatus.steps.indexOf(jobStatus.currentStep) ? 'completed' : 'pending'
      })),
      result: jobStatus.result,
      errorMessage: jobStatus.errorMessage
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ error: "Status check failed" }, { status: 500 })
  }
}
