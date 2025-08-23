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

    // Get platform stats
    const [
      { count: totalUsers },
      { count: totalVideos },
      { count: totalWhitelisted },
      { data: recentActivity }
    ] = await Promise.all([
      // Total users
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),
      
      // Total videos
      supabase
        .from('platform_videos')
        .select('*', { count: 'exact', head: true }),
      
      // Total whitelisted addresses
      supabase
        .from('whitelist_addresses')
        .select('*', { count: 'exact', head: true })
        .eq('active', true),
      
      // Recent activity (last 10 access attempts)
      supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    const stats = {
      totalUsers: totalUsers || 0,
      totalVideos: totalVideos || 0,
      totalWhitelisted: totalWhitelisted || 0,
      recentActivity: recentActivity || []
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin stats'
    }, { status: 500 })
  }
}