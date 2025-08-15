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

    console.log('🔍 Profile API: Fetching profile for ID:', id)
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 Profile API: Environment check:', {
      supabaseUrl: supabaseUrl ? '✅' : '❌',
      serviceRoleKey: serviceRoleKey ? '✅' : '❌'
    })
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Profile API: Missing environment variables')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    try {
      const supabase = createAdminClient()
      console.log('🔍 Profile API: Supabase client created')
      
      let query = supabase
        .from('profiles')
        .select('*')

      // Check if id is a wallet address (0x...)
      if (id.startsWith('0x') && id.length === 42) {
        console.log('🔍 Profile API: Querying by wallet address:', id.toLowerCase())
        query = query.eq('wallet_address', id.toLowerCase())
      } else {
        console.log('🔍 Profile API: Querying by handle:', id.toLowerCase())
        query = query.eq('handle', id.toLowerCase())
      }

      console.log('🔍 Profile API: Executing query...')
      const { data: profile, error } = await query.single()
      
      console.log('🔍 Profile API: Query result:', { 
        hasProfile: !!profile, 
        error: error?.message,
        errorCode: error?.code 
      })

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          console.log('🔍 Profile API: Profile not found (404)')
          return NextResponse.json(
            { success: false, error: 'Profile not found' },
            { status: 404 }
          )
        }
        
        console.error('❌ Profile API: Supabase error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch profile' },
          { status: 500 }
        )
      }

      console.log('🔍 Profile API: Profile found:', {
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

    } catch (supabaseError: any) {
      console.error('❌ Profile API: Supabase client error:', supabaseError)
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Profile API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
