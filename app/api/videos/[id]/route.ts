import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { ipfsService } from "@/lib/ipfs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get video information from database
    const videoResult = await db.query(`
      SELECT v.*, u.handle as creator_handle, u.display_name as creator_name, u.avatar_url as creator_avatar
      FROM videos v
      JOIN users u ON v.creator_address = u.address
      WHERE v.token_id = $1
    `, [id])

    if (videoResult.rows.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const video = videoResult.rows[0]

    // Get video tags
    const tagsResult = await db.query(`
      SELECT tag FROM video_tags WHERE video_id = $1
    `, [video.id])

    const tags = tagsResult.rows.map(row => row.tag)

    // Get video stats
    const statsResult = await db.query(`
      SELECT * FROM video_stats WHERE video_id = $1
    `, [video.id])

    const stats = statsResult.rows[0] || {
      views: 0,
      tips_count: 0,
      tips_total: 0,
      licenses_count: 0,
      licenses_total: 0,
      derivatives_count: 0,
      total_earnings: 0
    }

    // Get recent tips
    const tipsResult = await db.query(`
      SELECT t.*, u.handle as from_handle, u.display_name as from_name
      FROM tips t
      JOIN users u ON t.from_address = u.address
      WHERE t.video_id = $1
      ORDER BY t.created_at DESC
      LIMIT 5
    `, [video.id])

    const recentTips = tipsResult.rows.map(tip => ({
      id: tip.id,
      amount: tip.amount,
      message: tip.message,
      from: {
        address: tip.from_address,
        handle: tip.from_handle,
        displayName: tip.from_name
      },
      sentAt: tip.created_at
    }))

    // Get recent licenses
    const licensesResult = await db.query(`
      SELECT l.*, u.handle as purchaser_handle, u.display_name as purchaser_name
      FROM licenses l
      JOIN users u ON l.purchaser_address = u.address
      WHERE l.video_id = $1
      ORDER BY l.created_at DESC
      LIMIT 5
    `, [video.id])

    const recentLicenses = licensesResult.rows.map(license => ({
      id: license.id,
      type: license.rights ? JSON.parse(license.rights).type : 'unknown',
      price: license.price,
      purchaser: {
        address: license.purchaser_address,
        handle: license.purchaser_handle,
        displayName: license.purchaser_name
      },
      purchasedAt: license.created_at
    }))

    // Get derivatives (videos that reference this one)
    const derivativesResult = await db.query(`
      SELECT v.*, u.handle as creator_handle, u.display_name as creator_name
      FROM videos v
      JOIN users u ON v.creator_address = u.address
      WHERE v.parent_token_id = $1 AND v.status = 'active'
      ORDER BY v.created_at DESC
      LIMIT 10
    `, [id])

    const derivatives = derivativesResult.rows.map(derivative => ({
      tokenId: derivative.token_id,
      title: derivative.title,
      creator: {
        address: derivative.creator_address,
        handle: derivative.creator_handle,
        displayName: derivative.creator_name
      },
      createdAt: derivative.created_at
    }))

    // Construct video details response
    const videoDetails = {
      tokenId: video.token_id,
      title: video.title,
      description: video.description,
      creator: {
        address: video.creator_address,
        handle: video.creator_handle,
        displayName: video.creator_name,
        avatarUrl: video.creator_avatar
      },
      metadata: {
        ipfsHash: video.ipfs_hash,
        duration: video.duration,
        resolution: video.resolution,
        format: video.format,
        fileSize: video.file_size,
        allowRemixing: video.allow_remixing,
        perceptualHash: video.perceptual_hash
      },
      blockchain: {
        transactionHash: video.transaction_hash,
        blockNumber: video.block_number,
        contractAddress: video.contract_address,
        status: video.status
      },
      tags,
      stats: {
        views: parseInt(stats.views),
        tipsCount: parseInt(stats.tips_count),
        tipsTotal: parseFloat(stats.tips_total),
        licensesCount: parseInt(stats.licenses_count),
        licensesTotal: parseFloat(stats.licenses_total),
        derivativesCount: parseInt(stats.derivatives_count),
        totalEarnings: parseFloat(stats.total_earnings)
      },
      recentActivity: {
        tips: recentTips,
        licenses: recentLicenses
      },
      derivatives,
      createdAt: video.created_at,
      updatedAt: video.updated_at
    }

    return NextResponse.json(videoDetails)
  } catch (error) {
    console.error("Video fetch error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch video details",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This endpoint would be used for updating video metadata
    // For now, return not implemented
    return NextResponse.json({ error: "Video updates not implemented yet" }, { status: 501 })
  } catch (error) {
    console.error("Video update error:", error)
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 })
  }
}
