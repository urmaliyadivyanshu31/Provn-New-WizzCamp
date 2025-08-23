import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Admin authentication helper
function validateAdminKey(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_API_KEY
  
  if (!adminKey || !expectedKey || adminKey !== expectedKey) {
    return false
  }
  
  return true
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin key
    if (!validateAdminKey(request)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid admin key' 
      }, { status: 401 })
    }

    const supabase = createAdminClient()
    
    // Get whitelist entries
    const { data: whitelist, error } = await supabase
      .from('whitelist_addresses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      whitelist: whitelist || []
    })

  } catch (error) {
    console.error('Admin whitelist error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch whitelist'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin key
    if (!validateAdminKey(request)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid admin key' 
      }, { status: 401 })
    }

    const { walletAddress, notes } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Add to whitelist
    const { data, error } = await supabase
      .from('whitelist_addresses')
      .insert([{
        wallet_address: walletAddress.toLowerCase(),
        added_by: 'admin',
        active: true,
        notes: notes || 'Added via admin panel'
      }])
      .select()

    if (error) {
      if (error.code === '23505') { // Duplicate key error
        return NextResponse.json({
          success: false,
          error: 'Address already whitelisted'
        }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Address added to whitelist',
      data
    })

  } catch (error) {
    console.error('Admin add whitelist error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add to whitelist'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validate admin key
    if (!validateAdminKey(request)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid admin key' 
      }, { status: 401 })
    }

    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Remove from whitelist
    const { error } = await supabase
      .from('whitelist_addresses')
      .delete()
      .eq('wallet_address', walletAddress.toLowerCase())

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Address removed from whitelist'
    })

  } catch (error) {
    console.error('Admin remove whitelist error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to remove from whitelist'
    }, { status: 500 })
  }
}