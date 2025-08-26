/**
 * Background Video Route Optimizer Service
 * Continuously tests and updates optimal routes for videos to ensure fast loading
 */

import { createClient } from '@supabase/supabase-js'
import { ipfsGateway } from '@/lib/ipfs-gateway'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface VideoRouteTest {
  tokenId: string
  originalUrl: string
  currentFastUrl?: string
  currentGateway?: string
  lastTested?: Date
  currentResponseTime?: number
  currentSuccessRate?: number
}

interface RouteTestResult {
  tokenId: string
  fastUrl: string
  gatewayName: string
  responseTime: number
  success: boolean
  error?: string
}

export class VideoRouteOptimizer {
  private isRunning = false
  private testQueue: VideoRouteTest[] = []
  private maxConcurrentTests = 3
  private testTimeoutMs = 5000
  
  constructor() {
    this.setupPeriodicOptimization()
  }

  /**
   * Start the background optimization service
   */
  async startOptimization() {
    if (this.isRunning) {
      console.log('⚡ Route optimizer is already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting Video Route Optimizer...')
    
    try {
      await this.runOptimizationCycle()
    } catch (error) {
      console.error('❌ Route optimization failed:', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Stop the optimization service
   */
  stopOptimization() {
    this.isRunning = false
    console.log('🛑 Stopping Video Route Optimizer...')
  }

  /**
   * Setup periodic optimization (runs every 15 minutes)
   */
  private setupPeriodicOptimization() {
    // Run optimization every 15 minutes
    setInterval(() => {
      if (!this.isRunning) {
        this.startOptimization()
      }
    }, 15 * 60 * 1000)

    // Initial run after 30 seconds to let the server start up
    setTimeout(() => {
      this.startOptimization()
    }, 30 * 1000)
  }

  /**
   * Main optimization cycle
   */
  private async runOptimizationCycle() {
    console.log('🔍 Starting route optimization cycle...')
    
    // Step 1: Get videos that need optimization
    const videosToTest = await this.getVideosNeedingOptimization()
    
    if (videosToTest.length === 0) {
      console.log('✅ All video routes are optimal')
      return
    }

    console.log(`🎯 Found ${videosToTest.length} videos needing route optimization`)

    // Step 2: Test routes in batches
    const batchSize = this.maxConcurrentTests
    for (let i = 0; i < videosToTest.length; i += batchSize) {
      const batch = videosToTest.slice(i, i + batchSize)
      
      console.log(`🧪 Testing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videosToTest.length / batchSize)}`)
      
      const batchResults = await Promise.allSettled(
        batch.map(video => this.testVideoRoute(video))
      )

      // Process results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j]
        const video = batch[j]
        
        if (result.status === 'fulfilled' && result.value.success) {
          await this.updateVideoRoute(result.value)
        } else {
          console.warn(`⚠️ Failed to optimize route for ${video.tokenId}:`, 
            result.status === 'rejected' ? result.reason : result.value?.error)
        }
      }

      // Small delay between batches to avoid overwhelming the system
      await this.delay(1000)
    }

    console.log('✅ Route optimization cycle completed')
  }

  /**
   * Get videos that need route optimization
   */
  private async getVideosNeedingOptimization(): Promise<VideoRouteTest[]> {
    try {
      // Get videos from explore feed (most recently viewed)
      const { data: recentVideos, error: videosError } = await supabase
        .from('platform_videos')
        .select('token_id, video_url')
        .eq('upload_status', 'ready')
        .eq('visibility', 'public')
        .order('views_count', { ascending: false })
        .limit(50) // Focus on top 50 most viewed videos

      if (videosError || !recentVideos) {
        throw videosError || new Error('No videos found')
      }

      // Get existing routes
      const tokenIds = recentVideos.map(v => v.token_id)
      const { data: existingRoutes } = await supabase
        .from('video_fast_routes')
        .select('*')
        .in('video_token_id', tokenIds)

      const routeMap = new Map(
        existingRoutes?.map(r => [r.video_token_id, r]) || []
      )

      // Determine which videos need optimization
      const videosToTest: VideoRouteTest[] = []
      const now = new Date()
      const staleThresholdHours = 6 // Re-test routes older than 6 hours

      for (const video of recentVideos) {
        const existingRoute = routeMap.get(video.token_id)
        
        if (!existingRoute) {
          // New video, needs initial route testing
          videosToTest.push({
            tokenId: video.token_id,
            originalUrl: video.video_url
          })
        } else {
          const lastTested = new Date(existingRoute.last_tested)
          const hoursSinceTest = (now.getTime() - lastTested.getTime()) / (1000 * 60 * 60)
          
          // Re-test if:
          // 1. Route is stale (older than threshold)
          // 2. Success rate is low (< 0.7)
          // 3. Response time is high (> 3000ms)
          if (hoursSinceTest > staleThresholdHours || 
              existingRoute.success_rate < 0.7 || 
              existingRoute.response_time_ms > 3000) {
            
            videosToTest.push({
              tokenId: video.token_id,
              originalUrl: video.video_url,
              currentFastUrl: existingRoute.fast_url,
              currentGateway: existingRoute.gateway_name,
              lastTested,
              currentResponseTime: existingRoute.response_time_ms,
              currentSuccessRate: existingRoute.success_rate
            })
          }
        }
      }

      return videosToTest

    } catch (error) {
      console.error('❌ Failed to get videos for optimization:', error)
      return []
    }
  }

  /**
   * Test routes for a specific video
   */
  private async testVideoRoute(video: VideoRouteTest): Promise<RouteTestResult> {
    const { tokenId, originalUrl } = video
    
    try {
      console.log(`🧪 Testing routes for video ${tokenId}`)
      
      const startTime = performance.now()
      
      // Use the gateway service to find the optimal URL
      const optimalUrl = await Promise.race([
        ipfsGateway.getOptimalUrl(originalUrl, true),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.testTimeoutMs)
        )
      ])
      
      const responseTime = performance.now() - startTime
      
      // Determine gateway name
      let gatewayName = 'proxy-optimized'
      if (optimalUrl.includes('dweb.link')) gatewayName = 'dweb.link'
      else if (optimalUrl.includes('ipfs.io')) gatewayName = 'ipfs.io'
      else if (optimalUrl.includes('cloudflare-ipfs.com')) gatewayName = 'cloudflare'
      else if (optimalUrl.includes('gateway.pinata.cloud')) gatewayName = 'pinata'

      console.log(`✅ Route test successful for ${tokenId}: ${gatewayName} (${responseTime.toFixed(0)}ms)`)

      return {
        tokenId,
        fastUrl: optimalUrl,
        gatewayName,
        responseTime,
        success: true
      }

    } catch (error) {
      console.warn(`⚠️ Route test failed for ${tokenId}:`, error)
      
      // Return fallback route
      return {
        tokenId,
        fastUrl: `/api/proxy/video?url=${encodeURIComponent(originalUrl)}`,
        gatewayName: 'proxy-fallback',
        responseTime: 5000,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update the video route in the database
   */
  private async updateVideoRoute(result: RouteTestResult) {
    try {
      const { tokenId, fastUrl, gatewayName, responseTime, success } = result
      const now = new Date()

      // Check if route exists
      const { data: existingRoute } = await supabase
        .from('video_fast_routes')
        .select('*')
        .eq('video_token_id', tokenId)
        .single()

      let newSuccessRate = success ? 1.0 : 0.0

      if (existingRoute) {
        // Update existing route with weighted average
        const weight = 0.7 // Give more weight to recent tests
        newSuccessRate = (weight * (success ? 1.0 : 0.0)) + 
                        ((1 - weight) * existingRoute.success_rate)

        await supabase
          .from('video_fast_routes')
          .update({
            fast_url: fastUrl,
            gateway_name: gatewayName,
            response_time_ms: Math.round(responseTime),
            success_rate: newSuccessRate,
            last_tested: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('video_token_id', tokenId)
      } else {
        // Insert new route
        await supabase
          .from('video_fast_routes')
          .insert({
            video_token_id: tokenId,
            fast_url: fastUrl,
            gateway_name: gatewayName,
            response_time_ms: Math.round(responseTime),
            success_rate: newSuccessRate,
            last_tested: now.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          })
      }

      console.log(`💾 Updated route for ${tokenId}: ${gatewayName} (${responseTime.toFixed(0)}ms, ${(newSuccessRate * 100).toFixed(0)}% success)`)

    } catch (error) {
      console.error(`❌ Failed to update route for ${result.tokenId}:`, error)
    }
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get optimization statistics
   */
  async getStats() {
    try {
      const { data: routes, error } = await supabase
        .from('video_fast_routes')
        .select('*')

      if (error || !routes) {
        return { error: 'Failed to get stats' }
      }

      const now = new Date()
      const recentRoutes = routes.filter(r => {
        const lastTested = new Date(r.last_tested)
        const hoursSinceTest = (now.getTime() - lastTested.getTime()) / (1000 * 60 * 60)
        return hoursSinceTest <= 24 // Routes tested in last 24 hours
      })

      const avgResponseTime = recentRoutes.reduce((sum, r) => sum + r.response_time_ms, 0) / recentRoutes.length
      const avgSuccessRate = recentRoutes.reduce((sum, r) => sum + r.success_rate, 0) / recentRoutes.length

      const gatewayStats = recentRoutes.reduce((stats, r) => {
        stats[r.gateway_name] = (stats[r.gateway_name] || 0) + 1
        return stats
      }, {} as Record<string, number>)

      return {
        totalRoutes: routes.length,
        recentlyTested: recentRoutes.length,
        avgResponseTime: Math.round(avgResponseTime),
        avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
        gatewayDistribution: gatewayStats,
        isRunning: this.isRunning
      }

    } catch (error) {
      console.error('❌ Failed to get route optimizer stats:', error)
      return { error: 'Failed to get stats' }
    }
  }
}

// Export singleton instance
export const videoRouteOptimizer = new VideoRouteOptimizer()

// Export for use in API routes or admin functions
export default videoRouteOptimizer