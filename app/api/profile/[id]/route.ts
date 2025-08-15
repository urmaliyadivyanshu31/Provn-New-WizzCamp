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

    // Debug logging
    console.log('🔍 Profile API: Fetching profile for ID:', id)
    console.log('🔍 Profile API: Environment variables:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'
    })

    const supabase = createAdminClient()
    
    let query = supabase
      .from('profiles')
      .select('*')

    // Check if id is a wallet address (0x...)
    if (id.startsWith('0x') && id.length === 42) {
      query = query.eq('wallet_address', id.toLowerCase())
    } else {
      // Assume it's a handle
      query = query.eq('handle', id.toLowerCase())
    }

    console.log('🔍 Profile API: Executing query...')
    const { data: profile, error } = await query.single()
    console.log('🔍 Profile API: Query result:', { profile: !!profile, error: error?.message })

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log('🔍 Profile API: Profile not found (404)')
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }
      
      console.error('❌ Profile API: Error fetching profile:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

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
    console.error('Failed to fetch profile:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
