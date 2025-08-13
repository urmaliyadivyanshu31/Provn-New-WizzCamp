import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid address format" }, { status: 400 })
    }

    // Check if user exists and is public
    const userResult = await db.query(
      'SELECT is_public FROM users WHERE address = $1',
      [address.toLowerCase()]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isPublic = userResult.rows[0].is_public

    // For now, only return videos for public profiles
    // In a full implementation, you'd check if the requester is the owner
    if (!isPublic) {
      return NextResponse.json({ 
        error: 'Profile is private',
        videos: []
      }, { status: 403 })
    }

    // Get user's videos with stats
    const videosResult = await db.query(`
      SELECT 
        v.token_id,
        v.title,
        v.description,
        v.ipfs_hash,
        v.transaction_hash,
        v.created_at,
        v.status,
        v.allow_remixing,
        COALESCE(vs.views, 0) as views,
        COALESCE(vs.tips_count, 0) as tips,
        COALESCE(vs.licenses_count, 0) as licenses,
        COALESCE(vs.total_earnings, 0) as earnings,
        ARRAY_AGG(vt.tag) FILTER (WHERE vt.tag IS NOT NULL) as tags
      FROM videos v
      LEFT JOIN video_stats vs ON v.id = vs.video_id
      LEFT JOIN video_tags vt ON v.id = vt.video_id
      WHERE v.creator_address = $1 AND v.status = 'active'
      GROUP BY v.id, v.token_id, v.title, v.description, v.ipfs_hash, v.transaction_hash, 
               v.created_at, v.status, v.allow_remixing, vs.views, vs.tips_count, 
               vs.licenses_count, vs.total_earnings
      ORDER BY v.created_at DESC
    `, [address.toLowerCase()])

    const videos = videosResult.rows.map(row => ({
      tokenId: row.token_id,
      title: row.title,
      description: row.description,
      ipfsHash: row.ipfs_hash,
      transactionHash: row.transaction_hash,
      createdAt: row.created_at,
      status: row.status,
      allowRemixing: row.allow_remixing,
      views: parseInt(row.views || 0),
      tips: parseInt(row.tips || 0),
      licenses: parseInt(row.licenses || 0),
      earnings: parseFloat(row.earnings || 0),
      tags: row.tags || []
    }))

    return NextResponse.json({
      videos,
      count: videos.length
    })
  } catch (error) {
    console.error("Videos fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}