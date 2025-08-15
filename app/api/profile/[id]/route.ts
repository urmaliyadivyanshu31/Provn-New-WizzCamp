import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

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

    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
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

    const { data: profile, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching profile:', error)
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
