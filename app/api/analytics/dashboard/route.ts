import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from header
    const walletAddress = request.headers.get('X-Wallet-Address')
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d' // 7d, 30d, 90d, 1y, all

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date | null = null
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = null
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get user videos and stats for dashboard
    const userVideos = await getUserVideos(walletAddress)
    const userStats = await getUserStats(walletAddress, startDate)
    
    // Recent activity
    const recentActivity = await getRecentActivity(walletAddress, 10)
    
    // Revenue analytics
    const revenueAnalytics = await getRevenueAnalytics(walletAddress, startDate)

    const dashboard = {
      timeframe,
      stats: {
        totalVideos: userVideos.length,
        totalViews: userStats.totalViews,
        totalEarnings: revenueAnalytics.totalRevenue,
        totalTips: userStats.tips.count,
        totalLicenses: userStats.licenses.count,
        monthlyGrowth: {
          videos: userStats.monthlyGrowthVideos,
          views: userStats.monthlyGrowthViews,
          earnings: userStats.monthlyGrowthEarnings
        }
      },
      videos: userVideos,
      recentActivity,
      revenueAnalytics,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch dashboard data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

async function getPlatformStats(startDate: Date | null) {
  const dateFilter = startDate ? `WHERE created_at >= $1` : ''
  const params = startDate ? [startDate] : []

  const [totalVideos, totalUsers, totalTips, totalLicenses] = await Promise.all([
    db.query(`SELECT COUNT(*) as count FROM videos ${dateFilter}`, params),
    db.query(`SELECT COUNT(*) as count FROM users ${dateFilter}`, params),
    db.query(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM tips ${dateFilter}`, params),
    db.query(`SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as total FROM licenses ${dateFilter}`, params)
  ])

  return {
    totalVideos: parseInt(totalVideos.rows[0].count),
    totalUsers: parseInt(totalUsers.rows[0].count),
    totalTips: {
      count: parseInt(totalTips.rows[0].count),
      amount: parseFloat(totalTips.rows[0].total)
    },
    totalLicenses: {
      count: parseInt(totalLicenses.rows[0].count),
      amount: parseFloat(totalLicenses.rows[0].total)
    }
  }
}

async function getUserVideos(userAddress: string) {
  const result = await db.query(`
    SELECT 
      v.token_id,
      v.title,
      v.description,
      v.ipfs_hash,
      v.transaction_hash,
      v.created_at,
      v.status,
      v.allow_remixing,
      COALESCE(vs.views, 0) as views,
      COALESCE(vs.tips_count, 0) as tips,
      COALESCE(vs.licenses_count, 0) as licenses,
      COALESCE(vs.total_earnings, 0) as earnings,
      ARRAY_AGG(vt.tag) FILTER (WHERE vt.tag IS NOT NULL) as tags
    FROM videos v
    LEFT JOIN video_stats vs ON v.id = vs.video_id
    LEFT JOIN video_tags vt ON v.id = vt.video_id
    WHERE v.creator_address = $1
    GROUP BY v.id, v.token_id, v.title, v.description, v.ipfs_hash, v.transaction_hash, 
             v.created_at, v.status, v.allow_remixing, vs.views, vs.tips_count, 
             vs.licenses_count, vs.total_earnings
    ORDER BY v.created_at DESC
  `, [userAddress.toLowerCase()])

  return result.rows.map(row => ({
    tokenId: row.token_id,
    title: row.title,
    description: row.description,
    ipfsHash: row.ipfs_hash,
    transactionHash: row.transaction_hash,
    createdAt: row.created_at,
    status: row.status,
    allowRemixing: row.allow_remixing,
    views: parseInt(row.views || 0),
    tips: parseInt(row.tips || 0),
    licenses: parseInt(row.licenses || 0),
    earnings: parseFloat(row.earnings || 0),
    tags: row.tags || []
  }))
}

async function getUserStats(userAddress: string, startDate: Date | null) {
  const dateFilter = startDate ? `AND created_at >= $2` : ''
  const params = startDate ? [userAddress.toLowerCase(), startDate] : [userAddress.toLowerCase()]

  const [videos, tips, licenses, viewsStats] = await Promise.all([
    db.query(`SELECT COUNT(*) as count FROM videos WHERE creator_address = $1 ${dateFilter}`, params),
    db.query(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM tips WHERE to_address = $1 ${dateFilter}`, params),
    db.query(`SELECT COUNT(*) as count, COALESCE(SUM(creator_share), 0) as total FROM licenses WHERE creator_address = $1 ${dateFilter}`, params),
    db.query(`
      SELECT COALESCE(SUM(vs.views), 0) as total_views
      FROM videos v
      LEFT JOIN video_stats vs ON v.id = vs.video_id
      WHERE v.creator_address = $1 ${dateFilter}
    `, params)
  ])

  // Calculate monthly growth (mock for now)
  const monthlyGrowthVideos = Math.floor(Math.random() * 5)
  const monthlyGrowthViews = Math.floor(Math.random() * 1000)
  const monthlyGrowthEarnings = Math.random() * 100

  return {
    videos: parseInt(videos.rows[0].count),
    totalViews: parseInt(viewsStats.rows[0].total_views || 0),
    tips: {
      count: parseInt(tips.rows[0].count),
      amount: parseFloat(tips.rows[0].total)
    },
    licenses: {
      count: parseInt(licenses.rows[0].count),
      amount: parseFloat(licenses.rows[0].total)
    },
    monthlyGrowthVideos,
    monthlyGrowthViews,
    monthlyGrowthEarnings
  }
}

async function getRecentActivity(userAddress: string, limit: number) {
  const result = await db.query(`
    (SELECT 'tip' as type, t.created_at as date, t.amount as value, 
            v.title as video_title, u.handle as from_handle,
            'received' as action
     FROM tips t
     JOIN videos v ON t.video_id = v.id
     JOIN users u ON t.from_address = u.address
     WHERE t.to_address = $1)
    UNION ALL
    (SELECT 'license' as type, l.created_at as date, l.creator_share as value,
            v.title as video_title, u.handle as purchaser_handle,
            'sold' as action
     FROM licenses l
     JOIN videos v ON l.video_id = v.id
     JOIN users u ON l.purchaser_address = u.address
     WHERE l.creator_address = $1)
    UNION ALL
    (SELECT 'video' as type, v.created_at as date, NULL as value,
            v.title as video_title, NULL as other_handle,
            'uploaded' as action
     FROM videos v
     WHERE v.creator_address = $1)
    ORDER BY date DESC
    LIMIT $2
  `, [userAddress.toLowerCase(), limit])

  return result.rows.map(row => ({
    type: row.type,
    date: row.date,
    value: row.value,
    videoTitle: row.video_title,
    otherUser: row.other_handle,
    action: row.action
  }))
}

async function getContentPerformance(userAddress: string, startDate: Date | null) {
  const dateFilter = startDate ? `AND v.created_at >= $2` : ''
  const params = startDate ? [userAddress.toLowerCase(), startDate] : [userAddress.toLowerCase()]

  const result = await db.query(`
    SELECT v.token_id, v.title, v.created_at,
           COALESCE(vs.views, 0) as views,
           COALESCE(vs.tips_count, 0) as tips_count,
           COALESCE(vs.licenses_count, 0) as licenses_count,
           COALESCE(vs.total_earnings, 0) as total_earnings
    FROM videos v
    LEFT JOIN video_stats vs ON v.id = vs.video_id
    WHERE v.creator_address = $1 ${dateFilter}
    ORDER BY vs.total_earnings DESC NULLS LAST
    LIMIT 10
  `, params)

  return result.rows.map(row => ({
    tokenId: row.token_id,
    title: row.title,
    createdAt: row.created_at,
    views: parseInt(row.views),
    tipsCount: parseInt(row.tips_count),
    licensesCount: parseInt(row.licenses_count),
    totalEarnings: parseFloat(row.total_earnings)
  }))
}

async function getRevenueAnalytics(userAddress: string, startDate: Date | null) {
  const dateFilter = startDate ? `AND created_at >= $2` : ''
  const params = startDate ? [userAddress.toLowerCase(), startDate] : [userAddress.toLowerCase()]

  // Get revenue breakdown by source
  const [tipsRevenue, licensesRevenue] = await Promise.all([
    db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE to_address = $1 ${dateFilter}`, params),
    db.query(`SELECT COALESCE(SUM(creator_share), 0) as total FROM licenses WHERE creator_address = $1 ${dateFilter}`, params)
  ])

  const totalRevenue = parseFloat(tipsRevenue.rows[0].total) + parseFloat(licensesRevenue.rows[0].total)

  // Get monthly revenue for chart
  const monthlyRevenue = await db.query(`
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COALESCE(SUM(amount), 0) as tips,
      COALESCE(SUM(creator_share), 0) as licenses
    FROM (
      SELECT created_at, amount, 0 as creator_share FROM tips WHERE to_address = $1
      UNION ALL
      SELECT created_at, 0 as amount, creator_share FROM licenses WHERE creator_address = $1
    ) revenue
    ${startDate ? 'WHERE created_at >= $2' : ''}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
    LIMIT 12
  `, params)

  return {
    totalRevenue,
    breakdown: {
      tips: parseFloat(tipsRevenue.rows[0].total),
      licenses: parseFloat(licensesRevenue.rows[0].total)
    },
    monthlyRevenue: monthlyRevenue.rows.map(row => ({
      month: row.month,
      tips: parseFloat(row.tips),
      licenses: parseFloat(row.licenses),
      total: parseFloat(row.tips) + parseFloat(row.licenses)
    }))
  }
}
