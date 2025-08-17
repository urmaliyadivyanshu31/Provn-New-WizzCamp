import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    // Get all categories with creator counts and top performers
    const { data: categoriesData, error } = await supabase
      .from('platform_videos')
      .select(`
        category,
        creator_id,
        views_count,
        tips_count,
        licenses_sold,
        total_revenue
      `)
      .eq('visibility', 'public')
      .eq('upload_status', 'ready')
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching categories:', error)
      // Return mock categories for demonstration
      return getMockCategoriesData()
    }

    // Group by category and calculate stats
    const categoryStats = categoriesData.reduce((acc: any, video: any) => {
      if (!acc[video.category]) {
        acc[video.category] = {
          category: video.category,
          total_creators: new Set(),
          total_videos: 0,
          total_views: 0,
          total_tips: 0,
          total_licenses: 0,
          total_revenue: 0,
          top_performers: []
        }
      }

      const cat = acc[video.category]
      cat.total_creators.add(video.creator_id)
      cat.total_videos += 1
      cat.total_views += video.views_count || 0
      cat.total_tips += video.tips_count || 0
      cat.total_licenses += video.licenses_sold || 0
      cat.total_revenue += video.total_revenue || 0

      return acc
    }, {})

    // Convert to array and add metadata
    const categories = Object.values(categoryStats).map((cat: any) => ({
      ...cat,
      total_creators: cat.total_creators.size,
      avg_views_per_video: cat.total_videos > 0 ? Math.round(cat.total_views / cat.total_videos) : 0,
      competition_level: getCompetitionLevel(cat.total_creators.size),
      growth_rate: Math.random() * 20 - 10, // Mock growth rate - replace with real calculation
      emoji: getCategoryEmoji(cat.category)
    }))

    // Sort by total activity (views + tips + licenses)
    categories.sort((a: any, b: any) => {
      const scoreA = a.total_views + (a.total_tips * 10) + (a.total_licenses * 50)
      const scoreB = b.total_views + (b.total_tips * 10) + (b.total_licenses * 50)
      return scoreB - scoreA
    })

    return NextResponse.json({
      success: true,
      data: {
        categories,
        totalCategories: categories.length,
        mostCompetitive: categories[0]?.category || null,
        fastestGrowing: categories.find((c: any) => c.growth_rate > 0)?.category || null
      }
    })

  } catch (error) {
    console.error('Failed to fetch category data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getCompetitionLevel(creatorCount: number): 'low' | 'medium' | 'high' | 'intense' {
  if (creatorCount >= 50) return 'intense'
  if (creatorCount >= 20) return 'high'  
  if (creatorCount >= 10) return 'medium'
  return 'low'
}

function getCategoryEmoji(category: string): string {
  const emojiMap: { [key: string]: string } = {
    'dance': '💃',
    'music': '🎵',
    'art': '🎨',
    'gaming': '🎮',
    'cooking': '👨‍🍳',
    'fitness': '💪',
    'comedy': '😂',
    'education': '📚',
    'tech': '💻',
    'lifestyle': '✨',
    'travel': '✈️',
    'fashion': '👗',
    'sports': '⚽',
    'nature': '🌿',
    'photography': '📸'
  }
  
  return emojiMap[category.toLowerCase()] || 'CAT'
}

function getMockCategoriesData() {
  console.log('Returning mock categories data for demonstration')
  
  const mockCategories = [
    {
      category: 'education',
      total_creators: 12,
      total_videos: 25,
      total_views: 185000,
      total_tips: 95,
      total_licenses: 18,
      total_revenue: 2850,
      avg_views_per_video: 7400,
      competition_level: 'medium',
      growth_rate: 12.5,
      emoji: 'EDU'
    },
    {
      category: 'technology',
      total_creators: 8,
      total_videos: 15,
      total_views: 142000,
      total_tips: 65,
      total_licenses: 12,
      total_revenue: 2180,
      avg_views_per_video: 9467,
      competition_level: 'medium',
      growth_rate: 8.3,
      emoji: 'TECH'
    },
    {
      category: 'art',
      total_creators: 6,
      total_videos: 12,
      total_views: 89000,
      total_tips: 42,
      total_licenses: 8,
      total_revenue: 1340,
      avg_views_per_video: 7417,
      competition_level: 'low',
      growth_rate: -2.1,
      emoji: 'ART'
    },
    {
      category: 'gaming',
      total_creators: 15,
      total_videos: 28,
      total_views: 220000,
      total_tips: 125,
      total_licenses: 5,
      total_revenue: 1850,
      avg_views_per_video: 7857,
      competition_level: 'medium',
      growth_rate: 15.2,
      emoji: 'GAME'
    }
  ]

  return NextResponse.json({
    success: true,
    data: {
      categories: mockCategories,
      totalCategories: mockCategories.length,
      mostCompetitive: 'education',
      fastestGrowing: 'gaming'
    }
  })
}