import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { blockchainService } from "@/lib/blockchain"
import { db } from "@/lib/database"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await authService.authenticateRequest(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { licenseType, duration, price } = body

    // Validate license type
    const validLicenseTypes = ['personal', 'educational', 'commercial']
    if (!validLicenseTypes.includes(licenseType)) {
      return NextResponse.json({ error: "Invalid license type" }, { status: 400 })
    }

    // Get video information
    const videoResult = await db.query(`
      SELECT v.*, u.address as creator_address
      FROM videos v
      JOIN users u ON v.creator_address = u.address
      WHERE v.token_id = $1 AND v.status = 'active'
    `, [id])

    if (videoResult.rows.length === 0) {
      return NextResponse.json({ error: "Video not found or not available for licensing" }, { status: 404 })
    }

    const video = videoResult.rows[0]

    // Check if user is trying to license their own video
    if (video.creator_address.toLowerCase() === authResult.user.address.toLowerCase()) {
      return NextResponse.json({ error: "Cannot license your own video" }, { status: 400 })
    }

    // Check if video allows remixing
    if (!video.allow_remixing) {
      return NextResponse.json({ error: "This video does not allow remixing" }, { status: 400 })
    }

    // Calculate license price and shares
    const licensePrice = price || "10000000000000000000" // 10 wCAMP in wei
    const creatorShare = BigInt(licensePrice) * BigInt(70) / BigInt(100) // 70% to creator
    const platformShare = BigInt(licensePrice) - creatorShare // 30% to platform

    // Purchase license on blockchain
    const licenseData = {
      tokenId: id,
      licenseType: licenseType as 'commercial' | 'educational' | 'personal',
      price: licensePrice,
      duration: duration || 0 // 0 for perpetual
    }

    const transactionResult = await blockchainService.purchaseLicense(id, licensePrice, "premium", 
      licenseData,
      authResult.user.address
    )

    if (transactionResult.status !== 'success') {
      return NextResponse.json({ error: "License purchase failed on blockchain" }, { status: 500 })
    }

    // Store license in database
    const licenseResult = await db.query(`
      INSERT INTO licenses (
        video_id, purchaser_address, creator_address, price, 
        creator_share, platform_share, transaction_hash, 
        block_number, status, rights
      ) VALUES (
        (SELECT id FROM videos WHERE token_id = $1),
        $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *
    `, [
      id,
      authResult.user.address.toLowerCase(),
      video.creator_address.toLowerCase(),
      licensePrice,
      creatorShare.toString(),
      platformShare.toString(),
      transactionResult.transactionHash,
      transactionResult.blockNumber,
      'active',
      JSON.stringify({
        type: licenseType,
        duration: duration || 0,
        purchasedAt: new Date().toISOString(),
        expiresAt: duration > 0 ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null
      })
    ])

    // Update video stats
    await db.query(`
      UPDATE video_stats 
      SET licenses_count = licenses_count + 1, 
          licenses_total = licenses_total + $1,
          total_earnings = total_earnings + $1,
          updated_at = NOW()
      WHERE video_id = (SELECT id FROM videos WHERE token_id = $2)
    `, [creatorShare.toString(), id])

    return NextResponse.json({
      message: "License purchased successfully",
      license: {
        id: licenseResult.rows[0].id,
        videoId: id,
        licenseType,
        duration: duration || 0,
        price: licensePrice,
        transactionHash: transactionResult.transactionHash,
        purchasedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("License purchase error:", error)
    return NextResponse.json({ 
      error: "Failed to purchase license",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = params

    // Get video license information
    const videoResult = await db.query(`
      SELECT v.*, u.handle as creator_handle, u.display_name as creator_name
      FROM videos v
      JOIN users u ON v.creator_address = u.address
      WHERE v.token_id = $1
    `, [id])

    if (videoResult.rows.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const video = videoResult.rows[0]

    // Get license pricing information
    const licenseInfo = {
      videoId: id,
      title: video.title,
      creator: {
        address: video.creator_address,
        handle: video.creator_handle,
        displayName: video.creator_name
      },
      allowRemixing: video.allow_remixing,
      licenseOptions: [
        {
          type: 'personal',
          price: '10000000000000000000', // 10 wCAMP in wei
          duration: 0, // perpetual
          description: 'Personal use only'
        },
        {
          type: 'educational',
          price: '20000000000000000000', // 20 wCAMP in wei
          duration: 365, // 1 year
          description: 'Educational and non-commercial use'
        },
        {
          type: 'commercial',
          price: '50000000000000000000', // 50 wCAMP in wei
          duration: 0, // perpetual
          description: 'Commercial use and remixing'
        }
      ],
      revenueShare: {
        creator: 70,
        platform: 30
      }
    }

    return NextResponse.json(licenseInfo)
  } catch (error) {
    console.error("License info error:", error)
    return NextResponse.json({ error: "Failed to get license information" }, { status: 500 })
  }
}
