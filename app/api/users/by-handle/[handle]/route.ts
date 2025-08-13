import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params

    if (!handle) {
      return NextResponse.json({ error: "Handle parameter is required" }, { status: 400 })
    }

    // Get user by handle
    const result = await db.query(
      'SELECT address, handle, display_name, bio, avatar_url, is_public, created_at FROM users WHERE handle = $1',
      [handle.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = result.rows[0]

    // Only return public profiles or basic info
    if (!user.is_public) {
      return NextResponse.json({ 
        error: 'Profile is private',
        address: user.address // Still return address for internal use
      }, { status: 403 })
    }

    return NextResponse.json({
      address: user.address,
      handle: user.handle,
      displayName: user.display_name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      isPublic: user.is_public,
      createdAt: user.created_at
    })
  } catch (error) {
    console.error("Handle lookup error:", error)
    return NextResponse.json({ error: "Failed to find user" }, { status: 500 })
  }
}