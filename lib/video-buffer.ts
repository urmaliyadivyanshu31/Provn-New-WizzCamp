/**
 * Video Buffer Management System
 * Handles aggressive preloading and intelligent buffering for smooth video experiences
 */

import { ExploreVideo } from '@/types/explore'
import { ipfsGateway } from './ipfs-gateway'

interface BufferedVideo {
  video: ExploreVideo
  videoElement?: HTMLVideoElement
  posterLoaded: boolean
  videoLoaded: boolean
  loadStartTime: number
  priority: number
  lastAccessed: number
}

interface BufferStats {
  totalBuffered: number
  memoryUsage: number
  cacheHits: number
  cacheMisses: number
}

export class VideoBufferManager {
  private buffer = new Map<string, BufferedVideo>()
  private maxBufferSize = 15 // Keep 15 videos in buffer
  private preloadDistance = 7 // Preload 7 videos ahead
  private stats: BufferStats = {
    totalBuffered: 0,
    memoryUsage: 0,
    cacheHits: 0,
    cacheMisses: 0
  }

  /**
   * Preload videos around current position for smooth scrolling
   */
  async preloadVideosAroundPosition(
    videos: ExploreVideo[],
    currentIndex: number,
    direction: 'up' | 'down' | 'both' = 'both'
  ) {
    const preloadTasks: Promise<void>[] = []

    // Determine range based on direction
    let startIndex: number
    let endIndex: number

    switch (direction) {
      case 'up':
        startIndex = Math.max(0, currentIndex - this.preloadDistance)
        endIndex = currentIndex + 2
        break
      case 'down':
        startIndex = Math.max(0, currentIndex - 2)
        endIndex = Math.min(videos.length, currentIndex + this.preloadDistance)
        break
      default: // 'both'
        startIndex = Math.max(0, currentIndex - 3)
        endIndex = Math.min(videos.length, currentIndex + this.preloadDistance)
    }

    // Preload videos in order of priority (closer to current = higher priority)
    for (let i = startIndex; i < endIndex; i++) {
      if (videos[i]) {
        const priority = this.calculatePriority(i, currentIndex)
        preloadTasks.push(this.preloadVideo(videos[i], priority))
      }
    }

    // Execute preloading with controlled concurrency (max 3 at once)
    const chunks = this.chunkArray(preloadTasks, 3)
    for (const chunk of chunks) {
      await Promise.allSettled(chunk)
    }

    // Clean up old videos to prevent memory bloat
    this.cleanupBuffer(currentIndex)
  }

  /**
   * Get a buffered video element, creating if necessary
   */
  async getBufferedVideo(video: ExploreVideo): Promise<HTMLVideoElement | null> {
    const tokenId = video.tokenId
    const buffered = this.buffer.get(tokenId)

    if (buffered) {
      this.stats.cacheHits++
      buffered.lastAccessed = Date.now()
      
      if (buffered.videoElement) {
        console.log(`🎯 Cache hit for video ${tokenId}`)
        return buffered.videoElement
      }
    } else {
      this.stats.cacheMisses++
    }

    // Video not buffered, load it now
    return await this.loadVideoElement(video)
  }

  /**
   * Check if video is already buffered and ready
   */
  isVideoBuffered(tokenId: string): boolean {
    const buffered = this.buffer.get(tokenId)
    return buffered?.videoLoaded === true
  }

