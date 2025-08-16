import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let step = 'initialization'
  
  try {
    console.log('🔄 Video Sync API: Starting post-mint video sync...')
    
    step = 'parsing_request_body'
    const body = await request.json()
    const { 
      tokenId, 
      transactionHash, 
      creatorWallet, 
      title, 
      description, 
      tags, 
      videoUrl, 
      thumbnailUrl,
      metadataUri,
      license,
      blockNumber,
      mintTimestamp
    } = body

    console.log('📋 Video Sync API: Received data:', {
      tokenId,
      transactionHash,
      creatorWallet: creatorWallet?.toLowerCase(),
      title: title?.substring(0, 50) + (title?.length > 50 ? '...' : ''),
      description: description?.substring(0, 100) + (description?.length > 100 ? '...' : ''),
      videoUrl: videoUrl?.substring(0, 50) + (videoUrl?.length > 50 ? '...' : ''),
      thumbnailUrl: thumbnailUrl?.substring(0, 50) + (thumbnailUrl?.length > 50 ? '...' : ''),
      metadataUri: metadataUri?.substring(0, 50) + (metadataUri?.length > 50 ? '...' : ''),
      hasLicense: !!license,
      tagsCount: Array.isArray(tags) ? tags.length : (tags ? 1 : 0),
      blockNumber,
      mintTimestamp
    })

    // Validate required fields
    step = 'validating_required_fields'
    const missingFields = []
    if (!tokenId) missingFields.push('tokenId')
    if (!creatorWallet) missingFields.push('creatorWallet')
    if (!title) missingFields.push('title')
    if (!videoUrl) missingFields.push('videoUrl')
    
    if (missingFields.length > 0) {
      console.error('❌ Video Sync API: Missing required fields:', missingFields)
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          step,
          receivedFields: Object.keys(body)
        },
        { status: 400 }
      )
    }

    // Normalize wallet address
    const normalizedWallet = creatorWallet.toLowerCase()
    console.log('🔍 Video Sync API: Normalized wallet address:', normalizedWallet)

    // Check if creator has a platform profile
    step = 'checking_profile_exists'
    console.log('🔍 Video Sync API: Checking if profile exists for wallet:', normalizedWallet)
    const hasProfile = await PlatformVideoService.hasProfile(normalizedWallet)
    
    console.log('🔍 Video Sync API: Profile check result:', { hasProfile, wallet: normalizedWallet })
    
    if (!hasProfile) {
      console.warn('⚠️ Video Sync API: Creator has no platform profile')
      console.warn('⚠️ Video Sync API: This means the user needs to create a profile first')
      console.warn('⚠️ Video Sync API: Skipping platform sync but video was minted successfully')
      return NextResponse.json({
        success: true,
        message: 'Video minted successfully but not synced to platform (no profile found)',
        synced: false,
        step,
        action_required: 'User must create a platform profile to sync videos',
        wallet_checked: normalizedWallet
      })
    }

    // Check if video already exists to avoid duplicates
    step = 'checking_duplicate_video'
    console.log('🔍 Video Sync API: Checking for existing video with token ID:', tokenId)
    const existingVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    
    console.log('🔍 Video Sync API: Existing video check result:', { existingVideo: !!existingVideo })
    
    if (existingVideo) {
      console.log('ℹ️ Video Sync API: Video already exists in platform, skipping creation')
      console.log('ℹ️ Video Sync API: Existing video details:', {
        id: existingVideo.id,
        title: existingVideo.title,
        creator: existingVideo.creator_wallet
      })
      return NextResponse.json({
        success: true,
        message: 'Video already synced to platform',
        synced: true,
        video: existingVideo,
        step
      })
    }

    // Create platform video record
    step = 'creating_platform_video'
    console.log('🏢 Video Sync API: Creating platform video record...')
    console.log('🏢 Video Sync API: Video data to create:', {
      creatorWallet: normalizedWallet,
      tokenId,
      transactionHash: transactionHash || 'unknown',
      title,
      description: description || 'No description provided',
      tagsCount: Array.isArray(tags) ? tags.length : (tags ? 1 : 0)
    })
    
    const platformVideo = await PlatformVideoService.createPlatformVideo({
      creatorWallet: normalizedWallet,
      tokenId,
      transactionHash: transactionHash || 'unknown',
      contractAddress: '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1',
      blockNumber,
      mintTimestamp,
      metadataUri,
      title,
      description: description || 'No description provided',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
      videoUrl,
      thumbnailUrl,
      pricePerPeriod: license?.price ? parseFloat(license.price) : undefined,
      licenseDuration: license?.duration ? parseInt(license.duration) : undefined,
      royaltyPercentage: license?.royalty ? parseInt(license.royalty) : undefined,
      paymentTokenAddress: license?.paymentToken,
      commercialRights: true,
      derivativeRights: false
    })

    const duration = Date.now() - startTime
    console.log('✅ Video Sync API: Platform video created successfully!')
    console.log('✅ Video Sync API: Created video details:', {
      id: platformVideo.id,
      title: platformVideo.title,
      creator: platformVideo.creator_wallet,
      tokenId: platformVideo.token_id,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      success: true,
      message: 'Video successfully synced to platform',
      synced: true,
      video: platformVideo,
      step,
      duration: `${duration}ms`
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Video Sync API: Error at step:', step)
    console.error('❌ Video Sync API: Error details:', error)
    console.error('❌ Video Sync API: Error occurred after:', `${duration}ms`)
    
    if (error instanceof Error) {
      console.error('❌ Video Sync API: Error message:', error.message)
      console.error('❌ Video Sync API: Error stack:', error.stack)
    }
    
    // Don't fail the response if sync fails - the video was still minted successfully
    return NextResponse.json({
      success: true,
      message: 'Video minted successfully but platform sync failed',
      synced: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
      step,
      duration: `${duration}ms`,
      action_required: 'Check console logs and try manual sync'
    }, { status: 200 }) // Still return 200 since minting succeeded
  }
}