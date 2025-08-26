import { NextRequest, NextResponse } from 'next/server'
import { videoRouteOptimizer } from '@/lib/services/video-route-optimizer'

/**
 * Admin API endpoint to get video route optimization statistics
 * Provides insights into the fast routes system performance
 */

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching video routes statistics...')

    // Get stats from the route optimizer
    const stats = await videoRouteOptimizer.getStats()

    if ('error' in stats) {
      throw new Error(stats.error)
    }

    // Additional computed metrics
    const enhancedStats = {
      ...stats,
      optimization: {
        cacheHitRate: stats.recentlyTested > 0 ? 
          Math.round((stats.recentlyTested / stats.totalRoutes) * 100) : 0,
        performanceGrade: stats.avgResponseTime < 1000 ? 'A' : 
                         stats.avgResponseTime < 2000 ? 'B' : 
                         stats.avgResponseTime < 3000 ? 'C' : 'D',
        systemHealth: stats.avgSuccessRate > 0.9 ? 'Excellent' :
                     stats.avgSuccessRate > 0.8 ? 'Good' :
                     stats.avgSuccessRate > 0.6 ? 'Fair' : 'Poor'
      },
      recommendations: [] as string[]
    }

    // Generate recommendations
    if (stats.avgResponseTime > 2000) {
      enhancedStats.recommendations.push('Consider updating gateway priorities to improve response times')
    }
    
    if (stats.avgSuccessRate < 0.8) {
      enhancedStats.recommendations.push('Some routes have low success rates - review and update stale routes')
    }
    
    if (stats.recentlyTested < stats.totalRoutes * 0.5) {
      enhancedStats.recommendations.push('Many routes are stale - increase background optimization frequency')
    }

    console.log('✅ Video routes statistics retrieved successfully')

    return NextResponse.json({
      success: true,
      stats: enhancedStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Failed to get video routes statistics:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST endpoint to trigger manual optimization
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Triggering manual video route optimization...')

    // Start the optimization process
    videoRouteOptimizer.startOptimization()

    return NextResponse.json({
      success: true,
      message: 'Manual optimization started',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Failed to start manual optimization:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start optimization',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}