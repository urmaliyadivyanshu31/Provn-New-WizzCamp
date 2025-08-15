import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// POST - Create profile
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Profile Creation API: Starting profile creation...')
    
    const walletAddress = request.headers.get('x-wallet-address')
    console.log('🔍 Profile Creation API: Wallet address:', walletAddress)
    
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address header is required' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    const { handle, display_name, bio, avatar_url } = await request.json()

    // Validate handle
    if (!handle) {
      return NextResponse.json(
        { success: false, error: 'Handle is required' },
        { status: 400 }
      )
    }

    // Validate handle format: 3-30 chars, lowercase, alphanumeric + underscore, cannot start with number
    if (!/^[a-z][a-z0-9_]{2,29}$/.test(handle)) {
      return NextResponse.json(
        { success: false, error: 'Handle must be 3-30 characters, lowercase, alphanumeric + underscore, and cannot start with a number' },
        { status: 400 }
      )
    }

    // Validate display_name length
    if (display_name && display_name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Display name must be 50 characters or less' },
        { status: 400 }
      )
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Bio must be 500 characters or less' },
        { status: 400 }
      )
    }

    // Validate avatar_url is either HTTPS or a data URL
    if (avatar_url && !avatar_url.startsWith('https://') && !avatar_url.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Avatar must be an HTTPS URL or uploaded image' },
        { status: 400 }
      )
    }

    // Check if profile already exists for this wallet
    const supabaseAdmin = createAdminClient()
    let existingProfile = null
    
    try {
      const { data: profileData, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id, handle')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing profile:', checkError)
        return NextResponse.json(
          { success: false, error: 'Failed to check existing profile' },
          { status: 500 }
        )
      }

      existingProfile = profileData
    } catch (tableError: any) {
      // If the table doesn't exist, we can't check for existing profiles
      // This is expected during initial setup
      console.warn('Profiles table may not exist yet:', tableError.message)
      // Continue with profile creation
    }

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile already exists for this wallet address' },
        { status: 409 }
      )
    }

    // Check if handle is already taken
    try {
      const { data: handleCheck, error: handleError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('handle', handle.toLowerCase())
        .single()

      if (handleError && handleError.code !== 'PGRST116') {
        console.error('Error checking handle availability:', handleError)
        return NextResponse.json(
          { success: false, error: 'Failed to check handle availability' },
          { status: 500 }
        )
      }

      if (handleCheck) {
        return NextResponse.json(
          { success: false, error: 'Handle is already taken' },
          { status: 409 }
        )
      }
    } catch (tableError: any) {
      // If the table doesn't exist, we can't check for existing handles
      // This is expected during initial setup
      console.warn('Profiles table may not exist yet for handle check:', tableError.message)
      // Continue with profile creation
    }

    // Create profile
    try {
      const { data: profile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          handle: handle.toLowerCase(),
          display_name: display_name || null,
          bio: bio || null,
          avatar_url: avatar_url || null,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating profile:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create profile' },
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
    } catch (tableError: any) {
      console.error('Error creating profile - table may not exist:', tableError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Profiles table does not exist. Please create the profiles table in Supabase first.',
          details: 'Run the SQL migration in your Supabase dashboard to create the profiles table.'
        },
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
    console.error('Failed to create profile:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
