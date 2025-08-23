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

    // Get platform stats matching admin dashboard expectations
    const [
      { count: totalWhitelistRequests },
      { count: pendingRequests },
      { count: totalVipAccesses },
      { count: activeVipAccesses }
    ] = await Promise.all([
      // Total whitelist requests
      supabase
        .from('beta_whitelist')
        .select('*', { count: 'exact', head: true }),
      
      // Pending whitelist requests
      supabase
        .from('beta_whitelist')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Total VIP accesses (placeholder - table may not exist yet)
      Promise.resolve({ count: 0 }),
      
      // Active VIP accesses (placeholder)
      Promise.resolve({ count: 0 })
    ])

    const stats = {
      totalWhitelistRequests: totalWhitelistRequests || 0,
      pendingRequests: pendingRequests || 0,
      totalVipAccesses: totalVipAccesses || 0,
      activeVipAccesses: activeVipAccesses || 0,
      totalAccessAttempts: 0, // placeholder
      blockedAttempts: 0 // placeholder
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin stats'
    }, { status: 500 })
  }
}