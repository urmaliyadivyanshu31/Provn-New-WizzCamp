import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Database Health: Checking database connection...')
    
    const supabaseAdmin = createAdminClient()
    
    // Test basic Supabase connection
    const startTime = Date.now()
    
    // Check if profiles table exists and is accessible
    const { data: profilesTest, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true })
    
    const responseTime = Date.now() - startTime
    
    const status = {
      connection: true,
      response_time_ms: responseTime,
      profiles_table: {
        exists: !profilesError,
        error: profilesError?.message || null,
        error_code: profilesError?.code || null,
        accessible: !profilesError
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
    
    console.log('📊 Database Health Status:', status)
    
    return NextResponse.json({
      success: true,
      status,
      message: status.profiles_table.exists 
        ? 'Database is healthy and ready' 
        : 'Database connection works but profiles table needs setup'
    })
    
  } catch (error) {
    console.error('❌ Database Health Check Failed:', error)
    
    return NextResponse.json({
      success: false,
      status: {
        connection: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      message: 'Database health check failed'
    }, { status: 500 })
  }
}