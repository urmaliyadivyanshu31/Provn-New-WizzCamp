import { createClient } from '@supabase/supabase-js'

// Use service role for admin operations (video creation, updates)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Admin client for write operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Public client for read operations  
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface PlatformVideo {
  id: string
  creator_id: string
  creator_wallet: string
  token_id: string
  transaction_hash: string
  contract_address: string
  block_number?: number
  mint_timestamp?: string
  metadata_uri?: string
  title: string
  description?: string
  tags: string[]
  video_url: string
  fast_video_url?: string
  thumbnail_url?: string
  duration?: number
  file_size?: number
  video_quality?: string
  aspect_ratio: string
  category?: string
  language: string
  age_rating: string
  upload_status: 'processing' | 'ready' | 'failed' | 'removed'
  moderation_status: 'pending' | 'approved' | 'rejected' | 'under_review'
  visibility: 'public' | 'unlisted' | 'private'
  price_per_period?: number
  license_duration?: number
  royalty_percentage?: number
  payment_token_address?: string
  commercial_rights: boolean
  derivative_rights: boolean
  // Remixing fields
  remixing_enabled: boolean
  remixing_permission_level: 'none' | 'basic' | 'advanced' | 'custom'
  remixing_template?: string
  remixing_requires_attribution: boolean
  remixing_allow_commercial: boolean
  remixing_allow_derivatives: boolean
  remixing_custom_settings?: any
  remixing_message?: string
  remixes_count: number
  views_count: number
  likes_count: number
  shares_count: number
  comments_count: number
  tips_count: number
  tips_total_amount: number
  downloads_count: number
  licenses_sold: number
  total_revenue: number
  uploaded_at: string
  published_at?: string
  updated_at: string
}

export interface VideoWithCreator extends PlatformVideo {
  creator: {
    id: string
    wallet_address: string
    handle: string
    display_name?: string
    avatar_url?: string
  }
}

export interface VideoMetrics {
  views: number
  likes: number
  shares: number
  tips: number
  total_tips_amount: number
}

