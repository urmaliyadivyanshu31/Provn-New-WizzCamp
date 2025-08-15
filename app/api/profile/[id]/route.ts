import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch profile by ID, handle, or wallet address
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

    console.log('🔍 Profile API: Fetching profile for ID:', id)
    
    // For now, just return a mock profile to test if the API works at all
    // This will help us isolate whether the issue is with the API route or Supabase
    const mockProfile = {
      id: 'test-id',
      wallet_address: id.toLowerCase(),
      handle: 'testuser',
      display_name: 'Test User',
      bio: 'This is a test profile',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('🔍 Profile API: Returning mock profile')
    
    return NextResponse.json({
      success: true,
      profile: mockProfile
    })

  } catch (error) {
    console.error('❌ Profile API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
