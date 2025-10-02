import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    console.log('📹 Fetching videos for creator:', walletAddress)

    // Fetch all videos for this creator with relevant fields
    const { data: videos, error } = await supabase
      .from('platform_videos')
      .select(`
        id,
        token_id,
        title,
        description,
        thumbnail_url,
        video_url,
        license_synced,
        license_synced_at,
        price_per_period,
        license_duration,
        views_count,
        licenses_sold,
        total_revenue,
        is_derivative,
        parent_token_id,
        derivative_count,
        uploaded_at,
        published_at
      `)
      .eq('creator_wallet', walletAddress.toLowerCase())
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching creator videos:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos' },
        { status: 500 }
      )
    }

    console.log('✅ Found videos:', videos?.length || 0)

    return NextResponse.json({
      success: true,
      videos: videos || [],
      count: videos?.length || 0
    })
  } catch (error) {
    console.error('❌ Error in creator videos API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
