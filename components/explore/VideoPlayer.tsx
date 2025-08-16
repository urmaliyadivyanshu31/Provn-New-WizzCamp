"use client"

import { useRef, useEffect, useState } from "react"
import { ExploreVideo } from "@/types/explore"
import { Play, Pause, VolumeX, Volume2 } from "lucide-react"

interface VideoPlayerProps {
  video: ExploreVideo
  isActive: boolean
  isVisible: boolean
}

export function VideoPlayer({ video, isActive, isVisible }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(false)

  // Auto-play/pause based on active state
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isActive && isVisible) {
      videoElement.play().then(() => {
        setIsPlaying(true)
      }).catch((error) => {
        console.warn('Auto-play failed:', error)
        setIsPlaying(false)
      })
    } else {
      videoElement.pause()
      setIsPlaying(false)
    }
  }, [isActive, isVisible])

  // Update progress
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const updateProgress = () => {
      const progress = (videoElement.currentTime / videoElement.duration) * 100
      setProgress(progress || 0)
    }

    videoElement.addEventListener('timeupdate', updateProgress)
    return () => videoElement.removeEventListener('timeupdate', updateProgress)
  }, [])

  // Handle spacebar toggle for active video
  useEffect(() => {
    if (!isActive) return

    const handleSpacebarToggle = () => {
      togglePlayPause()
      setShowControls(true)
      setTimeout(() => setShowControls(false), 2000)
    }

    window.addEventListener('videoTogglePlayPause', handleSpacebarToggle)
    return () => window.removeEventListener('videoTogglePlayPause', handleSpacebarToggle)
  }, [isActive, isPlaying])

  const togglePlayPause = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isPlaying) {
      videoElement.pause()
      setIsPlaying(false)
    } else {
      videoElement.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.muted = !videoElement.muted
    setIsMuted(videoElement.muted)
  }

  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't toggle play/pause if clicking on overlay elements
    if ((e.target as HTMLElement).closest('.video-overlay')) return
    
    togglePlayPause()
    setShowControls(true)
    setTimeout(() => setShowControls(false), 2000)
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover cursor-pointer"
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        muted={isMuted}
        loop
        playsInline
        preload={isVisible ? "auto" : "none"}
        onClick={handleVideoClick}
        onLoadedData={() => {
          // Set initial muted state
          const videoElement = videoRef.current
          if (videoElement) {
            videoElement.muted = isMuted
          }
        }}
      />

      {/* Video Controls Overlay */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {!isPlaying && (
          <button
            onClick={togglePlayPause}
            className="bg-black/50 backdrop-blur-sm rounded-full p-4 hover:bg-black/70 transition-colors"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </button>
        )}
      </div>

      {/* Audio Control */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors z-10"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Video Info Watermark */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
        <div className="flex items-center gap-2 text-white text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span>IP-NFT #{video.tokenId}</span>
        </div>
      </div>

      {/* Loading State */}
      {!video.videoUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
    </div>
  )
}