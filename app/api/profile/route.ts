import { NextRequest, NextResponse } from 'next/server'

// POST - Create profile (minimal test version)
export async function POST(request: NextRequest) {
  console.log('🔍 Profile Creation API: Route reached!')
  
  try {
    // Just return success for now to test if the route works
    console.log('🔍 Profile Creation API: Returning success')
    
    return NextResponse.json({
      success: true,
      profile: {
        id: 'test-id',
        wallet_address: 'test-address',
        handle: 'testuser',
        display_name: 'Test User',
        bio: 'Test bio',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('❌ Profile Creation API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Test error' },
      { status: 500 }
    )
  }
}
