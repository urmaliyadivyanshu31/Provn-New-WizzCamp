import { NextRequest, NextResponse } from 'next/server'
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

interface FastRoute {
  id: string
  video_token_id: string
  fast_url: string
  gateway_name: string
  response_time_ms: number
  success_rate: number
  last_tested: string
  created_at: string
  updated_at: string
}

interface FastRouteResponse {
  success: boolean
  tokenId: string
  fastUrl?: string
  gatewayName?: string
  responseTimeMs?: number
  cached: boolean
  fallbackUrl?: string
  error?: string
}

// Cache control constants
const CACHE_DURATION_HOURS = 1 // Consider routes fresh for 1 hour
const MAX_RESPONSE_TIME_MS = 5000 // Routes slower than 5s are considered stale

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await context.params
  const startTime = performance.now()
  
  console.log(`🚀 Fast Route API: Getting route for token ${tokenId}`)

  try {
    // Step 1: Check if we have a cached fast route
    const { data: cachedRoute, error: cacheError } = await supabase
      .from('video_fast_routes')
      .select('*')
      .eq('video_token_id', tokenId)
      .single()

    const now = new Date()
    let useCache = false
    let cachedRoute_: FastRoute | null = cachedRoute as FastRoute | null

    if (cachedRoute_ && !cacheError) {
      const lastTested = new Date(cachedRoute_.last_tested)
      const hoursSinceTest = (now.getTime() - lastTested.getTime()) / (1000 * 60 * 60)
      
      // Use cache if:
      // 1. Route was tested recently (< CACHE_DURATION_HOURS)
      // 2. Response time was good (< MAX_RESPONSE_TIME_MS)
      // 3. Success rate is acceptable (> 0.8)
      useCache = hoursSinceTest < CACHE_DURATION_HOURS && 
                 cachedRoute_.response_time_ms < MAX_RESPONSE_TIME_MS &&
                 cachedRoute_.success_rate > 0.8
    }

    if (useCache && cachedRoute_) {
      const responseTime = performance.now() - startTime
      console.log(`⚡ Fast Route Cache Hit: ${tokenId} -> ${cachedRoute_.gateway_name} (${responseTime.toFixed(0)}ms)`)

      return NextResponse.json({
        success: true,
        tokenId,
        fastUrl: cachedRoute_.fast_url,
        gatewayName: cachedRoute_.gateway_name,
        responseTimeMs: cachedRoute_.response_time_ms,
        cached: true
      } satisfies FastRouteResponse)
    }

    // Step 2: No valid cache, need to find fast route
    console.log(`🔍 No valid cache for ${tokenId}, testing gateways...`)

    // Get the video URL from platform_videos
    const { data: video, error: videoError } = await supabase
      .from('platform_videos')
      .select('video_url')
      .eq('token_id', tokenId)
      .single()

    if (videoError || !video) {
      console.error(`❌ Video not found: ${tokenId}`, videoError)
      return NextResponse.json({
        success: false,
        tokenId,
        cached: false,
        error: 'Video not found'
      } satisfies FastRouteResponse, { status: 404 })
    }

    // Step 3: Test gateways to find fastest route
    const originalUrl = video.video_url
    let fastestUrl: string
    let gatewayName: string
    let responseTime: number

    try {
      // Use the existing gateway service to find optimal URL
      const testStartTime = performance.now()
      fastestUrl = await ipfsGateway.getOptimalUrl(originalUrl, true) // Use proxy for reliability
      responseTime = performance.now() - testStartTime
      
      // Determine gateway name from URL
      gatewayName = 'proxy-optimized'
      if (fastestUrl.includes('dweb.link')) gatewayName = 'dweb.link'
      else if (fastestUrl.includes('ipfs.io')) gatewayName = 'ipfs.io'
      else if (fastestUrl.includes('cloudflare-ipfs.com')) gatewayName = 'cloudflare'
      else if (fastestUrl.includes('gateway.pinata.cloud')) gatewayName = 'pinata'

      console.log(`✅ Found fast route: ${gatewayName} (${responseTime.toFixed(0)}ms)`)

    } catch (error) {
      console.warn(`⚠️ Gateway testing failed for ${tokenId}:`, error)
      
      // Fallback to original URL through proxy
      fastestUrl = `/api/proxy/video?url=${encodeURIComponent(originalUrl)}`
      gatewayName = 'proxy-fallback'
      responseTime = 3000 // Assume moderate speed for fallback
    }

    // Step 4: Cache the result for future requests
    try {
      const routeData = {
        video_token_id: tokenId,
        fast_url: fastestUrl,
        gateway_name: gatewayName,
        response_time_ms: Math.round(responseTime),
        success_rate: 1.0, // Start with perfect success rate
        last_tested: now.toISOString(),
        updated_at: now.toISOString()
      }

      if (cachedRoute_) {
        // Update existing route
        await supabase
          .from('video_fast_routes')
          .update(routeData)
          .eq('video_token_id', tokenId)
      } else {
        // Insert new route
        await supabase
          .from('video_fast_routes')
          .insert(routeData)
      }

      console.log(`💾 Cached fast route for ${tokenId}`)
    } catch (cacheStoreError) {
      console.warn(`⚠️ Failed to cache route for ${tokenId}:`, cacheStoreError)
      // Continue without caching - not a critical error
    }

    // Step 5: Return the fast route
    const totalResponseTime = performance.now() - startTime
    console.log(`🎯 Fast Route Generated: ${tokenId} -> ${gatewayName} (total: ${totalResponseTime.toFixed(0)}ms)`)

    return NextResponse.json({
      success: true,
      tokenId,
      fastUrl: fastestUrl,
      gatewayName,
      responseTimeMs: Math.round(responseTime),
      cached: false,
      fallbackUrl: originalUrl
    } satisfies FastRouteResponse)

  } catch (error) {
    console.error(`❌ Fast Route API Error for ${tokenId}:`, error)
    
    return NextResponse.json({
      success: false,
      tokenId,
      cached: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      fallbackUrl: `/api/proxy/video?url=${encodeURIComponent('fallback')}`
    } satisfies FastRouteResponse, { status: 500 })
  }
}

