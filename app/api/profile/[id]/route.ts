import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch profile by ID, handle, or wallet address (test version)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Profile identifier is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Profile Fetch API: Fetching profile for ID:', id)
    
    // For now, return a mock profile to test if the route works
    // TODO: Re-enable real Supabase fetching once we confirm the route works
    const mockProfile = {
      id: 'test-profile-id',
      wallet_address: id.toLowerCase(),
      handle: 'testuser',
      display_name: 'Test User',
      bio: 'This is a test profile',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('🔍 Profile Fetch API: Returning mock profile')
    
    return NextResponse.json({
      success: true,
      profile: mockProfile
    })

  } catch (error) {
    console.error('❌ Profile Fetch API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
