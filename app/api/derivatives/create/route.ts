import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { authService } from "@/lib/auth"
import { videoProcessingService } from "@/lib/processing"
import { blockchainService } from "@/lib/blockchain"
import { db } from "@/lib/database"

interface DerivativeRequest {
  title: string
  description?: string
  tags: string[]
  parentTokenId: string
  allowRemixing: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authService.authenticateRequest(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("video") as File
    const metadata = JSON.parse(formData.get("metadata") as string) as DerivativeRequest

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

    // Verify user has license for parent video
    const licenseResult = await db.query(`
      SELECT l.*, v.title as parent_title, v.creator_address as parent_creator
      FROM licenses l
      JOIN videos v ON l.video_id = v.id
      WHERE v.token_id = $1 
        AND l.purchaser_address = $2 
        AND l.status = 'active'
        AND (l.rights->>'expiresAt' IS NULL OR l.rights->>'expiresAt'::timestamp > NOW())
    `, [metadata.parentTokenId, authResult.user.address.toLowerCase()])

    if (licenseResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "No valid license found for parent video. Please purchase a license first." 
      }, { status: 403 })
    }

    const license = licenseResult.rows[0]

    // Create processing job for derivative
    const processingJob = await videoProcessingService.createProcessingJob(
      authResult.user.address,
      'derivative',
      {
        title: metadata.title,
        description: metadata.description || '',
        tags: metadata.tags,
        allowRemixing: metadata.allowRemixing,
        creator: authResult.user.address,
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
    processDerivativeAsync(processingJob.processingId, filePath, metadata, authResult.user.address, license)

    return NextResponse.json({
      processingId: processingJob.processingId,
      status: "processing",
      steps: processingJob.steps.map(step => ({ id: step, status: "pending" })),
      estimatedTime: "5-10 minutes",
      message: "Derivative video processing started successfully",
      parentVideo: {
        tokenId: metadata.parentTokenId,
        title: license.parent_title,
        creator: license.parent_creator
      }
    })
  } catch (error) {
    console.error("Derivative creation error:", error)
    return NextResponse.json({ 
      error: "Derivative creation failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

// Process derivative video asynchronously
async function processDerivativeAsync(
  processingId: string, 
  filePath: string, 
  metadata: DerivativeRequest, 
  userAddress: string,
  license: any
) {
  try {
    // Update job status to processing
    await videoProcessingService.updateJobStatus(processingId, 'processing', 'validate', 10)

    // Process the derivative video
    const result = await videoProcessingService.processVideo(
      {
        filepath: filePath,
        originalName: 'derivative_video',
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

    // Mint derivative IP-NFT on blockchain
    const derivativeMetadata = {
      title: metadata.title,
      description: metadata.description || '',
      creator: userAddress,
      tags: metadata.tags,
      ipfsHash: result.videoHash,
      parentTokenId: metadata.parentTokenId,
      allowRemixing: metadata.allowRemixing,
      createdAt: new Date().toISOString(),
      royaltyPercentage: 3, // 3% royalty for derivatives
      licenseTerms: "Derivative Creator License",
      contentType: 'video' as const,
      duration: result.duration,
      resolution: result.resolution
    }

    const mintResult = await blockchainService.mintIpNFT(derivativeMetadata, userAddress)

    // Store derivative video in database
    const derivativeResult = await db.query(`
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
      metadata.parentTokenId,
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

    // Update parent video derivative count
    await db.query(`
      UPDATE video_stats 
      SET derivatives_count = derivatives_count + 1, 
          updated_at = NOW()
      WHERE video_id = (SELECT id FROM videos WHERE token_id = $1)
    `, [metadata.parentTokenId])

    // Create notification for parent video creator
    await db.query(`
      INSERT INTO notifications (
        user_address, type, title, message, data
      ) VALUES (
        $1, 'derivative', 'New Derivative Created', 
        'A derivative video "${metadata.title}" was created from your video',
        $2
      )
    `, [
      license.parent_creator.toLowerCase(),
      JSON.stringify({
        parentTokenId: metadata.parentTokenId,
        parentTitle: license.parent_title,
        derivativeTokenId: mintResult.tokenId,
        derivativeTitle: metadata.title,
        creatorAddress: userAddress
      })
    ])

    // Update job status to completed
    await videoProcessingService.updateJobStatus(
      processingId, 
      'completed', 
      'completed', 
      100, 
      result
    )

    console.log(`✅ Derivative video processing completed successfully: ${processingId}`)
  } catch (error) {
    console.error(`❌ Derivative video processing failed: ${processingId}`, error)
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