// POST endpoint to update route performance data
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await context.params

  try {
    const body = await request.json()
    const { responseTime, success, gatewayName } = body

    if (typeof responseTime !== 'number' || typeof success !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request body' 
      }, { status: 400 })
    }

    // Update the route performance data
    const { data: existingRoute } = await supabase
      .from('video_fast_routes')
      .select('success_rate, response_time_ms')
      .eq('video_token_id', tokenId)
      .single()

    let newSuccessRate = success ? 1.0 : 0.0
    let newResponseTime = responseTime

    if (existingRoute) {
      // Calculate moving average of success rate and response time
      const weight = 0.8 // Give more weight to recent performance
      newSuccessRate = (weight * (success ? 1.0 : 0.0)) + ((1 - weight) * existingRoute.success_rate)
      newResponseTime = Math.round((weight * responseTime) + ((1 - weight) * existingRoute.response_time_ms))
    }

    const { error: updateError } = await supabase
      .from('video_fast_routes')
      .update({
        response_time_ms: newResponseTime,
        success_rate: newSuccessRate,
        last_tested: new Date().toISOString()
      })
      .eq('video_token_id', tokenId)

    if (updateError) {
      throw updateError
    }

    console.log(`📊 Updated performance data for ${tokenId}: ${responseTime}ms, success: ${success}`)

    return NextResponse.json({
      success: true,
      tokenId,
      updated: true
    })

  } catch (error) {
    console.error(`❌ Failed to update route performance for ${tokenId}:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update performance'
    }, { status: 500 })
  }
}

// DELETE endpoint to remove stale routes
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await context.params

  try {
    const { error } = await supabase
      .from('video_fast_routes')
      .delete()
      .eq('video_token_id', tokenId)

    if (error) {
      throw error
    }

    console.log(`🗑️ Removed fast route cache for ${tokenId}`)

    return NextResponse.json({
      success: true,
      tokenId,
      deleted: true
    })

  } catch (error) {
    console.error(`❌ Failed to delete route for ${tokenId}:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete route'
    }, { status: 500 })
  }
}