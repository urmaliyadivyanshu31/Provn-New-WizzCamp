import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') || 'overall' // overall, creators, revenue, community
    const period = searchParams.get('period') || 'all' // all, month, week
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('🏆 Leaderboards API: Fetching leaderboard', { type, period, limit })

    let leaderboard = []

    switch (type) {
      case 'creators':
        leaderboard = await getCreatorsLeaderboard(supabase, period, limit)
        break
      case 'revenue':
        leaderboard = await getRevenueLeaderboard(supabase, period, limit)
        break
      case 'community':
        leaderboard = await getCommunityLeaderboard(supabase, period, limit)
        break
      case 'achievements':
        leaderboard = await getAchievementsLeaderboard(supabase, limit)
        break
      default:
        leaderboard = await getOverallLeaderboard(supabase, period, limit)
    }

    console.log('✅ Leaderboards API: Fetched successfully', { 
      type,
      period,
      count: leaderboard.length
    })

    return NextResponse.json({
      success: true,
      leaderboard,
      type,
      period,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Leaderboards API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

async function getOverallLeaderboard(supabase: any, period: string, limit: number) {
  // Try to get data from creator_stats table first
  const { data: creatorStats } = await supabase
    .from('creator_stats')
    .select(`
      creator_address,
      total_derivatives,
      total_tips,
      total_revenue,
      achievement_points
    `)
    .order('total_derivatives', { ascending: false })
    .limit(limit)

  if (creatorStats && creatorStats.length > 0) {
    // Get profile information for each creator
    const addresses = creatorStats.map(c => c.creator_address)
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('wallet_address, handle, display_name, avatar_url, id')
      .in('wallet_address', addresses)

    const profileMap = new Map(profilesData?.map(p => [p.wallet_address.toLowerCase(), p]) || [])

    const scoredProfiles = creatorStats.map((creator) => {
      const profile = profileMap.get(creator.creator_address.toLowerCase())
      
      // Calculate overall score using derivatives and tips
      const score = (
        (creator.total_derivatives || 0) * 10 + // 10 points per derivative
        (creator.total_tips || 0) * 5 + // 5 points per tip
        (creator.achievement_points || 0) + // Achievement points
        Math.floor((creator.total_revenue || 0) / 10) // Revenue contribution
      )

      return {
        score,
        profile: profile || {
          id: creator.creator_address,
          handle: `creator${creator.creator_address.slice(0, 6)}`,
          display_name: null,
          avatar_url: null,
          wallet_address: creator.creator_address
        },
        metrics: {
          derivatives: creator.total_derivatives || 0,
          tips: creator.total_tips || 0,
          revenue: creator.total_revenue || 0,
          achievementPoints: creator.achievement_points || 0
        }
      }
    })
    
    return scoredProfiles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((profile, index) => ({
        rank: index + 1,
        user: {
          id: profile.profile.id,
          handle: profile.profile.handle,
          displayName: profile.profile.display_name,
          avatar: profile.profile.avatar_url,
          walletAddress: profile.profile.wallet_address
        },
        score: profile.score,
        metrics: profile.metrics
      }))
  }

  // Fallback to original logic if creator_stats is empty
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      handle,
      display_name,
      avatar_url,
      wallet_address,
      created_at
    `)
    .limit(limit * 2) // Get more to calculate scores

  if (!profiles) return []

  // Calculate scores for each profile
  const scoredProfiles = await Promise.all(
    profiles.map(async (profile) => {
      // Get derivatives count
      const { count: derivativesCount } = await supabase
        .from('community_derivatives')
        .select('*', { count: 'exact', head: true })
        .eq('creator_address', profile.wallet_address)

      // Get tips count (mock for now)
      const tipsCount = Math.floor(Math.random() * 50)

      // Get achievement points
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('points_earned')
        .eq('user_address', profile.wallet_address)

      const totalAchievementPoints = achievements?.reduce((sum, a) => sum + a.points_earned, 0) || 0

      // Calculate overall score using derivatives and tips
      const score = (
        (derivativesCount || 0) * 10 + // 10 points per derivative
        tipsCount * 5 + // 5 points per tip
        totalAchievementPoints + // Achievement points
        Math.floor(Math.random() * 100) // Mock engagement score
      )

      return {
        ...profile,
        score,
        metrics: {
          derivatives: derivativesCount || 0,
          tips: tipsCount,
          achievementPoints: totalAchievementPoints
        }
      }
    })
  )

  return scoredProfiles
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((profile, index) => ({
      rank: index + 1,
      user: {
        id: profile.id,
        handle: profile.handle,
        displayName: profile.display_name,
        avatar: profile.avatar_url,
        walletAddress: profile.wallet_address
      },
      score: profile.score,
      metrics: profile.metrics
    }))
}

async function getCreatorsLeaderboard(supabase: any, period: string, limit: number) {
  // Try to get data from creator_stats table first
  const { data: creatorStats } = await supabase
    .from('creator_stats')
    .select(`
      creator_address,
      total_derivatives,
      total_tips,
      total_revenue,
      achievement_points
    `)
    .order('total_derivatives', { ascending: false })
    .limit(limit)

  if (creatorStats && creatorStats.length > 0) {
    // Get profile information for each creator
    const addresses = creatorStats.map(c => c.creator_address)
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('wallet_address, handle, display_name, avatar_url, id')
      .in('wallet_address', addresses)

    const profileMap = new Map(profilesData?.map(p => [p.wallet_address.toLowerCase(), p]) || [])

    return creatorStats.map((creator, index) => {
      const profile = profileMap.get(creator.creator_address.toLowerCase())
      
      return {
        rank: index + 1,
        user: {
          id: profile?.id || creator.creator_address,
          handle: profile?.handle || `creator${creator.creator_address.slice(0, 6)}`,
          displayName: profile?.display_name,
          avatar: profile?.avatar_url,
          walletAddress: creator.creator_address
        },
        score: creator.total_derivatives,
        metrics: {
          derivatives: creator.total_derivatives || 0,
          tips: creator.total_tips || 0,
          revenue: creator.total_revenue || 0
        }
      }
    })
  }

  // Fallback to original logic if creator_stats is empty
  const { data: derivatives } = await supabase
    .from('community_derivatives')
    .select(`
      creator_address,
      created_at,
      creator_profile:profiles!community_derivatives_creator_address_fkey (
        id,
        handle,
        display_name,
        avatar_url
      )
    `)

  if (!derivatives) return []

  // Group by creator and count
  const creatorCounts = derivatives.reduce((acc, derivative) => {
    const address = derivative.creator_address
    if (!acc[address]) {
      acc[address] = {
        profile: derivative.creator_profile,
        count: 0,
        walletAddress: address,
        tips: Math.floor(Math.random() * 30) // Mock tips for now
      }
    }
    acc[address].count++
    return acc
  }, {})

  return Object.values(creatorCounts)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, limit)
    .map((creator: any, index) => ({
      rank: index + 1,
      user: {
        id: creator.profile?.id,
        handle: creator.profile?.handle || 'Unknown',
        displayName: creator.profile?.display_name,
        avatar: creator.profile?.avatar_url,
        walletAddress: creator.walletAddress
      },
      score: creator.count,
      metrics: {
        derivatives: creator.count,
        tips: creator.tips
      }
    }))
}

async function getRevenueLeaderboard(supabase: any, period: string, limit: number) {
  // Mock revenue leaderboard (in real implementation, would use actual revenue data)
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      handle,
      display_name,
      avatar_url,
      wallet_address
    `)
    .limit(limit * 2)

  if (!profiles) return []

  return profiles
    .map((profile) => ({
      ...profile,
      revenue: Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 500)
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((profile, index) => ({
      rank: index + 1,
      user: {
        id: profile.id,
        handle: profile.handle,
        displayName: profile.display_name,
        avatar: profile.avatar_url,
        walletAddress: profile.wallet_address
      },
      score: profile.revenue,
      metrics: {
        revenue: profile.revenue
      }
    }))
}

async function getCommunityLeaderboard(supabase: any, period: string, limit: number) {
  // Get communities ranked by member count
  const { data: communities } = await supabase
    .from('communities')
    .select(`
      id,
      name,
      member_count,
      derivative_count,
      tier,
      creator_address,
      creator_profile:profiles!communities_creator_address_fkey (
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .order('member_count', { ascending: false })
    .limit(limit)

  if (!communities) return []

  return communities.map((community, index) => ({
    rank: index + 1,
    community: {
      id: community.id,
      name: community.name,
      tier: community.tier,
      memberCount: community.member_count,
      derivativeCount: community.derivative_count
    },
    user: {
      id: community.creator_profile?.id,
      handle: community.creator_profile?.handle || 'Unknown',
      displayName: community.creator_profile?.display_name,
      avatar: community.creator_profile?.avatar_url,
      walletAddress: community.creator_address
    },
    score: community.member_count,
    metrics: {
      members: community.member_count,
      derivatives: community.derivative_count
    }
  }))
}

async function getAchievementsLeaderboard(supabase: any, limit: number) {
  // Get users ranked by achievement points
  const { data: achievements } = await supabase
    .from('user_achievements')
    .select(`
      user_address,
      points_earned,
      user_profile:profiles!user_achievements_user_address_fkey (
        id,
        handle,
        display_name,
        avatar_url
      )
    `)

  if (!achievements) return []

  // Group by user and sum points
  const userPoints = achievements.reduce((acc, achievement) => {
    const address = achievement.user_address
    if (!acc[address]) {
      acc[address] = {
        profile: achievement.user_profile,
        points: 0,
        achievementCount: 0,
        walletAddress: address
      }
    }
    acc[address].points += achievement.points_earned
    acc[address].achievementCount++
    return acc
  }, {})

  return Object.values(userPoints)
    .sort((a: any, b: any) => b.points - a.points)
    .slice(0, limit)
    .map((user: any, index) => ({
      rank: index + 1,
      user: {
        id: user.profile?.id,
        handle: user.profile?.handle || 'Unknown',
        displayName: user.profile?.display_name,
        avatar: user.profile?.avatar_url,
        walletAddress: user.walletAddress
      },
      score: user.points,
      metrics: {
        achievementPoints: user.points,
        achievements: user.achievementCount
      }
    }))
}