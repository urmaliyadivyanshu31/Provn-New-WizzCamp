import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// GET - Fetch analytics data for a profile
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

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    let profileAddress: string

    // Check if id is a wallet address (0x...)
    if (id.startsWith('0x') && id.length === 42) {
      profileAddress = id.toLowerCase()
    } else {
      // Assume it's a handle, get the wallet address
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('handle', id.toLowerCase())
        .single()

      if (profileError) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }
      profileAddress = profile.wallet_address
    }

    // Get videos count
    const { count: videosCount, error: videosError } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('owner_address', profileAddress)

    if (videosError) {
      console.error('Error fetching videos count:', videosError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos count' },
        { status: 500 }
      )
    }

    // Get total views
    const { data: videosData, error: videosDataError } = await supabase
      .from('videos')
      .select('views_count')
      .eq('owner_address', profileAddress)

    if (videosDataError) {
      console.error('Error fetching videos data:', videosDataError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos data' },
        { status: 500 }
      )
    }

    const totalViews = videosData?.reduce((sum, video) => sum + (video.views_count || 0), 0) || 0

    // Get total earnings
    const { data: earningsData, error: earningsError } = await supabase
      .from('videos')
      .select('total_earnings')
      .eq('owner_address', profileAddress)

    if (earningsError) {
      console.error('Error fetching earnings data:', earningsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch earnings data' },
        { status: 500 }
      )
    }

    const totalEarnings = earningsData?.reduce((sum, video) => sum + parseFloat(video.total_earnings || '0'), 0) || 0

    // Get total licenses
    const { count: licensesCount, error: licensesError } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', supabase.from('videos').select('id').eq('owner_address', profileAddress))

    if (licensesError) {
      console.error('Error fetching licenses count:', licensesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch licenses count' },
        { status: 500 }
      )
    }

    // Get content performance metrics
    const { data: performanceData, error: performanceError } = await supabase
      .from('videos')
      .select('views_count, tips_count, licenses_count, total_earnings')
      .eq('owner_address', profileAddress)

    if (performanceError) {
      console.error('Error fetching performance data:', performanceError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch performance data' },
        { status: 500 }
      )
    }

    const videoCount = videosCount || 0
    const avgViewsPerVideo = videoCount > 0 ? Math.round(totalViews / videoCount) : 0
    const avgTipsPerVideo = videoCount > 0 ? Math.round((performanceData?.reduce((sum, v) => sum + (v.tips_count || 0), 0) || 0) / videoCount) : 0
    const avgEarningsPerVideo = videoCount > 0 ? parseFloat((totalEarnings / videoCount).toFixed(1)) : 0

    // Get revenue breakdown
    const { data: revenueData, error: revenueError } = await supabase
      .from('videos')
      .select('tips_revenue, license_revenue, derivative_royalties')
      .eq('owner_address', profileAddress)

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch revenue data' },
        { status: 500 }
      )
    }

    const totalTipsRevenue = revenueData?.reduce((sum, v) => sum + parseFloat(v.tips_revenue || '0'), 0) || 0
    const totalLicenseRevenue = revenueData?.reduce((sum, v) => sum + parseFloat(v.license_revenue || '0'), 0) || 0
    const totalDerivativeRoyalties = revenueData?.reduce((sum, v) => sum + parseFloat(v.derivative_royalties || '0'), 0) || 0

    // Get top performing videos
    const { data: topVideos, error: topVideosError } = await supabase
      .from('videos')
      .select('id, title, video_type, created_at, views_count, tips_count, licenses_count')
      .eq('owner_address', profileAddress)
      .order('views_count', { ascending: false })
      .limit(4)

    if (topVideosError) {
      console.error('Error fetching top videos:', topVideosError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch top videos' },
        { status: 500 }
      )
    }

    // Format top videos data
    const formattedTopVideos = topVideos?.map((video, index) => ({
      rank: index + 1,
      title: video.title,
      type: video.video_type.charAt(0).toUpperCase() + video.video_type.slice(1),
      date: new Date(video.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      views: video.views_count?.toLocaleString() || '0',
      tips: video.tips_count?.toString() || '0',
      licenses: video.licenses_count?.toString() || '0'
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        // Overview stats
        videos: videoCount,
        views: totalViews,
        wCAMP: parseFloat(totalEarnings.toFixed(1)),
        licenses: licensesCount || 0,
        
        // Content performance
        avgViewsPerVideo,
        avgTipsPerVideo,
        licenseConversionRate: videoCount > 0 ? parseFloat(((licensesCount || 0) / videoCount * 100).toFixed(2)) : 0,
        avgEarningsPerVideo,
        
        // Revenue breakdown
        tipsRevenue: parseFloat(totalTipsRevenue.toFixed(1)),
        licenseRevenue: parseFloat(totalLicenseRevenue.toFixed(1)),
        derivativeRoyalties: parseFloat(totalDerivativeRoyalties.toFixed(1)),
        totalEarnings: parseFloat(totalEarnings.toFixed(1)),
        
        // Top performing videos
        topVideos: formattedTopVideos
      }
    })

  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
