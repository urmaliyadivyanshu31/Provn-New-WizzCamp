import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { PlatformVideoService } from '@/services/platformVideos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get('wallet')
    const handle = searchParams.get('handle')
    
    if (!wallet && !handle) {
      return NextResponse.json(
        { success: false, error: 'Either wallet or handle parameter is required' },
        { status: 400 }
      )
    }
    
    console.log('👤 Users API: Fetching user profile for:', wallet || handle)
    
    const supabase = createAdminClient()
    
    // Query profile based on wallet or handle
    let query = supabase.from('profiles').select('*')
    
    if (wallet) {
      query = query.eq('wallet_address', wallet.toLowerCase())
    } else if (handle) {
      query = query.eq('handle', handle.toLowerCase())
    }
    
    const { data: profile, error: profileError } = await query.single()
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
      console.error('❌ Users API: Profile error:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }
    
    // Get user's videos
    let recentContent: any[] = []
    try {
      const videosData = await PlatformVideoService.getVideosByCreator(profile.wallet_address)
      recentContent = videosData.videos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnail_url,
        mintDate: video.uploaded_at,
        fileType: 'video/mp4' // Default to video for now
      }))
    } catch (videoError) {
      console.warn('⚠️ Users API: Failed to fetch videos:', videoError)
      // Continue without videos rather than failing
    }
    
    // Get video count
    let totalContent = 0
    try {
      const { count } = await supabase
        .from('platform_videos')
        .select('*', { count: 'exact', head: true })
        .eq('creator_wallet', profile.wallet_address)
      totalContent = count || 0
    } catch (countError) {
      console.warn('⚠️ Users API: Failed to get video count:', countError)
    }
    
    // Calculate stats
    const totalViews = recentContent.reduce((sum, content) => sum + (content.views || 0), 0)
    const totalLikes = recentContent.reduce((sum, content) => sum + (content.likes || 0), 0)
    
    const user = {
      id: parseInt(profile.id.replace(/-/g, '').slice(0, 8), 16), // Convert UUID to number
      walletAddress: profile.wallet_address,
      handle: profile.handle,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      bannerUrl: null, // Not implemented yet
      verified: false, // Not implemented yet
      followersCount: 0, // Not implemented yet
      followingCount: 0, // Not implemented yet
      totalEarnings: 0, // Not implemented yet
      joinedDate: profile.created_at,
      stats: {
        totalContent,
        totalLikes,
        totalViews,
        totalTipsReceived: 0 // Not implemented yet
      },
      recentContent: recentContent.slice(0, 12) // Limit to 12 recent items
    }
    
    console.log('✅ Users API: Profile found:', {
      handle: user.handle,
      contentCount: user.recentContent.length
    })
    
    return NextResponse.json({
      success: true,
      user
    })
    
  } catch (error) {
    console.error('❌ Users API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
