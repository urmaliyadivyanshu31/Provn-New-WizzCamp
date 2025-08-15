import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Get user profile from database
    const result = await db.query(`
      SELECT 
        u.handle,
        u.display_name,
        u.bio,
        u.avatar_url,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT v.id) as video_count,
        COALESCE(SUM(vs.total_earnings), 0) as total_earnings
      FROM users u
      LEFT JOIN videos v ON u.address = v.creator_address
      LEFT JOIN video_stats vs ON v.id = vs.video_id
      WHERE u.address = $1
      GROUP BY u.address, u.handle, u.display_name, u.bio, u.avatar_url, u.created_at, u.updated_at
    `, [address])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const profile = result.rows[0]

    return NextResponse.json({
      address,
      handle: profile.handle,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      videoCount: parseInt(profile.video_count),
      totalEarnings: parseFloat(profile.total_earnings)
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const { handle, displayName, bio, isPublic } = await request.json()

    // Verify wallet address from header
    const walletAddress = request.headers.get('X-Wallet-Address')
    if (!walletAddress || walletAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 401 })
    }

    // Validate required fields
    if (!handle || !displayName) {
      return NextResponse.json({ error: 'Handle and display name are required' }, { status: 400 })
    }

    // Validate handle format
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      return NextResponse.json({ error: 'Invalid handle format' }, { status: 400 })
    }

    // Check if handle is available
    const existingHandle = await db.query(
      'SELECT address FROM users WHERE handle = $1',
      [handle.toLowerCase()]
    )
    
    if (existingHandle.rows.length > 0) {
      return NextResponse.json({ error: 'Handle already taken' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT address FROM users WHERE address = $1',
      [address]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 })
    }

    // Create new user profile
    const result = await db.query(`
      INSERT INTO users (address, handle, display_name, bio, is_public)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [address, handle.toLowerCase(), displayName, bio || '', isPublic !== false])

    const newProfile = result.rows[0]

    return NextResponse.json({
      address: newProfile.address,
      handle: newProfile.handle,
      displayName: newProfile.display_name,
      bio: newProfile.bio,
      isPublic: newProfile.is_public,
      createdAt: newProfile.created_at
    })
  } catch (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const { handle, displayName, bio, avatarUrl } = await request.json()

    // Verify authentication
    const authResult = await authService.authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Users can only update their own profile
    if (authResult.user!.address !== address) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate handle uniqueness if provided
    if (handle) {
      const existingUser = await db.query(
        'SELECT address FROM users WHERE handle = $1 AND address != $2',
        [handle, address]
      )
      
      if (existingUser.rows.length > 0) {
        return NextResponse.json({ error: 'Handle already taken' }, { status: 400 })
      }
    }

    // Update profile
    const result = await db.query(`
      UPDATE users 
      SET 
        handle = COALESCE($1, handle),
        display_name = COALESCE($2, display_name),
        bio = COALESCE($3, bio),
        avatar_url = COALESCE($4, avatar_url),
        updated_at = NOW()
      WHERE address = $5
      RETURNING *
    `, [handle, displayName, bio, avatarUrl, address])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedProfile = result.rows[0]

    return NextResponse.json({
      address: updatedProfile.address,
      handle: updatedProfile.handle,
      displayName: updatedProfile.display_name,
      bio: updatedProfile.bio,
      avatarUrl: updatedProfile.avatar_url,
      updatedAt: updatedProfile.updated_at
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
