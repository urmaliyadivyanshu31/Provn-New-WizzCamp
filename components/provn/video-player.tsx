"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ProvnVideoPlayerProps {
  src: string
  poster?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
}

export function ProvnVideoPlayer({ src, poster, className, autoPlay = false, muted = false }: ProvnVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(muted)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const togglePlay = () => {
    const video = videoRef.current
    if (!video || hasError) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch((error) => {
        console.error("Error playing video:", error)
        setHasError(true)
        setErrorMessage("Unable to play video")
      })
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || hasError) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    video.currentTime = newTime
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video || hasError) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video || hasError) return

    const newVolume = Number.parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement
    if (!container || hasError) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleMouseMove = () => {
    if (hasError) return
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hasError) return

    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault()
        togglePlay()
        break
      case "m":
        e.preventDefault()
        toggleMute()
        break
      case "f":
        e.preventDefault()
        toggleFullscreen()
        break
      case "ArrowLeft":
        e.preventDefault()
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, currentTime - 10)
        }
        break
      case "ArrowRight":
        e.preventDefault()
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration, currentTime + 10)
        }
        break
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
      setHasError(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleError = (e: Event) => {
      console.error("Video error:", e)
      setIsLoading(false)
      setHasError(true)
      setErrorMessage("Video could not be loaded")
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setHasError(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("canplay", handleCanPlay)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [])

  if (hasError) {
    return (
      <div
        className={cn(
          "relative bg-provn-surface border border-provn-border rounded-xl overflow-hidden flex items-center justify-center min-h-[200px]",
          className,
        )}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-provn-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-provn-muted" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="font-headline text-lg font-semibold text-provn-text mb-2">Video Unavailable</h3>
          <p className="text-provn-muted text-sm">{errorMessage}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "relative bg-provn-surface border border-provn-border rounded-xl overflow-hidden flex items-center justify-center min-h-[200px]",
          className,
        )}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-provn-surface-2 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-provn-accent animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h3 className="font-headline text-lg font-semibold text-provn-text mb-2">Loading Video</h3>
          <p className="text-provn-muted text-sm">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative bg-black rounded-xl overflow-hidden group focus-within:ring-2 focus-within:ring-provn-accent focus-within:ring-offset-2 focus-within:ring-offset-provn-bg",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Video player"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        muted={muted}
        onClick={togglePlay}
        aria-label={`Video: ${formatTime(currentTime)} of ${formatTime(duration)}`}
      />

      {/* Custom Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Play/Pause Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <div className="flex gap-1" aria-hidden="true">
                <div className="w-1.5 h-6 bg-white rounded-sm" />
                <div className="w-1.5 h-6 bg-white rounded-sm" />
              </div>
            ) : (
              <div
                className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
          {/* Progress Bar */}
          <div
            className="h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer mb-3 hover:h-1.5 transition-all focus-within:h-1.5"
            onClick={handleProgressClick}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            tabIndex={0}
          >
            <div
              className="h-full bg-provn-accent rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <div className="flex gap-0.5" aria-hidden="true">
                    <div className="w-1 h-3 bg-white rounded-sm" />
                    <div className="w-1 h-3 bg-white rounded-sm" />
                  </div>
                ) : (
                  <div
                    className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"
                    aria-hidden="true"
                  />
                )}
              </button>

              <span className="text-sm font-medium" aria-live="polite">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                  aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    {isMuted || volume === 0 ? (
                      <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L12.586 10l-1.293-1.293a1 1 0 010-1.414z" />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 5.343a1 1 0 011.414 0A9.972 9.972 0 0118 10a9.972 9.972 0 01-1.929 4.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0016 10c0-1.18-.2-2.308-.571-3.343a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                  aria-label="Volume"
                />
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--provn-accent);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--provn-accent);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
