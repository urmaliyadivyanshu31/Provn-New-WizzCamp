import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { db } from "@/lib/database"

interface DisputeRequest {
  targetTokenId: string
  reason: 'duplicate' | 'infringement' | 'inappropriate' | 'other'
  description: string
  contactEmail: string
  evidenceFiles?: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authService.authenticateRequest(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body: DisputeRequest = await request.json()
    const { targetTokenId, reason, description, contactEmail, evidenceFiles } = body

    // Validate required fields
    if (!targetTokenId || !reason || !description || !contactEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate reason
    const validReasons = ['duplicate', 'infringement', 'inappropriate', 'other']
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 })
    }

    // Check if video exists
    const videoResult = await db.query(`
      SELECT v.*, u.handle as creator_handle
      FROM videos v
      JOIN users u ON v.creator_address = u.address
      WHERE v.token_id = $1
    `, [targetTokenId])

    if (videoResult.rows.length === 0) {
      return NextResponse.json({ error: "Target video not found" }, { status: 404 })
    }

    const video = videoResult.rows[0]

    // Check if user is trying to dispute their own video
    if (video.creator_address.toLowerCase() === authResult.user.address.toLowerCase()) {
      return NextResponse.json({ error: "Cannot dispute your own video" }, { status: 400 })
    }

    // Check if dispute already exists for this video from this user
    const existingDispute = await db.query(`
      SELECT id FROM disputes 
      WHERE target_token_id = $1 AND reporter_address = $2 AND status IN ('pending', 'investigating')
    `, [targetTokenId, authResult.user.address.toLowerCase()])

    if (existingDispute.rows.length > 0) {
      return NextResponse.json({ error: "You already have an active dispute for this video" }, { status: 409 })
    }

    // Generate case number
    const caseNumber = `DIS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create dispute
    const disputeResult = await db.query(`
      INSERT INTO disputes (
        case_number, target_token_id, reporter_address, reason, 
        description, contact_email, evidence_files, status, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      caseNumber,
      targetTokenId,
      authResult.user.address.toLowerCase(),
      reason,
      description,
      contactEmail,
      JSON.stringify(evidenceFiles || []),
      'pending',
      reason === 'infringement' ? 'high' : 'normal'
    ])

    // Create notification for video creator
    await db.query(`
      INSERT INTO notifications (
        user_address, type, title, message, data
      ) VALUES (
        $1, 'dispute', 'Content Dispute Filed', 
        'A dispute has been filed against your video "${video.title}"',
        $2
      )
    `, [
      video.creator_address.toLowerCase(),
      JSON.stringify({
        caseNumber,
        reason,
        description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
        reporterAddress: authResult.user.address
      })
    ])

    return NextResponse.json({
      message: "Dispute filed successfully",
      dispute: {
        caseNumber,
        targetTokenId,
        reason,
        status: 'pending',
        priority: reason === 'infringement' ? 'high' : 'normal',
        filedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Dispute creation error:", error)
    return NextResponse.json({ 
      error: "Failed to file dispute",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authService.authenticateRequest(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const reason = searchParams.get('reason')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query based on user role and filters
    let query = `
      SELECT d.*, v.title as video_title, u.handle as creator_handle, u.display_name as creator_name,
             r.handle as reporter_handle, r.display_name as reporter_name
      FROM disputes d
      JOIN videos v ON d.target_token_id = v.token_id
      JOIN users u ON v.creator_address = u.address
      JOIN users r ON d.reporter_address = r.address
      WHERE 1=1
    `
    const queryParams: any[] = []
    let paramIndex = 1

    // Filter by status
    if (status) {
      query += ` AND d.status = $${paramIndex++}`
      queryParams.push(status)
    }

    // Filter by reason
    if (reason) {
      query += ` AND d.reason = $${paramIndex++}`
      queryParams.push(reason)
    }

    // Users can only see disputes they filed or disputes against their content
    query += ` AND (d.reporter_address = $${paramIndex++} OR v.creator_address = $${paramIndex++})`
    queryParams.push(authResult.user.address.toLowerCase(), authResult.user.address.toLowerCase())

    // Add ordering and pagination
    query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    queryParams.push(limit, offset)

    const disputesResult = await db.query(query, queryParams)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM disputes d
      JOIN videos v ON d.target_token_id = v.token_id
      WHERE (d.reporter_address = $1 OR v.creator_address = $1)
    `
    const countParams = [authResult.user.address.toLowerCase()]
    
    if (status) {
      countQuery += ` AND d.status = $2`
      countParams.push(status)
    }
    if (reason) {
      countQuery += ` AND d.reason = $${countParams.length + 1}`
      countParams.push(reason)
    }

    const countResult = await db.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    const disputes = disputesResult.rows.map(dispute => ({
      caseNumber: dispute.case_number,
      targetTokenId: dispute.target_token_id,
      videoTitle: dispute.video_title,
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      priority: dispute.priority,
      reporter: {
        address: dispute.reporter_address,
        handle: dispute.reporter_handle,
        displayName: dispute.reporter_name
      },
      creator: {
        address: dispute.creator_address,
        handle: dispute.creator_handle,
        displayName: dispute.creator_name
      },
      evidenceFiles: dispute.evidence_files || [],
      resolution: dispute.resolution,
      assignedModerator: dispute.assigned_moderator,
      createdAt: dispute.created_at,
      updatedAt: dispute.updated_at,
      resolvedAt: dispute.resolved_at
    }))

    return NextResponse.json({
      disputes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Disputes fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 })
  }
}
