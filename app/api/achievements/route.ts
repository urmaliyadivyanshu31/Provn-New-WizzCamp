import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

interface AchievementCriteria {
  derivatives_created?: number
  licenses_sold?: number
  community_members?: number
  total_revenue?: number
  tips_received?: number
  communities_joined?: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'creator' | 'community' | 'social' | 'revenue'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  criteria: AchievementCriteria
  points: number
}

const ACHIEVEMENTS: Achievement[] = [
  // Creator Achievements
  {
    id: 'first_derivative',
    name: 'First Steps',
    description: 'Create your first derivative',
    icon: '🎬',
    category: 'creator',
    rarity: 'common',
    criteria: { derivatives_created: 1 },
    points: 10
  },
  {
    id: 'prolific_creator',
    name: 'Prolific Creator',
    description: 'Create 10 derivatives',
    icon: '🎭',
    category: 'creator',
    rarity: 'rare',
    criteria: { derivatives_created: 10 },
    points: 50
  },
  {
    id: 'master_creator',
    name: 'Master Creator',
    description: 'Create 50 derivatives',
    icon: '🎨',
    category: 'creator',
    rarity: 'epic',
    criteria: { derivatives_created: 50 },
    points: 200
  },
  {
    id: 'legendary_creator',
    name: 'Legendary Creator',
    description: 'Create 100 derivatives',
    icon: '👑',
    category: 'creator',
    rarity: 'legendary',
    criteria: { derivatives_created: 100 },
    points: 500
  },

  // Revenue Achievements  
  {
    id: 'first_sale',
    name: 'First Sale',
    description: 'Sell your first license',
    icon: '💰',
    category: 'revenue',
    rarity: 'common',
    criteria: { licenses_sold: 1 },
    points: 15
  },
  {
    id: 'big_earner',
    name: 'Big Earner',
    description: 'Earn $100 in total revenue',
    icon: '💎',
    category: 'revenue',
    rarity: 'rare',
    criteria: { total_revenue: 100 },
    points: 75
  },
  {
    id: 'revenue_king',
    name: 'Revenue King',
    description: 'Earn $1000 in total revenue',
    icon: '🏆',
    category: 'revenue',
    rarity: 'epic',
    criteria: { total_revenue: 1000 },
    points: 250
  },

  // Community Achievements
  {
    id: 'community_founder',
    name: 'Community Founder',
    description: 'Create your first community',
    icon: '🏗️',
    category: 'community',
    rarity: 'rare',
    criteria: { community_members: 1 }, // Tracks if they have a community
    points: 100
  },
  {
    id: 'community_builder',
    name: 'Community Builder',
    description: 'Grow your community to 50 members',
    icon: '🏘️',
    category: 'community',
    rarity: 'epic',
    criteria: { community_members: 50 },
    points: 200
  },
  {
    id: 'community_leader',
    name: 'Community Leader',
    description: 'Grow your community to 100 members',
    icon: '🏙️',
    category: 'community',
    rarity: 'legendary',
    criteria: { community_members: 100 },
    points: 400
  },

  // Social Achievements
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Join 5 communities',
    icon: '🦋',
    category: 'social',
    rarity: 'common',
    criteria: { communities_joined: 5 },
    points: 25
  },
  {
    id: 'generous_tipper',
    name: 'Generous Tipper',
    description: 'Receive 25 tips',
    icon: '🎁',
    category: 'social',
    rarity: 'rare',
    criteria: { tips_received: 25 },
    points: 60
  },
  {
    id: 'beloved_creator',
    name: 'Beloved Creator',
    description: 'Receive 100 tips',
    icon: '❤️',
    category: 'social',
    rarity: 'epic',
    criteria: { tips_received: 100 },
    points: 150
  }
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const userAddress = searchParams.get('user')
    const category = searchParams.get('category')

    console.log('🏆 Achievements API: Fetching achievements', { userAddress, category })

    // Get user's current stats if user address provided
    let userStats = null
    let userAchievements = []

    if (userAddress) {
      // Fetch user's achievement stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', userAddress.toLowerCase())
        .single()

      if (profile) {
        // Get user's creation stats
        const { data: derivatives } = await supabase
          .from('community_derivatives')
          .select('id')
          .eq('creator_address', userAddress.toLowerCase())

        // Get user's community stats (if they own a community)
        const { data: ownedCommunities } = await supabase
          .from('communities')
          .select('member_count')
          .eq('creator_address', userAddress.toLowerCase())

        // Get user's membership count
        const { data: memberships } = await supabase
          .from('community_members')
          .select('id')
          .eq('member_address', userAddress.toLowerCase())

        // Get user's existing achievements
        const { data: achievements } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_address', userAddress.toLowerCase())

        // Get real licensing revenue data
        const { data: licenses } = await supabase
          .from('licensing_transactions')
          .select('price_paid')
          .eq('licensee_address', userAddress.toLowerCase())

        // Get real tips data
        const { data: tips } = await supabase
          .from('tips')
          .select('amount')
          .eq('to_address', userAddress.toLowerCase())

        // Calculate real stats
        const totalRevenue = licenses?.reduce((sum, license) => sum + parseFloat(license.price_paid), 0) || 0
        const totalTips = tips?.length || 0

        userStats = {
          derivatives_created: derivatives?.length || 0,
          licenses_sold: licenses?.length || 0,
          total_revenue: totalRevenue,
          tips_received: totalTips,
          community_members: ownedCommunities?.[0]?.member_count || 0,
          communities_joined: memberships?.length || 0
        }

        userAchievements = achievements || []
      }
    }

    // Filter achievements by category if specified
    let filteredAchievements = ACHIEVEMENTS
    if (category && ['creator', 'community', 'social', 'revenue'].includes(category)) {
      filteredAchievements = ACHIEVEMENTS.filter(achievement => achievement.category === category)
    }

    // Add progress and unlock status to achievements
    const achievementsWithProgress = filteredAchievements.map(achievement => {
      const isUnlocked = userAchievements.some(ua => ua.achievement_id === achievement.id)
      let progress = 0

      if (userStats) {
        // Calculate progress based on criteria
        const criteriaKeys = Object.keys(achievement.criteria)
        if (criteriaKeys.length > 0) {
          const criteriaKey = criteriaKeys[0] as keyof AchievementCriteria
          const required = achievement.criteria[criteriaKey] || 0
          const current = userStats[criteriaKey] || 0
          progress = Math.min((current / required) * 100, 100)
        }
      }

      return {
        ...achievement,
        isUnlocked,
        progress: Math.round(progress),
        unlockedAt: userAchievements.find(ua => ua.achievement_id === achievement.id)?.unlocked_at || null
      }
    })

    console.log('✅ Achievements API: Fetched successfully', { 
      totalAchievements: achievementsWithProgress.length,
      unlockedCount: achievementsWithProgress.filter(a => a.isUnlocked).length
    })

    return NextResponse.json({
      success: true,
      achievements: achievementsWithProgress,
      userStats,
      totalPoints: userAchievements.reduce((sum, ua) => {
        const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievement_id)
        return sum + (achievement?.points || 0)
      }, 0)
    })

  } catch (error) {
    console.error('❌ Achievements API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { userAddress, achievementId, triggerEvent } = body

    if (!userAddress || !achievementId) {
      return NextResponse.json(
        { success: false, error: 'User address and achievement ID are required' },
        { status: 400 }
      )
    }

    console.log('🏆 Achievements API: Unlocking achievement', { userAddress, achievementId, triggerEvent })

    // Check if achievement is valid
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (!achievement) {
      return NextResponse.json(
        { success: false, error: 'Invalid achievement ID' },
        { status: 400 }
      )
    }

    // Check if user already has this achievement
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_address', userAddress.toLowerCase())
      .eq('achievement_id', achievementId)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Achievement already unlocked' },
        { status: 400 }
      )
    }

    // Create achievement record
    const { data: newAchievement, error } = await supabase
      .from('user_achievements')
      .insert([{
        user_address: userAddress.toLowerCase(),
        achievement_id: achievementId,
        points_earned: achievement.points,
        trigger_event: triggerEvent || 'manual',
        unlocked_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Achievements API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to unlock achievement' },
        { status: 500 }
      )
    }

    console.log('✅ Achievements API: Achievement unlocked successfully', { 
      achievementId,
      points: achievement.points
    })

    return NextResponse.json({
      success: true,
      achievement: {
        ...achievement,
        isUnlocked: true,
        unlockedAt: newAchievement.unlocked_at
      },
      pointsEarned: achievement.points,
      message: `Achievement unlocked: ${achievement.name}!`
    })

  } catch (error) {
    console.error('❌ Achievements API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unlock achievement' },
      { status: 500 }
    )
  }
}