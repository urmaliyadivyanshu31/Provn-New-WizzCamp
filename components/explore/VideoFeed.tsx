"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { VideoPlayer } from "./VideoPlayer"
import { VideoOverlay } from "./VideoOverlay"
import { ExploreVideo } from "@/types/explore"
import { useVideoInteractions } from "@/hooks/useVideoInteractions"
import { Loader2 } from "lucide-react"

interface VideoFeedProps {
  onVideoDetails: (video: ExploreVideo) => void
  isAuthenticated: boolean
  useBlockchainData?: boolean
}

export function VideoFeed({ onVideoDetails, isAuthenticated, useBlockchainData = false }: VideoFeedProps) {
  const [videos, setVideos] = useState<ExploreVideo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  
  const { likeVideo, viewVideo, shareVideo } = useVideoInteractions()

  // Fetch initial videos and refetch when data source changes
  useEffect(() => {
    fetchVideos(0, useBlockchainData)
  }, [useBlockchainData])

  const fetchVideos = async (page: number = 0, useBlockchain = false) => {
    try {
      setLoading(true)
      
      // Determine source based on useBlockchain prop
      const source = useBlockchain ? 'blockchain' : 'platform'
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        source
      })

      // Add user wallet for personalized content (likes, etc.)
      const userWallet = localStorage.getItem('userWallet') // Assuming wallet is stored in localStorage
      if (userWallet) {
        params.append('userWallet', userWallet)
      }

      const response = await fetch(`/api/explore/feed?${params}`)
      const data = await response.json()
      
      if (data.success) {
        if (page === 0) {
          setVideos(data.videos)
        } else {
          setVideos(prev => [...prev, ...data.videos])
        }
        setHasMore(data.hasMore)
        
        console.log('📺 VideoFeed: Loaded videos from', data.source || 'unknown', {
          count: data.videos.length,
          page,
          hasMore: data.hasMore
        })
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle scroll/swipe navigation
  const handleScroll = useCallback((e: React.WheelEvent) => {
    if (isScrolling) return
    
    setIsScrolling(true)
    
    const delta = e.deltaY
    if (delta > 50 && currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1)
      // Load more videos when near the end
      if (currentIndex >= videos.length - 3 && hasMore) {
        fetchVideos(Math.floor(videos.length / 10), useBlockchainData)
      }
    } else if (delta < -50 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
    
    setTimeout(() => setIsScrolling(false), 500)
  }, [currentIndex, videos.length, hasMore, isScrolling])

  // Handle touch gestures for mobile
  const touchStartY = useRef<number>(0)
  const touchEndY = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndY.current = e.changedTouches[0].clientY
    const deltaY = touchStartY.current - touchEndY.current
    const deltaTime = Date.now() - (touchStartY.current ? Date.now() : 0)
    
    // Require minimum swipe distance and reasonable speed
    if (Math.abs(deltaY) > 50 && deltaTime < 1000) {
      if (deltaY > 0 && currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1)
        if (currentIndex >= videos.length - 3 && hasMore) {
          fetchVideos(Math.floor(videos.length / 10), useBlockchainData)
        }
      } else if (deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1)
      }
    }
  }

  // Track view when video becomes current
  useEffect(() => {
    if (videos[currentIndex]) {
      viewVideo(videos[currentIndex].tokenId)
    }
  }, [currentIndex, videos, viewVideo])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyboardNav = (e: CustomEvent) => {
      const direction = e.detail.direction
      if (direction === 'down' && currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1)
        if (currentIndex >= videos.length - 3 && hasMore) {
          fetchVideos(Math.floor(videos.length / 10), useBlockchainData)
        }
      } else if (direction === 'up' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1)
      }
    }

    window.addEventListener('keyboardNavigation' as any, handleKeyboardNav)
    return () => window.removeEventListener('keyboardNavigation' as any, handleKeyboardNav)
  }, [currentIndex, videos.length, hasMore])

  const handleLike = async (videoId: string) => {
    if (!isAuthenticated) return
    
    const success = await likeVideo(videoId)
    if (success) {
      setVideos(prev => prev.map(video => 
        video.tokenId === videoId 
          ? { 
              ...video, 
              isLiked: !video.isLiked,
              metrics: {
                ...video.metrics,
                likes: video.isLiked ? video.metrics.likes - 1 : video.metrics.likes + 1
              }
            }
          : video
      ))
    }
  }

  const handleShare = async (video: ExploreVideo, platform: 'twitter' | 'instagram') => {
    await shareVideo(video.tokenId, platform)
    setVideos(prev => prev.map(v => 
      v.tokenId === video.tokenId 
        ? { ...v, metrics: { ...v.metrics, shares: v.metrics.shares + 1 }}
        : v
    ))
  }

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No videos available</h2>
          <p className="text-gray-400">Check back later for new content!</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden touch-pan-y select-none"
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'pan-y'
      }}
    >
      {videos.map((video, index) => (
        <div
          key={video.tokenId}
          className={`absolute inset-0 transition-transform duration-300 ease-out video-item ${
            index === currentIndex ? 'translate-y-0' : 
            index < currentIndex ? '-translate-y-full' : 'translate-y-full'
          }`}
        >
          <VideoPlayer
            video={video}
            isActive={index === currentIndex}
            isVisible={Math.abs(index - currentIndex) <= 1}
          />
          
          <VideoOverlay
            video={video}
            isAuthenticated={isAuthenticated}
            onLike={() => handleLike(video.tokenId)}
            onShare={handleShare}
            onDetails={() => onVideoDetails(video)}
          />
        </div>
      ))}
      
      {/* Loading indicator for infinite scroll */}
      {loading && videos.length > 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}
      
      {/* Video indicator dots */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        {videos.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, relativeIndex) => {
          const actualIndex = Math.max(0, currentIndex - 2) + relativeIndex
          return (
            <div
              key={actualIndex}
              className={`w-1 h-6 rounded-full transition-all duration-200 ${
                actualIndex === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}