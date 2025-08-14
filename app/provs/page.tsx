"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAuth } from "@campnetwork/origin/react"
import { toast } from "sonner"
// Icons replaced with emojis for compatibility
import { Button } from "@/components/provn/button"
import { Badge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { TipModal } from "@/components/provn/tip-modal"

interface ProvVideo {
  id: string
  title: string
  creator: {
    handle: string
    address: string
    avatar: string
    verified: boolean
    followers: number
    joinedDate: string
  }
  videoUrl: string
  description: string
  tags: string[]
  stats: {
    views: number
    likes: number
    tips: number
  }
  ipnft: {
    id: string
    verified: boolean
    isOriginal: boolean
    parentId?: string
    mintDate: string
    blockscoutUrl: string
  }
  licensing: {
    available: boolean
    price: number
    currency: string
  }
  isPromoted?: boolean
}

// Added performance tracking interfaces
interface VideoCache {
  [key: string]: {
    blob?: Blob
    lastAccessed: number
    preloaded: boolean
  }
}

interface ViewTracker {
  [key: string]: {
    startTime: number
    hasViewed: boolean
  }
}


export default function ProvsPage() {
  const { walletAddress, isAuthenticated } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [provs, setProvs] = useState<ProvVideo[]>([])
  const [likedProvs, setLikedProvs] = useState<Set<string>>(new Set())
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [selectedProv, setSelectedProv] = useState<ProvVideo | null>(null)
  const [showTipModal, setShowTipModal] = useState(false)
  const [selectedTipProv, setSelectedTipProv] = useState<ProvVideo | null>(null)
  const [loading, setLoading] = useState(true)

  // Added performance optimization state
  const [videoCache, setVideoCache] = useState<VideoCache>({})
  const [viewTracker, setViewTracker] = useState<ViewTracker>({})
  const [isScrolling, setIsScrolling] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch videos on component mount
  useEffect(() => {
    const fetchProvs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/minted-content?limit=20')
        if (response.ok) {
          const data = await response.json()
          
          if (data.success && data.content) {
            setProvs(data.content)
          }
        } else {
          // Fallback to mock data if API fails
          console.warn('API failed, using fallback data')
          setProvs([])
        }
      } catch (error) {
        console.error('Failed to fetch provs:', error)
        // Use empty array as fallback
        setProvs([])
      } finally {
        setLoading(false)
      }
    }

    fetchProvs()
  }, [])

  // Load user's like status when provs are loaded
  useEffect(() => {
    if (!isAuthenticated || !walletAddress || provs.length === 0) return

    const loadLikeStatus = async () => {
      try {
        const likePromises = provs.map(async (prov) => {
          const response = await fetch(
            `/api/social/likes?wallet=${walletAddress}&contentId=${prov.id}`
          )
          const data = await response.json()
          return data.success && data.isLiked ? prov.id : null
        })

        const likedIds = await Promise.all(likePromises)
        const validLikedIds = likedIds.filter(id => id !== null) as string[]
        setLikedProvs(new Set(validLikedIds))
      } catch (error) {
        console.error('Failed to load like status:', error)
      }
    }

    loadLikeStatus()
  }, [provs, isAuthenticated, walletAddress])

  // Optimized scroll handler with debouncing
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    setIsScrolling(true)

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 150)

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const videoHeight = container.clientHeight
    const newIndex = Math.round(scrollTop / videoHeight)

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < provs.length) {
      setCurrentIndex(newIndex)
    }
  }, [currentIndex, provs.length])

  // Enhanced video preloading for adjacent videos
  const preloadAdjacentVideos = useCallback(
    async (centerIndex: number) => {
      const indicesToPreload = [centerIndex - 1, centerIndex, centerIndex + 1].filter(
        (index) => index >= 0 && index < provs.length,
      )

      for (const index of indicesToPreload) {
        const prov = provs[index]
        if (!videoCache[prov.id]?.preloaded) {
          try {
            const response = await fetch(prov.videoUrl)
            const blob = await response.blob()

            setVideoCache((prev) => ({
              ...prev,
              [prov.id]: {
                blob,
                lastAccessed: Date.now(),
                preloaded: true,
              },
            }))
          } catch (error) {
            console.warn(`Failed to preload video ${prov.id}:`, error)
          }
        }
      }
    },
    [provs, videoCache],
  )

  // View tracking with 3-second threshold
  const trackVideoView = useCallback(
    (provId: string, isPlaying: boolean) => {
      if (isPlaying) {
        if (!viewTracker[provId]) {
          setViewTracker((prev) => ({
            ...prev,
            [provId]: {
              startTime: Date.now(),
              hasViewed: false,
            },
          }))
        }
      } else {
        const tracker = viewTracker[provId]
        if (tracker && !tracker.hasViewed) {
          const viewDuration = Date.now() - tracker.startTime
          if (viewDuration >= 3000) {
            // 3 seconds threshold
            setViewTracker((prev) => ({
              ...prev,
              [provId]: {
                ...tracker,
                hasViewed: true,
              },
            }))

            // TODO: Send view event to analytics
            console.log(`View tracked for video ${provId} after ${viewDuration}ms`)
          }
        }
      }
    },
    [viewTracker],
  )

  // Enhanced video playback management with performance optimizations
  useEffect(() => {
    const currentProv = provs[currentIndex]
    if (!currentProv) return

    // Preload adjacent videos
    if (!isScrolling) {
      preloadAdjacentVideos(currentIndex)
    }

    // Manage video playback
    Object.entries(videoRefs.current).forEach(([id, video], index) => {
      if (video) {
        const isCurrentVideo = index === currentIndex
        const isAdjacentVideo = Math.abs(index - currentIndex) <= 1

        if (isCurrentVideo) {
          // Play current video and track views
          video.play().catch(() => {})
          trackVideoView(id, true)
        } else {
          // Pause non-current videos and stop view tracking
          video.pause()
          trackVideoView(id, false)

          // Unload videos that are far from current to save memory
          if (Math.abs(index - currentIndex) > 2) {
            video.src = ""
            video.load()
          }
        }

        // Set preload strategy based on proximity
        if (isAdjacentVideo) {
          video.preload = "auto"
        } else {
          video.preload = "none"
        }
      }
    })
  }, [currentIndex, isScrolling, preloadAdjacentVideos, trackVideoView, provs])

  // Intersection Observer for better performance
  useEffect(() => {
    if (!containerRef.current) return

    const options = {
      root: containerRef.current,
      rootMargin: "0px",
      threshold: [0.1, 0.5, 0.9],
    }

    intersectionObserverRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoElement = entry.target.querySelector("video") as HTMLVideoElement
        if (videoElement) {
          const isVisible = entry.intersectionRatio > 0.5

          if (isVisible && !isScrolling) {
            // Ensure video is ready to play
            if (videoElement.readyState >= 2) {
              videoElement.play().catch(() => {})
            }
          }
        }
      })
    }, options)

    // Observe all video containers
    const videoContainers = containerRef.current.querySelectorAll("[data-video-container]")
    videoContainers.forEach((container) => {
      intersectionObserverRef.current?.observe(container)
    })

    return () => {
      intersectionObserverRef.current?.disconnect()
    }
  }, [isScrolling])

  // Memory cleanup for video cache
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const maxAge = 5 * 60 * 1000 // 5 minutes

      setVideoCache((prev) => {
        const cleaned = { ...prev }
        Object.keys(cleaned).forEach((key) => {
          if (now - cleaned[key].lastAccessed > maxAge) {
            delete cleaned[key]
          }
        })
        return cleaned
      })
    }, 60000) // Clean every minute

    return () => clearInterval(cleanupInterval)
  }, [])

  // Set up optimized scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      container.removeEventListener("scroll", handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

  // Memoized visible videos for virtualization
  const visibleVideos = useMemo(() => {
    const buffer = 1 // Show 1 video above and below current
    const start = Math.max(0, currentIndex - buffer)
    const end = Math.min(provs.length, currentIndex + buffer + 1)

    return provs.slice(start, end).map((prov, index) => ({
      ...prov,
      originalIndex: start + index,
    }))
  }, [currentIndex, provs])

  const handleLike = async (provId: string) => {
    if (!isAuthenticated) {
      toast.error('Please connect your wallet to like content')
      return
    }

    try {
      const response = await fetch('/api/social/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          contentId: provId,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setLikedProvs((prev) => {
          const newSet = new Set(prev)
          if (data.action === 'liked') {
            newSet.add(provId)
          } else {
            newSet.delete(provId)
          }
          return newSet
        })

        // Update the prov's like count
        setProvs(prev => prev.map(prov => 
          prov.id === provId 
            ? { ...prov, stats: { ...prov.stats, likes: data.likeCount } }
            : prov
        ))

        toast.success(data.action === 'liked' ? 'Liked!' : 'Unliked!')
      } else {
        toast.error('Failed to like content')
      }
    } catch (error) {
      console.error('Failed to like:', error)
      toast.error('Failed to like content')
    }
  }

  const handleTip = (provId: string) => {
    if (!isAuthenticated) {
      toast.error('Please connect your wallet to send tips')
      return
    }

    const prov = provs.find(p => p.id === provId)
    if (prov) {
      setSelectedTipProv(prov)
      setShowTipModal(true)
    }
  }

  const handleShare = (provId: string) => {
    // TODO: Implement share functionality
    navigator
      .share?.({
        title: `Check out this Prov on Provn`,
        url: `${window.location.origin}/video/${provId}`,
      })
      .catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${window.location.origin}/video/${provId}`)
      })
  }

  const handleShowDetails = (prov: ProvVideo) => {
    setSelectedProv(prov)
    setShowDetailSheet(true)
  }

  const handleGetLicense = (provId: string) => {
    // TODO: Implement license purchase
    console.log("Get license for:", provId)
  }

  const handleReport = (provId: string) => {
    window.location.href = `/disputes/new?target=${provId}`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <>
        <Navigation currentPage="provs" />
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="text-white">Loading Provs...</div>
        </div>
      </>
    )
  }

  if (provs.length === 0) {
    return (
      <>
        <Navigation currentPage="provs" />
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-xl mb-2">No Provs Available</div>
            <div className="text-white/60">Check back later for new content!</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation currentPage="provs" />

      <div className="h-screen bg-black overflow-hidden">
        {/* Full-screen scrollable container */}
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Virtualized rendering - only render visible videos */}
          {provs.map((prov, index) => {
            const isVisible = Math.abs(index - currentIndex) <= 1

            return (
              <div
                key={prov.id}
                className="relative h-screen w-full snap-start flex items-center justify-center"
                data-video-container
                data-video-index={index}
              >
                {isVisible ? (
                  <>
                    {/* Video Background */}
                    <div className="absolute inset-0 bg-gray-900">
                      <video
                        ref={(el) => {
                          videoRefs.current[prov.id] = el
                        }}
                        src={videoCache[prov.id]?.blob ? URL.createObjectURL(videoCache[prov.id].blob!) : prov.videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted
                        playsInline
                        preload={Math.abs(index - currentIndex) <= 1 ? "auto" : "none"}
                        onLoadStart={() => {
                          // Update cache access time
                          if (videoCache[prov.id]) {
                            setVideoCache((prev) => ({
                              ...prev,
                              [prov.id]: {
                                ...prev[prov.id],
                                lastAccessed: Date.now(),
                              },
                            }))
                          }
                        }}
                      />
                    </div>

                    {/* Promoted Badge */}
                    {prov.isPromoted && (
                      <div className="absolute top-4 left-4 z-20">
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          Promoted
                        </Badge>
                      </div>
                    )}

                    {/* Video Info Overlay - Left Side */}
                    <div className="absolute bottom-0 left-0 right-20 p-4 z-10">
                      <div className="space-y-3">
                        {/* Creator Info */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={prov.creator.avatar || "/placeholder.svg"}
                            alt={prov.creator.handle}
                            className="w-10 h-10 rounded-full border-2 border-white/20"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-headline font-semibold">{prov.creator.handle}</span>
                              {prov.creator.verified && (
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div className="text-white/60 text-sm">{prov.creator.address}</div>
                          </div>
                        </div>

                        {/* Title and Description */}
                        <div className="space-y-1">
                          <h3 className="text-white font-headline font-bold text-lg">{prov.title}</h3>
                          <p className="text-white/80 text-sm line-clamp-2">{prov.description}</p>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {prov.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-white/60 text-sm">
                              #{tag}
                            </span>
                          ))}
                          {prov.tags.length > 3 && (
                            <span className="text-white/60 text-sm">+{prov.tags.length - 3} more</span>
                          )}
                        </div>

                        {/* IP Verification */}
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={prov.ipnft.verified ? "default" : "secondary"}
                            className={
                              prov.ipnft.verified
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            }
                          >
                            {prov.ipnft.verified ? "IP Verified" : "Pending"}
                          </Badge>
                          {!prov.ipnft.isOriginal && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-500/20 text-purple-400 border-purple-500/30"
                            >
                              Derivative
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Right Side */}
                    <div className="absolute bottom-20 right-4 z-10 space-y-6">
                      {/* Like Button */}
                      <div className="flex flex-col items-center space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-12 h-12 rounded-full ${
                            likedProvs.has(prov.id)
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                          onClick={() => handleLike(prov.id)}
                        >
                          {likedProvs.has(prov.id) ? "❤️" : "🤍"}
                        </Button>
                        <span className="text-white text-xs font-medium">
                          {formatNumber(prov.stats.likes + (likedProvs.has(prov.id) ? 1 : 0))}
                        </span>
                      </div>

                      {/* Tip Button */}
                      <div className="flex flex-col items-center space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                          onClick={() => handleTip(prov.id)}
                        >
                          💰
                        </Button>
                        <span className="text-white text-xs font-medium">{formatNumber(prov.stats.tips)}</span>
                      </div>

                      {/* View Count */}
                      <div className="flex flex-col items-center space-y-1">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          👁️
                        </div>
                        <span className="text-white text-xs font-medium">{formatNumber(prov.stats.views)}</span>
                      </div>

                      <div className="flex flex-col items-center space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
                          onClick={() => handleShowDetails(prov)}
                        >
                          ℹ️
                        </Button>
                        <span className="text-white text-xs font-medium">Details</span>
                      </div>

                      {/* Share Button */}
                      <div className="flex flex-col items-center space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
                          onClick={() => handleShare(prov.id)}
                        >
                          📤
                        </Button>
                        <span className="text-white text-xs font-medium">Share</span>
                      </div>
                    </div>
                  </>
                ) : (
                  // Placeholder for non-visible videos to maintain scroll position
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="text-white/50 text-sm">Loading...</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex flex-col space-y-1">
            {provs.map((_, index) => (
              <div
                key={index}
                className={`w-1 h-8 rounded-full transition-colors ${
                  index === currentIndex ? "bg-orange-500" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {showDetailSheet && selectedProv && (
          <div className="fixed inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailSheet(false)} />

            {/* Bottom Sheet */}
            <div className="relative w-full bg-provn-surface rounded-t-2xl border-t border-provn-border max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-provn-muted rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-provn-border">
                <h2 className="font-headline text-xl font-bold text-provn-text">{selectedProv.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailSheet(false)}
                  className="w-8 h-8 p-0 text-provn-muted hover:text-provn-text"
                >
                  ❌
                </Button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="p-6 space-y-6">
                  {/* Creator Section */}
                  <div className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold text-provn-text">Creator</h3>
                    <div className="flex items-center space-x-4">
                      <img
                        src={selectedProv.creator.avatar || "/placeholder.svg"}
                        alt={selectedProv.creator.handle}
                        className="w-16 h-16 rounded-full border-2 border-provn-border"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-headline font-semibold text-provn-text">
                            {selectedProv.creator.handle}
                          </span>
                          {selectedProv.creator.verified && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="text-provn-muted text-sm">{selectedProv.creator.address}</div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-provn-muted">
                          <div className="flex items-center space-x-1">
                            👥
                            <span>{formatNumber(selectedProv.creator.followers)} followers</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            📅
                            <span>Joined {formatDate(selectedProv.creator.joinedDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="font-headline text-lg font-semibold text-provn-text">Description</h3>
                    <p className="text-provn-muted leading-relaxed">{selectedProv.description}</p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <h3 className="font-headline text-lg font-semibold text-provn-text">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProv.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-provn-surface-2 text-provn-muted border-provn-border"
                        >
                          #
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* IP Information */}
                  <div className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold text-provn-text">IP Information</h3>
                    <div className="bg-provn-surface-2 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-provn-muted">IpNFT ID</span>
                        <span className="font-mono text-sm text-provn-text">{selectedProv.ipnft.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-provn-muted">Status</span>
                        <Badge
                          variant={selectedProv.ipnft.verified ? "default" : "secondary"}
                          className={
                            selectedProv.ipnft.verified
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }
                        >
                          {selectedProv.ipnft.verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-provn-muted">Type</span>
                        <Badge
                          variant="secondary"
                          className={
                            selectedProv.ipnft.isOriginal
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          }
                        >
                          {selectedProv.ipnft.isOriginal ? "Original" : "Derivative"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-provn-muted">Minted</span>
                        <span className="text-provn-text text-sm">{formatDate(selectedProv.ipnft.mintDate)}</span>
                      </div>
                      {selectedProv.ipnft.parentId && (
                        <div className="flex items-center justify-between">
                          <span className="text-provn-muted">Parent IpNFT</span>
                          <span className="font-mono text-sm text-provn-accent">{selectedProv.ipnft.parentId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Licensing */}
                  {selectedProv.licensing.available && (
                    <div className="space-y-4">
                      <h3 className="font-headline text-lg font-semibold text-provn-text">Licensing</h3>
                      <div className="bg-provn-surface-2 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-provn-muted">Remix License</span>
                          <span className="font-semibold text-provn-text">
                            {selectedProv.licensing.price} {selectedProv.licensing.currency}
                          </span>
                        </div>
                        <p className="text-sm text-provn-muted mb-4">
                          Purchase a license to create derivative works based on this content.
                        </p>
                        <Button
                          onClick={() => handleGetLicense(selectedProv.id)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          🛒
                          Get License ({selectedProv.licensing.price} {selectedProv.licensing.currency})
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold text-provn-text">Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => window.open(selectedProv.ipnft.blockscoutUrl, "_blank")}
                        className="flex items-center justify-center space-x-2"
                      >
                        🔗
                        <span>View on Blockscout</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleReport(selectedProv.id)}
                        className="flex items-center justify-center space-x-2 text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50"
                      >
                        🚩
                        <span>Report</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tip Modal */}
        {selectedTipProv && (
          <TipModal
            isOpen={showTipModal}
            onClose={() => {
              setShowTipModal(false)
              setSelectedTipProv(null)
            }}
            contentId={selectedTipProv.id}
            contentTitle={selectedTipProv.title}
            creatorHandle={selectedTipProv.creator.handle}
            creatorAddress={selectedTipProv.creator.address}
            walletAddress={walletAddress}
          />
        )}
      </div>
    </>
  )
}
