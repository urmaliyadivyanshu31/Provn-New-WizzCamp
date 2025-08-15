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
    const { amount, message } = body

    // Validate amount
    if (!amount || BigInt(amount) <= 0) {
      return NextResponse.json({ error: "Invalid tip amount" }, { status: 400 })
    }

    // Get video information
    const videoResult = await db.query(`
      SELECT v.*, u.address as creator_address
      FROM videos v
      JOIN users u ON v.creator_address = u.address
      WHERE v.token_id = $1 AND v.status = 'active'
    `, [id])

    if (videoResult.rows.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const video = videoResult.rows[0]

    // Check if user is trying to tip themselves
    if (video.creator_address.toLowerCase() === authResult.user.address.toLowerCase()) {
      return NextResponse.json({ error: "Cannot tip yourself" }, { status: 400 })
    }

    // Send tip on blockchain
    const tipData = {
      tokenId: id,
      amount: amount,
      message: message || ''
    }

    const transactionResult = await blockchainService.sendTip(
      tipData,
      authResult.user.address
    )

    if (transactionResult.status !== 'success') {
      return NextResponse.json({ error: "Tip sending failed on blockchain" }, { status: 500 })
    }

    // Store tip in database
    const tipResult = await db.query(`
      INSERT INTO tips (
        video_id, from_address, to_address, amount, 
        message, transaction_hash, block_number, status
      ) VALUES (
        (SELECT id FROM videos WHERE token_id = $1),
        $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `, [
      id,
      authResult.user.address.toLowerCase(),
      video.creator_address.toLowerCase(),
      amount,
      message || '',
      transactionResult.transactionHash,
      transactionResult.blockNumber,
      'confirmed'
    ])

    // Update video stats
    await db.query(`
      UPDATE video_stats 
      SET tips_count = tips_count + 1, 
          tips_total = tips_total + $1,
          total_earnings = total_earnings + $1,
          updated_at = NOW()
      WHERE video_id = (SELECT id FROM videos WHERE token_id = $2)
    `, [amount, id])

    // Create notification for creator
    await db.query(`
      INSERT INTO notifications (
        user_address, type, title, message, data
      ) VALUES (
        $1, 'tip', 'New Tip Received', 
        'You received a tip of ${BigInt(amount) / BigInt(10**18)} wCAMP for your video "${video.title}"',
        $2
      )
    `, [
      video.creator_address.toLowerCase(),
      JSON.stringify({
        videoId: id,
        videoTitle: video.title,
        tipAmount: amount,
        fromAddress: authResult.user.address,
        message: message || ''
      })
    ])

    return NextResponse.json({
      message: "Tip sent successfully",
      tip: {
        id: tipResult.rows[0].id,
        videoId: id,
        amount: amount,
        message: message || '',
        transactionHash: transactionResult.transactionHash,
        sentAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Tip sending error:", error)
    return NextResponse.json({ 
      error: "Failed to send tip",
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

    // Get video tip information
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

    // Get recent tips for this video
    const tipsResult = await db.query(`
      SELECT t.*, u.handle as from_handle, u.display_name as from_name
      FROM tips t
      JOIN users u ON t.from_address = u.address
      WHERE t.video_id = (SELECT id FROM videos WHERE token_id = $1)
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [id])

    const tips = tipsResult.rows.map(tip => ({
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

    const tipInfo = {
      videoId: id,
      title: video.title,
      creator: {
        address: video.creator_address,
        handle: video.creator_handle,
        displayName: video.creator_name
      },
      recentTips: tips,
      suggestedAmounts: [
        { amount: '1000000000000000000', label: '1 wCAMP' },
        { amount: '5000000000000000000', label: '5 wCAMP' },
        { amount: '10000000000000000000', label: '10 wCAMP' },
        { amount: '25000000000000000000', label: '25 wCAMP' }
      ]
    }

    return NextResponse.json(tipInfo)
  } catch (error) {
    console.error("Tip info error:", error)
    return NextResponse.json({ error: "Failed to get tip information" }, { status: 500 })
  }
}
