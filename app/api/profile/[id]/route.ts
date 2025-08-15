import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

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

    console.log('🔍 Profile Fetch API: Fetching profile for ID:', id)
    
    // Fetch profile from Supabase
    const supabase = createAdminClient()
    
    let query = supabase
      .from('profiles')
      .select('*')

    // Check if id is a wallet address (0x...)
    if (id.startsWith('0x') && id.length === 42) {
      console.log('🔍 Profile Fetch API: Querying by wallet address:', id.toLowerCase())
      query = query.eq('wallet_address', id.toLowerCase())
    } else {
      console.log('🔍 Profile Fetch API: Querying by handle:', id.toLowerCase())
      query = query.eq('handle', id.toLowerCase())
    }

    console.log('🔍 Profile Fetch API: Executing query...')
    const { data: profile, error } = await query.single()
    
    console.log('🔍 Profile Fetch API: Query result:', { 
      hasProfile: !!profile, 
      error: error?.message,
      errorCode: error?.code 
    })

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log('🔍 Profile Fetch API: Profile not found (404)')
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }
      
      console.error('❌ Profile Fetch API: Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    console.log('🔍 Profile Fetch API: Profile found:', {
      id: profile.id,
      handle: profile.handle,
      wallet_address: profile.wallet_address
    })
    
    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        wallet_address: profile.wallet_address,
        handle: profile.handle,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }
    })

  } catch (error) {
    console.error('❌ Profile Fetch API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