export class PlatformVideoService {
  /**
   * Check if a wallet has a platform profile (required for video uploads)
   */
  static async hasProfile(walletAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking profile:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error checking profile:', error)
      return false
    }
  }

  /**
   * Get profile by wallet address
   */
  static async getProfile(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  /**
   * Create a new platform video record when IP-NFT is minted
   */
  static async createPlatformVideo(videoData: {
    creatorWallet: string
    tokenId: string
    transactionHash: string
    contractAddress: string
    blockNumber?: number
    mintTimestamp?: string
    metadataUri?: string
    title: string
    description?: string
    tags: string[]
    videoUrl: string
    thumbnailUrl?: string
    duration?: number
    category?: string
    pricePerPeriod?: number
    licenseDuration?: number
    royaltyPercentage?: number
    paymentTokenAddress?: string
    commercialRights?: boolean
    derivativeRights?: boolean
    // Derivative tracking
    parentTokenId?: string
    isDerivative?: boolean
    // Remixing parameters
    remixingEnabled?: boolean
    remixingPermissionLevel?: 'none' | 'basic' | 'advanced' | 'custom'
    remixingTemplate?: string
    remixingRequiresAttribution?: boolean
    remixingAllowCommercial?: boolean
    remixingAllowDerivatives?: boolean
    remixingCustomSettings?: any
    remixingMessage?: string
  }) {
    try {
      // First, get the creator's profile
      const profile = await this.getProfile(videoData.creatorWallet)
      if (!profile) {
        throw new Error('Creator profile not found. Profile required for video uploads.')
      }

      // Create minimal video record with only essential columns
      const videoRecord: any = {
        creator_id: profile.id,
        creator_wallet: videoData.creatorWallet.toLowerCase(),
        token_id: videoData.tokenId,
        transaction_hash: videoData.transactionHash,
        contract_address: videoData.contractAddress,
        title: videoData.title,
        description: videoData.description || 'No description provided',
        tags: videoData.tags,
        video_url: videoData.videoUrl,
        thumbnail_url: videoData.thumbnailUrl
      }
      
      // Add optional fields only if they exist in the schema
      if (videoData.blockNumber) videoRecord.block_number = videoData.blockNumber
      if (videoData.mintTimestamp) videoRecord.mint_timestamp = videoData.mintTimestamp
      if (videoData.metadataUri) videoRecord.metadata_uri = videoData.metadataUri
      if (videoData.duration) videoRecord.duration = videoData.duration
      if (videoData.category) videoRecord.category = videoData.category

      // Add derivative tracking fields
      if (videoData.parentTokenId) videoRecord.parent_token_id = videoData.parentTokenId
      if (videoData.isDerivative !== undefined) videoRecord.is_derivative = videoData.isDerivative
      
      const { data, error } = await supabaseAdmin
        .from('platform_videos')
        .insert([videoRecord])
        .select('*')
        .single()

      if (error) {
        console.error('❌ Error creating platform video:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        throw error
      }

      // Update creator's updated_at timestamp
      await supabaseAdmin
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      console.log('✅ Platform video created successfully:', data.id)
      return data
    } catch (error) {
      console.error('❌ Failed to create platform video:', error)
      throw error
    }
  }

  /**
   * Get platform video feed with advanced filtering
   */
  static async getPlatformVideoFeed(options: {
    limit?: number
    offset?: number
    category?: string
    creatorWallet?: string
    tags?: string[]
    sortBy?: 'latest' | 'popular' | 'trending'
    includePending?: boolean
  } = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        category,
        creatorWallet,
        tags,
        sortBy = 'latest',
        includePending = false
      } = options

      let query = supabaseAdmin
        .from('platform_videos')
        .select(`
          *,
          creator:profiles!platform_videos_creator_id_fkey (
            id,
            wallet_address,
            handle,
            display_name,
            avatar_url
          )
        `)
        .eq('visibility', 'public')
        .eq('upload_status', 'ready')
        .not('published_at', 'is', null)

      // Apply moderation status filter based on includePending flag
      if (includePending) {
        query = query.in('moderation_status', ['approved', 'pending'])
      } else {
        query = query.eq('moderation_status', 'approved')
      }

      // Apply filters
      if (category) {
        query = query.eq('category', category)
      }

      if (creatorWallet) {
        query = query.eq('creator_wallet', creatorWallet.toLowerCase())
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags)
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('views_count', { ascending: false })
          break
        case 'trending':
          // Trending = high engagement in last 7 days
          // For now, we'll use a combination of recent likes and views
          query = query.order('likes_count', { ascending: false })
          break
        case 'latest':
        default:
          query = query.order('published_at', { ascending: false })
          break
      }

      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching platform video feed:', error)
        throw error
      }

      const hasMore = data.length === limit

      return {
        videos: data as VideoWithCreator[],
        hasMore,
        total: data.length
      }
    } catch (error) {
      console.error('❌ Failed to fetch platform video feed:', error)
      throw error
    }
  }

  /**
   * Get videos by creator
   */
  static async getVideosByCreator(creatorWallet: string, options: {
    limit?: number
    offset?: number
    includePrivate?: boolean
  } = {}) {
    try {
      const { limit = 20, offset = 0, includePrivate = false } = options

      console.log('🎥 getVideosByCreator: Fetching videos for wallet:', creatorWallet.toLowerCase())

      // First, get basic video data without complex joins
      let query = supabaseAdmin
        .from('platform_videos')
        .select('*')
        .eq('creator_wallet', creatorWallet.toLowerCase())

      // Only filter by columns that definitely exist
      // Remove upload_status and moderation_status filters if they don't exist
      // query = query.eq('upload_status', 'ready')

      // if (!includePrivate) {
      //   query = query.eq('visibility', 'public')
      //   query = query.in('moderation_status', ['approved', 'pending'])
      // }

      // Order by a column that should exist
      query = query.order('id', { ascending: false })
      
      if (limit > 0) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      console.log('🎥 getVideosByCreator: Query result:', {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      })

      if (error) {
        console.error('❌ Error fetching creator videos:', error)
        throw error
      }

      // Get creator profile separately to avoid complex joins
      const profile = await this.getProfile(creatorWallet)
      
      // Transform data to include creator info
      const videosWithCreator = (data || []).map(video => ({
        ...video,
        creator: profile ? {
          id: profile.id,
          wallet_address: profile.wallet_address,
          handle: profile.handle,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url
        } : null
      }))

      return {
        videos: videosWithCreator,
        hasMore: videosWithCreator.length === limit
      }
    } catch (error) {
      console.error('❌ Failed to fetch creator videos:', error)
      return {
        videos: [],
        hasMore: false
      }
    }
  }

  /**
   * Record a video view
   */
  static async recordView(videoId: string, viewerData: {
    viewerWallet?: string
    ipAddress?: string
    userAgent?: string
    referrer?: string
    watchDuration?: number
    watchPercentage?: number
    deviceType?: string
    country?: string
    city?: string
  }) {
    try {
      let viewerProfileId = null

      // Get viewer profile if wallet provided
      if (viewerData.viewerWallet) {
        const profile = await this.getProfile(viewerData.viewerWallet)
        viewerProfileId = profile?.id
      }

      const { error } = await supabaseAdmin
        .from('video_views')
        .insert([{
          video_id: videoId,
          viewer_wallet: viewerData.viewerWallet?.toLowerCase(),
          viewer_profile_id: viewerProfileId,
          ip_address: viewerData.ipAddress,
          user_agent: viewerData.userAgent,
          referrer: viewerData.referrer,
          watch_duration: viewerData.watchDuration,
          watch_percentage: viewerData.watchPercentage,
          device_type: viewerData.deviceType,
          country: viewerData.country,
          city: viewerData.city
        }])

      if (error) {
        console.error('Error recording view:', error)
        // Don't throw - views are not critical
      }
    } catch (error) {
      console.error('❌ Failed to record view:', error)
      // Don't throw - views are not critical
    }
  }

  /**
   * Toggle like on a video
   */
  static async toggleLike(videoId: string, userWallet: string) {
    try {
      const profile = await this.getProfile(userWallet)
      if (!profile) {
        throw new Error('Profile required to like videos')
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', profile.id)
        .single()

      if (existingLike) {
        // Unlike
        const { error } = await supabaseAdmin
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', profile.id)

        if (error) throw error
        return { liked: false }
      } else {
        // Like
        const { error } = await supabaseAdmin
          .from('video_likes')
          .insert([{
            video_id: videoId,
            user_id: profile.id
          }])

        if (error) throw error
        return { liked: true }
      }
    } catch (error) {
      console.error('❌ Failed to toggle like:', error)
      throw error
    }
  }

  /**
   * Record a share
   */
  static async recordShare(videoId: string, platform: string, sharerWallet?: string) {
    try {
      let sharerProfileId = null

      if (sharerWallet) {
        const profile = await this.getProfile(sharerWallet)
        sharerProfileId = profile?.id
      }

      const { error } = await supabaseAdmin
        .from('video_shares')
        .insert([{
          video_id: videoId,
          sharer_id: sharerProfileId,
          platform
        }])

      if (error) {
        console.error('Error recording share:', error)
        // Don't throw - shares are not critical
      }
    } catch (error) {
      console.error('❌ Failed to record share:', error)
      // Don't throw - shares are not critical
    }
  }

  /**
   * Get video by token ID
   */
  static async getVideoByTokenId(tokenId: string): Promise<VideoWithCreator | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('platform_videos')
        .select(`
          *,
          creator:profiles!platform_videos_creator_id_fkey (
            id,
            wallet_address,
            handle,
            display_name,
            avatar_url
          )
        `)
        .eq('token_id', tokenId)
        .single()

      if (error) {
        console.error('Error fetching video by token ID:', error)
        return null
      }

      return data as VideoWithCreator
    } catch (error) {
      console.error('❌ Failed to fetch video by token ID:', error)
      return null
    }
  }

  /**
   * Check if user has liked a video
   */
  static async hasUserLikedVideo(videoId: string, userWallet: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userWallet)
      if (!profile) return false

      const { data, error } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', profile.id)
        .single()

      return !!data && !error
    } catch (error) {
      console.error('❌ Failed to check if user liked video:', error)
      return false
    }
  }

  /**
   * Get video categories
   */
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('video_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error)
      return []
    }
  }

  /**
   * Search videos
   */
  static async searchVideos(query: string, options: {
    limit?: number
    offset?: number
    category?: string
  } = {}) {
    try {
      const { limit = 20, offset = 0, category } = options

      let supabaseQuery = supabaseAdmin
        .from('platform_videos')
        .select(`
          *,
          creator:profiles!platform_videos_creator_id_fkey (
            id,
            wallet_address,
            handle,
            display_name,
            avatar_url
          )
        `)
        .eq('visibility', 'public')
        .eq('moderation_status', 'approved')
        .eq('upload_status', 'ready')
        .textSearch('search_vector', query)

      if (category) {
        supabaseQuery = supabaseQuery.eq('category', category)
      }

      supabaseQuery = supabaseQuery
        .order('views_count', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error } = await supabaseQuery

      if (error) {
        console.error('Error searching videos:', error)
        return { videos: [], hasMore: false }
      }

      return {
        videos: data as VideoWithCreator[],
        hasMore: data.length === limit
      }
    } catch (error) {
      console.error('❌ Failed to search videos:', error)
      return { videos: [], hasMore: false }
    }
  }
}