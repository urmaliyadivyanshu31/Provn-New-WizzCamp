import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    
    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: 'Token ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Video API: Fetching video for token ID:', tokenId)

    // Try to get video from platform_videos table
    const platformVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    
    if (platformVideo) {
      console.log('✅ Video API: Found platform video:', platformVideo.id)
      
      const videoData = {
        id: `platform_${platformVideo.id}`,
        type: 'platform' as const,
        tokenId: platformVideo.token_id,
        title: platformVideo.title,
        description: platformVideo.description || 'No description available',
        videoUrl: platformVideo.video_url,
        thumbnailUrl: platformVideo.thumbnail_url,
        creator: {
          wallet: platformVideo.creator_wallet,
          handle: platformVideo.creator?.handle
        },
        blockchain: {
          transactionHash: platformVideo.transaction_hash,
          contractAddress: platformVideo.contract_address
        },
        stats: {
          views: platformVideo.views_count || 0,
          likes: platformVideo.likes_count || 0,
          tips: platformVideo.tips_count || 0
        },
        metadata: {
          createdAt: platformVideo.uploaded_at,
          publishedAt: platformVideo.published_at,
          visibility: platformVideo.visibility,
          status: platformVideo.moderation_status
        }
      }

      return NextResponse.json({
        success: true,
        video: videoData
      })
    }

    // If not found in platform, return not found
    console.log('❌ Video API: Video not found for token ID:', tokenId)
    return NextResponse.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('❌ Video API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch video' 
      },
      { status: 500 }
    )
  }
}