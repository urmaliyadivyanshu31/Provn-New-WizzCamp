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
    
    // Get beta whitelist requests
    const { data: requests, error } = await supabase
      .from('beta_whitelist')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Database error fetching whitelist:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        requests: requests || []
      }
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

    const { requestId, status, notes } = await request.json()

    if (!requestId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Request ID and status are required'
      }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Status must be "approved" or "rejected"'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update whitelist request status
    const { data, error } = await supabase
      .from('beta_whitelist')
      .update({
        status: status,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes || null
      })
      .eq('id', requestId)
      .select()

    if (error) {
      console.error('Database error updating request:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Request not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Request ${status} successfully`,
      data: data[0]
    })

  } catch (error) {
    console.error('Admin update request error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update request'
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