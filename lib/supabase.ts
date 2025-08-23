import { createClient } from '@/utils/supabase/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client-side Supabase client (for reading data)
export const supabase = createClient()

// Server-side Supabase admin client (for writing data)
// This will be used in API routes where we need admin privileges
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔍 Supabase Admin Client Config:', {
    hasUrl: !!supabaseUrl,
    urlSuffix: supabaseUrl?.slice(-10),
    hasServiceKey: !!serviceRoleKey,
    serviceKeyPrefix: serviceRoleKey?.slice(0, 20) + '...',
    environment: process.env.NODE_ENV
  })
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!serviceRoleKey
    })
    throw new Error('Missing required Supabase environment variables')
  }
  
  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
    { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      }
    }
  )
}

// Database types for profiles
export interface Profile {
  id: string
  wallet_address: string
  handle: string
  display_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface CreateProfileData {
  handle: string
  display_name?: string
  bio?: string
  avatar_url?: string
}

// Community-related types
export type CommunityTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type LicenseType = 'BASIC' | 'COMMERCIAL' | 'FULL_RIGHTS'

export interface Community {
  id: string
  contract_community_id: number
  creator_token_id: number
  creator_address: string
  name: string
  description?: string
  tier: CommunityTier
  member_count: number
  derivative_count: number
  featured_derivative_id?: number
  created_at: string
  updated_at: string
  active: boolean
}

export interface CommunityMember {
  id: string
  community_id: string
  member_address: string
  joined_at: string
  role: 'member' | 'moderator' | 'admin'
  contribution_score: number
  last_active_at: string
}

export interface CommunityDerivative {
  id: string
  community_id: string
  derivative_token_id: number
  creator_address: string
  added_at: string
  featured: boolean
  likes_count: number
  views_count: number
  title?: string
  description?: string
  thumbnail_url?: string
  video_url?: string
}

export interface LicenseTransaction {
  id: string
  token_id: number
  licensee_address: string
  license_type: LicenseType
  price_paid: string
  periods: number
  duration_seconds: number
  expires_at: string
  transaction_hash?: string
  block_number?: number
  created_at: string
  renewed_from_transaction_id?: string
}

export interface MonthlyTopCreator {
  id: string
  month: number
  year: number
  creator_address: string
  rank: 1 | 2
  total_revenue: string
  licenses_sold: number
  derivatives_created: number
  community_created: boolean
}

export interface CreatorStats {
  id: string
  creator_address: string
  total_revenue: string
  total_licenses_sold: number
  total_derivatives_created: number
  active_communities: number
  total_community_members: number
  highest_tier_achieved: CommunityTier
  last_updated: string
}

export interface CommunityInteraction {
  id: string
  community_id: string
  user_address: string
  interaction_type: 'like' | 'comment' | 'share' | 'collaboration_request' | 'derivative_submission'
  target_derivative_id?: number
  created_at: string
  metadata: Record<string, any>
}

export type AchievementType = 
  | 'early_adopter' 
  | 'top_contributor' 
  | 'collaboration_master' 
  | 'license_champion'
  | 'community_creator' 
  | 'derivative_master' 
  | 'social_butterfly' 
  | 'revenue_king'

export interface UserAchievement {
  id: string
  user_address: string
  achievement_type: AchievementType
  earned_at: string
  community_id?: string
  metadata: Record<string, any>
}

// Extended community data with related information
export interface CommunityWithDetails extends Community {
  creator_profile?: Profile
  recent_derivatives?: CommunityDerivative[]
  member_profiles?: Profile[]
  is_member?: boolean
  user_role?: string
}
