/**
 * Performance Metrics Tracking System
 * Monitors video loading performance, scroll smoothness, and user experience
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

interface VideoLoadMetrics {
  tokenId: string
  gatewayUsed: string
  loadStartTime: number
  posterLoadTime?: number
  videoLoadTime?: number
  firstPlayTime?: number
  bufferHits: number
  totalLoadTime: number
}

interface ScrollMetrics {
  scrollEvents: number
  frameDrops: number
  averageFrameTime: number
  jankEvents: number
  smoothScrollPercentage: number
}

export class PerformanceMetricsTracker {
  private metrics: PerformanceMetric[] = []
  private videoMetrics = new Map<string, VideoLoadMetrics>()
  private scrollMetrics: ScrollMetrics = {
    scrollEvents: 0,
    frameDrops: 0,
    averageFrameTime: 0,
    jankEvents: 0,
    smoothScrollPercentage: 0
  }
  private frameTimestamps: number[] = []
  private isTracking = false

  constructor() {
    this.startTracking()
  }

  /**
   * Start performance tracking
   */
  startTracking(): void {
    if (this.isTracking || typeof window === 'undefined') return

    this.isTracking = true

    // Track frame rates
    this.trackFrameRate()

    // Track network performance
    this.trackNetworkMetrics()

    // Track memory usage
    this.trackMemoryUsage()

    console.log('📊 Performance metrics tracking started')
  }

  /**
   * Track video loading performance
   */
  startVideoLoad(tokenId: string, gatewayUsed: string): void {
    const metrics: VideoLoadMetrics = {
      tokenId,
      gatewayUsed,
      loadStartTime: performance.now(),
      bufferHits: 0,
      totalLoadTime: 0
    }

    this.videoMetrics.set(tokenId, metrics)
  }

  /**
   * Mark poster load complete
   */
  markPosterLoaded(tokenId: string): void {
    const metrics = this.videoMetrics.get(tokenId)
    if (metrics) {
      metrics.posterLoadTime = performance.now() - metrics.loadStartTime
      this.recordMetric('poster_load_time', metrics.posterLoadTime, { tokenId, gateway: metrics.gatewayUsed })
    }
  }

  /**
   * Mark video load complete
   */
  markVideoLoaded(tokenId: string): void {
    const metrics = this.videoMetrics.get(tokenId)
    if (metrics) {
      metrics.videoLoadTime = performance.now() - metrics.loadStartTime
      this.recordMetric('video_load_time', metrics.videoLoadTime, { tokenId, gateway: metrics.gatewayUsed })
    }
  }

  /**
   * Mark first play time
   */
  markFirstPlay(tokenId: string): void {
    const metrics = this.videoMetrics.get(tokenId)
    if (metrics) {
      metrics.firstPlayTime = performance.now() - metrics.loadStartTime
      metrics.totalLoadTime = metrics.firstPlayTime
      
      this.recordMetric('first_play_time', metrics.firstPlayTime, { 
        tokenId, 
        gateway: metrics.gatewayUsed,
        bufferHits: metrics.bufferHits
      })

      // Clean up old metrics
      this.videoMetrics.delete(tokenId)
    }
  }

  /**
   * Mark buffer cache hit
   */
  markBufferHit(tokenId: string): void {
    const metrics = this.videoMetrics.get(tokenId)
    if (metrics) {
      metrics.bufferHits++
    }
    
    this.recordMetric('buffer_hit', 1, { tokenId })
  }

  /**
   * Track scroll event performance
   */
  trackScrollEvent(scrollDelta: number, processingTime: number): void {
    this.scrollMetrics.scrollEvents++
    
    // Detect jank (frame time > 16.67ms for 60fps)
    if (processingTime > 16.67) {
      this.scrollMetrics.jankEvents++
    }

    // Update smooth scroll percentage
    this.scrollMetrics.smoothScrollPercentage = 
      ((this.scrollMetrics.scrollEvents - this.scrollMetrics.jankEvents) / this.scrollMetrics.scrollEvents) * 100

    this.recordMetric('scroll_processing_time', processingTime, { 
      scrollDelta, 
      isJank: processingTime > 16.67
    })
  }

  /**
   * Get current performance statistics
   */
  getStats(): {
    video: {
      averageLoadTime: number
      averagePosterTime: number
      bufferHitRate: number
      fastestGateway: string
    }
    scroll: ScrollMetrics
    memory: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
    network: {
      downlink: number
      effectiveType: string
    }
  } {
    const videoLoadTimes = this.metrics
      .filter(m => m.name === 'video_load_time')
      .map(m => m.value)

    const posterLoadTimes = this.metrics
      .filter(m => m.name === 'poster_load_time')
      .map(m => m.value)

    const bufferHits = this.metrics.filter(m => m.name === 'buffer_hit').length
    const totalVideoLoads = videoLoadTimes.length

    // Find fastest gateway
    const gatewayTimes = new Map<string, number[]>()
    this.metrics
      .filter(m => m.name === 'video_load_time' && m.metadata?.gateway)
      .forEach(m => {
        const gateway = m.metadata!.gateway
        if (!gatewayTimes.has(gateway)) {
          gatewayTimes.set(gateway, [])
        }
        gatewayTimes.get(gateway)!.push(m.value)
      })

    let fastestGateway = 'unknown'
    let fastestTime = Infinity
    
    for (const [gateway, times] of gatewayTimes.entries()) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      if (avgTime < fastestTime) {
        fastestTime = avgTime
        fastestGateway = gateway
      }
    }

    return {
      video: {
        averageLoadTime: videoLoadTimes.length > 0 ? 
          videoLoadTimes.reduce((a, b) => a + b, 0) / videoLoadTimes.length : 0,
        averagePosterTime: posterLoadTimes.length > 0 ? 
          posterLoadTimes.reduce((a, b) => a + b, 0) / posterLoadTimes.length : 0,
        bufferHitRate: totalVideoLoads > 0 ? (bufferHits / totalVideoLoads) * 100 : 0,
        fastestGateway
      },
      scroll: this.scrollMetrics,
      memory: this.getMemoryInfo(),
      network: this.getNetworkInfo()
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Clear old metrics (keep last 1000)
   */
  clearOldMetrics(): void {
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    })

    // Clean up periodically
    if (this.metrics.length % 100 === 0) {
      this.clearOldMetrics()
    }
  }

  /**
   * Track frame rate for smooth scrolling detection
   */
  private trackFrameRate(): void {
    const trackFrame = () => {
      const now = performance.now()
      this.frameTimestamps.push(now)

      // Keep only last 60 frame timestamps (1 second at 60fps)
      if (this.frameTimestamps.length > 60) {
        this.frameTimestamps.shift()
      }

      // Calculate average frame time
      if (this.frameTimestamps.length > 1) {
        const frameDeltas = this.frameTimestamps.slice(1).map((time, i) => 
          time - this.frameTimestamps[i]
        )
        
        this.scrollMetrics.averageFrameTime = 
          frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length

        // Count frame drops (frame time > 20ms = dropped frame)
        this.scrollMetrics.frameDrops = frameDeltas.filter(delta => delta > 20).length
      }

      requestAnimationFrame(trackFrame)
    }

    requestAnimationFrame(trackFrame)
  }

  /**
   * Track network metrics
   */
  private trackNetworkMetrics(): void {
    // Use Network Information API if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', () => {
        this.recordMetric('network_change', 1, {
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt
        })
      })
    }
  }

  /**
   * Track memory usage
   */
  private trackMemoryUsage(): void {
    const trackMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        
        this.recordMetric('memory_used', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        })
      }

      // Track every 30 seconds
      setTimeout(trackMemory, 30000)
    }

    trackMemory()
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }
    
    return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 }
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): { downlink: number; effectiveType: string } {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      return {
        downlink: connection.downlink || 0,
        effectiveType: connection.effectiveType || 'unknown'
      }
    }

    return { downlink: 0, effectiveType: 'unknown' }
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceMetricsTracker()

// Log performance stats in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Log stats every 60 seconds
  setInterval(() => {
    const stats = performanceTracker.getStats()
    console.group('📊 Performance Stats')
    console.log('Video Loading:', {
      avgLoadTime: `${stats.video.averageLoadTime.toFixed(0)}ms`,
      avgPosterTime: `${stats.video.averagePosterTime.toFixed(0)}ms`,
      bufferHitRate: `${stats.video.bufferHitRate.toFixed(1)}%`,
      fastestGateway: stats.video.fastestGateway
    })
    console.log('Scroll Performance:', {
      smoothness: `${stats.scroll.smoothScrollPercentage.toFixed(1)}%`,
      avgFrameTime: `${stats.scroll.averageFrameTime.toFixed(2)}ms`,
      jankEvents: stats.scroll.jankEvents,
      frameDrops: stats.scroll.frameDrops
    })
    console.log('Memory:', {
      used: `${(stats.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`,
      total: `${(stats.memory.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB`
    })
    console.log('Network:', {
      downlink: `${stats.network.downlink}Mbps`,
      effectiveType: stats.network.effectiveType
    })
    console.groupEnd()
  }, 60000)
}