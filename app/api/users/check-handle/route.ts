import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const handle = searchParams.get('handle')

    if (!handle) {
      return NextResponse.json({ error: "Handle parameter is required" }, { status: 400 })
    }

    // Validate handle format
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      return NextResponse.json({ 
        available: false, 
        error: "Handle can only contain letters, numbers, and underscores" 
      }, { status: 400 })
    }

    if (handle.length < 3 || handle.length > 30) {
      return NextResponse.json({ 
        available: false, 
        error: "Handle must be between 3 and 30 characters" 
      }, { status: 400 })
    }

    // Check if handle exists in database
    const result = await db.query(
      'SELECT id FROM users WHERE handle = $1',
      [handle.toLowerCase()]
    )

    const available = result.rows.length === 0

    return NextResponse.json({ 
      available,
      handle: handle.toLowerCase(),
      message: available ? "Handle is available" : "Handle is already taken"
    })
  } catch (error) {
    console.error("Handle check error:", error)
    return NextResponse.json({ 
      error: "Failed to check handle availability",
      available: false 
    }, { status: 500 })
  }
}