  /**
   * Get buffer statistics for monitoring
   */
  getStats(): BufferStats {
    return {
      ...this.stats,
      totalBuffered: this.buffer.size,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * Clear entire buffer (useful for memory pressure situations)
   */
  clearBuffer(): void {
    for (const [tokenId, buffered] of this.buffer.entries()) {
      if (buffered.videoElement) {
        this.releaseVideoElement(buffered.videoElement)
      }
    }
    
    this.buffer.clear()
    console.log('🧹 Video buffer cleared')
  }

  /**
   * Preload a single video with priority handling
   */
  private async preloadVideo(video: ExploreVideo, priority: number): Promise<void> {
    const tokenId = video.tokenId

    // Skip if already buffered
    if (this.buffer.has(tokenId)) {
      return
    }

    const bufferedVideo: BufferedVideo = {
      video,
      posterLoaded: false,
      videoLoaded: false,
      loadStartTime: Date.now(),
      priority,
      lastAccessed: Date.now()
    }

    this.buffer.set(tokenId, bufferedVideo)

    try {
      // First, preload the poster/thumbnail for instant display
      if (video.thumbnailUrl) {
        await this.preloadPoster(video.thumbnailUrl)
        bufferedVideo.posterLoaded = true
        console.log(`📸 Poster loaded for ${tokenId}`)
      }

      // Then preload video in background (non-blocking)
      this.loadVideoInBackground(bufferedVideo)

    } catch (error) {
      console.warn(`❌ Failed to preload video ${tokenId}:`, error)
      this.buffer.delete(tokenId)
    }
  }

  /**
   * Load video element in background without blocking
   */
  private async loadVideoInBackground(bufferedVideo: BufferedVideo): Promise<void> {
    try {
      const videoElement = await this.loadVideoElement(bufferedVideo.video, false)
      
      if (videoElement) {
        bufferedVideo.videoElement = videoElement
        bufferedVideo.videoLoaded = true
        
        const loadTime = Date.now() - bufferedVideo.loadStartTime
        console.log(`🎬 Video ${bufferedVideo.video.tokenId} preloaded in ${loadTime}ms`)
      }
    } catch (error) {
      console.warn(`❌ Background video load failed for ${bufferedVideo.video.tokenId}:`, error)
      // Don't remove from buffer immediately - keep the entry for poster if it loaded
      // Only mark video as failed, not the entire buffer entry
      bufferedVideo.videoLoaded = false
    }
  }

  /**
   * Create and load a video element
   */
  private async loadVideoElement(
    video: ExploreVideo, 
    immediate = true
  ): Promise<HTMLVideoElement | null> {
    try {
      const videoElement = document.createElement('video')
      videoElement.preload = immediate ? 'auto' : 'metadata'
      videoElement.playsInline = true
      videoElement.muted = true // Always start muted for autoplay
      videoElement.loop = true

      // Get optimal IPFS URL
      const videoSrc = await ipfsGateway.getOptimalUrl(video.videoUrl, true)
      videoElement.src = videoSrc

      // Set up poster if available
      if (video.thumbnailUrl) {
        const posterSrc = await ipfsGateway.getOptimalUrl(video.thumbnailUrl, true)
        videoElement.poster = posterSrc
      }

      // Return immediately for background loading
      if (!immediate) {
        return videoElement
      }

      // For immediate loading, wait for some metadata
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn(`⏰ Video load timeout for ${video.tokenId} after 15s`)
          reject(new Error('Video load timeout'))
        }, 15000) // Increased from 5s to 15s

        videoElement.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout)
          resolve(videoElement)
        }, { once: true })

        videoElement.addEventListener('error', (event) => {
          clearTimeout(timeout)
          console.error(`❌ Video load error for ${video.tokenId}:`, event)
          reject(new Error(`Video load error: ${videoElement.error?.message || 'Unknown error'}`))
        }, { once: true })
      })

    } catch (error) {
      console.error('Failed to load video element:', error)
      return null
    }
  }

  /**
   * Preload poster/thumbnail image
   */
  private async preloadPoster(thumbnailUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Poster load failed'))
      img.src = thumbnailUrl
    })
  }

  /**
   * Calculate priority based on distance from current video
   */
  private calculatePriority(index: number, currentIndex: number): number {
    const distance = Math.abs(index - currentIndex)
    return Math.max(1, 10 - distance) // Higher number = higher priority
  }

  /**
   * Clean up old videos using LRU strategy
   */
  private cleanupBuffer(currentIndex: number): void {
    if (this.buffer.size <= this.maxBufferSize) {
      return
    }

    // Sort by priority and last accessed time
    const entries = Array.from(this.buffer.entries())
      .map(([tokenId, buffered]) => ({
        tokenId,
        buffered,
        shouldKeep: this.shouldKeepVideo(buffered, currentIndex)
      }))
      .sort((a, b) => {
        // Keep high priority videos
        if (a.shouldKeep && !b.shouldKeep) return -1
        if (!a.shouldKeep && b.shouldKeep) return 1
        
        // Then sort by last accessed time (LRU)
        return a.buffered.lastAccessed - b.buffered.lastAccessed
      })

    // Remove oldest videos beyond buffer size
    const toRemove = entries.slice(this.maxBufferSize)
    
    for (const { tokenId, buffered } of toRemove) {
      if (buffered.videoElement) {
        this.releaseVideoElement(buffered.videoElement)
      }
      this.buffer.delete(tokenId)
    }

    if (toRemove.length > 0) {
      console.log(`🧹 Cleaned up ${toRemove.length} videos from buffer`)
    }
  }

  /**
   * Determine if a video should be kept in buffer
   */
  private shouldKeepVideo(buffered: BufferedVideo, currentIndex: number): boolean {
    // Keep high priority videos (close to current position)
    return buffered.priority > 5 || 
           Date.now() - buffered.lastAccessed < 60000 // Accessed in last minute
  }

  /**
   * Properly release video element resources
   */
  private releaseVideoElement(videoElement: HTMLVideoElement): void {
    videoElement.pause()
    videoElement.src = ''
    videoElement.load() // This releases the video data
  }

  /**
   * Estimate memory usage of buffered videos
   */
  private estimateMemoryUsage(): number {
    // Rough estimate: each video ~50MB when loaded
    const loadedVideos = Array.from(this.buffer.values())
      .filter(buffered => buffered.videoLoaded).length
    
    return loadedVideos * 50 // MB
  }

  /**
   * Utility: chunk array for controlled concurrency
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}

// Export singleton instance
export const videoBufferManager = new VideoBufferManager()

// Performance monitoring
if (typeof window !== 'undefined') {
  // Log buffer stats every 30 seconds in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const stats = videoBufferManager.getStats()
      console.log('📊 Video Buffer Stats:', stats)
    }, 30000)
  }

  // Clean up on memory pressure
  window.addEventListener('beforeunload', () => {
    videoBufferManager.clearBuffer()
  })
}