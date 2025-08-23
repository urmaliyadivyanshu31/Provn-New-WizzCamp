"use client";

import React, { useRef, useEffect, useState, memo, useCallback } from "react";
import { ExploreVideo } from "@/types/explore";
import { Play, Pause, VolumeX, Volume2 } from "lucide-react";
import { ipfsGateway } from "@/lib/ipfs-gateway";
import { videoBufferManager } from "@/lib/video-buffer";
import { performanceTracker } from "@/lib/performance-metrics";
import { ProvnBrandLoader } from "@/components/common/LoadingStates";

interface VideoPlayerProps {
  video: ExploreVideo;
  isActive: boolean;
  isVisible: boolean;
}

const VideoPlayer = memo(function VideoPlayer({ video, isActive, isVisible }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [posterSrc, setPosterSrc] = useState<string>("");
  const [loadingState, setLoadingState] = useState<'loading' | 'poster' | 'video' | 'ready'>('loading');
  const [isBuffered, setIsBuffered] = useState(false);

  // Auto-play/pause based on active state with better error handling
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Cancel any pending play requests to prevent interruption errors
    const abortController = new AbortController();

    if (isActive && isVisible) {
      // Add a small delay to prevent rapid play/pause cycles
      const timer = setTimeout(() => {
        if (!abortController.signal.aborted && videoElement) {
          videoElement
            .play()
            .then(() => {
              if (!abortController.signal.aborted) {
                setIsPlaying(true);
              }
            })
            .catch((error) => {
              // Only log non-abort errors and avoid spamming console
              if (error.name !== 'AbortError' && !abortController.signal.aborted && error.name !== 'NotSupportedError') {
                console.warn("Auto-play failed:", error.name, error.message);
              }
              setIsPlaying(false);
            });
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        abortController.abort();
      };
    } else {
      videoElement.pause();
      setIsPlaying(false);
      
      return () => {
        abortController.abort();
      };
    }
  }, [isActive, isVisible]);

  // Progressive loading with buffer manager integration
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video.videoUrl) return;

    let isCancelled = false;
    
    const loadProgressively = async () => {
      try {
        setLoadingState('loading');
        
        // Start performance tracking
        const gatewayName = 'ipfs-gateway'; // Will be updated with actual gateway
        performanceTracker.startVideoLoad(video.tokenId, gatewayName);
        
        // Check if video is already buffered
        const bufferedVideo = await videoBufferManager.getBufferedVideo(video);
        if (isCancelled) return;
        
        if (bufferedVideo && bufferedVideo !== videoElement) {
          // Use buffered video element - instant load!
          setIsBuffered(true);
          setVideoSrc(bufferedVideo.src);
          setPosterSrc(bufferedVideo.poster || '');
          setLoadingState('ready');
          
          // Track buffer hit
          performanceTracker.markBufferHit(video.tokenId);
          performanceTracker.markVideoLoaded(video.tokenId);
          performanceTracker.markFirstPlay(video.tokenId);
          
          console.log(`🎯 Using buffered video for ${video.tokenId}`);
          return;
        }

        // Step 1: Load poster first for immediate visual feedback
        if (video.thumbnailUrl) {
          try {
            const posterUrl = await ipfsGateway.getOptimalUrl(video.thumbnailUrl, true);
            if (!isCancelled) {
              setPosterSrc(posterUrl);
              setLoadingState('poster');
              
              // Track poster load time
              performanceTracker.markPosterLoaded(video.tokenId);
              console.log(`📸 Poster loaded for ${video.tokenId}`);
            }
          } catch (error) {
            console.warn('Failed to load poster:', error);
          }
        }

        // Step 2: Load video with optimal gateway
        const videoUrl = await ipfsGateway.getOptimalUrl(video.videoUrl, true);
        if (!isCancelled) {
          setVideoSrc(videoUrl);
          setLoadingState('video');
        }

        // Setup error handler for automatic fallbacks
        const errorHandler = ipfsGateway.createErrorHandler(video.videoUrl);
        const handleError = () => {
          if (!isCancelled) {
            console.warn("Video failed to load, trying fallback gateway...");
            errorHandler(videoElement);
          }
        };

        videoElement.addEventListener("error", handleError);
        
        // Clean up error handler
        return () => {
          videoElement.removeEventListener("error", handleError);
        };

      } catch (error) {
        if (!isCancelled) {
          console.error("Progressive loading failed:", error);
          setVideoSrc(video.videoUrl); // Fallback to original URL
          setLoadingState('video');
        }
      }
    };

    loadProgressively();

    return () => {
      isCancelled = true;
    };
  }, [video.videoUrl, video.tokenId]);

  // Update progress
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateProgress = () => {
      const progress = (videoElement.currentTime / videoElement.duration) * 100;
      setProgress(progress || 0);
    };

    videoElement.addEventListener("timeupdate", updateProgress);
    return () => videoElement.removeEventListener("timeupdate", updateProgress);
  }, []);

  // Handle spacebar toggle for active video
  useEffect(() => {
    if (!isActive) return;

    const handleSpacebarToggle = () => {
      togglePlayPause();
      setShowControls(true);
      setTimeout(() => setShowControls(false), 2000);
    };

    window.addEventListener("videoTogglePlayPause", handleSpacebarToggle);
    return () =>
      window.removeEventListener("videoTogglePlayPause", handleSpacebarToggle);
  }, [isActive, isPlaying]);

  const togglePlayPause = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          // Silently handle play errors (common in rapid interactions)
          if (error.name !== 'AbortError' && error.name !== 'NotSupportedError') {
            console.warn("Manual play failed:", error.name);
          }
          setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  const toggleMute = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = !videoElement.muted;
    setIsMuted(videoElement.muted);
  }, []);

  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    // Don't toggle play/pause if clicking on overlay elements
    if ((e.target as HTMLElement).closest(".video-overlay")) return;
    
    // Don't toggle play/pause if clicking on audio control button
    if ((e.target as HTMLElement).closest(".audio-control")) return;
    
    // Don't toggle if clicking on control buttons
    if ((e.target as HTMLElement).closest("button")) return;

    // Toggle play/pause for any click on the video
    e.preventDefault();
    e.stopPropagation();
    togglePlayPause();
    setShowControls(true);
    setTimeout(() => setShowControls(false), 2000);
  }, [togglePlayPause]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      {/* Video Element with Smart Fitting */}
      <video
        ref={videoRef}
<<<<<<< HEAD
        className="w-fit  max-h-[calc(100vh-100px)] max-w-[390px] object-contain cursor-pointer mt-3 rounded-sm"
        src={videoSrc}
=======
        className="w-full h-full"
        style={{
          // Smart fitting: contain for portrait videos, cover for landscape
          objectFit: 'contain',
          objectPosition: 'center',
          maxHeight: '100vh',
          maxWidth: '100vw',
          cursor: 'pointer',
          // Ensure video is clickable
          pointerEvents: 'auto'
        }}
        src={videoSrc || undefined}
>>>>>>> 214fe1a9f933aea5ed4531b5e10fb5c55d1030f6
        poster={posterSrc || undefined}
        muted={isMuted}
        loop
        playsInline
        preload={isVisible && isActive ? "auto" : "metadata"} // Smart preloading
        crossOrigin="anonymous" // Enable CORS for better IPFS support
        onLoadStart={() => {
          if (loadingState === 'video') {
            console.log(`🎬 Video load started for ${video.tokenId}`);
          }
        }}
        onLoadedData={() => {
          // Set initial muted state and mark as ready
          const videoElement = videoRef.current;
          if (videoElement) {
            videoElement.muted = false; // Start with sound ON
            setIsMuted(false);
            setLoadingState('ready');
            
            // Track video load completion
            performanceTracker.markVideoLoaded(video.tokenId);
            console.log(`✅ Video ready for ${video.tokenId}`);
          }
        }}
        onLoadedMetadata={() => {
          // Adjust fitting based on video aspect ratio
          const videoElement = videoRef.current;
          if (videoElement) {
            const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            const screenAspectRatio = window.innerWidth / window.innerHeight;
            
            // Use contain for videos that don't match screen ratio well
            // Use cover for videos that are close to screen ratio
            if (Math.abs(aspectRatio - screenAspectRatio) > 0.3) {
              videoElement.style.objectFit = 'contain';
            } else {
              videoElement.style.objectFit = 'cover';
            }
          }
        }}
        onCanPlay={() => {
          // Video has enough data to start playing
          performanceTracker.markFirstPlay(video.tokenId);
          console.log(`🚀 Video can play for ${video.tokenId}`);
        }}
        onProgress={() => {
          // Track download progress for better UX
          const videoElement = videoRef.current;
          if (videoElement && videoElement.buffered.length > 0) {
            const buffered = videoElement.buffered.end(0);
            const duration = videoElement.duration;
            if (duration > 0) {
              const bufferPercent = (buffered / duration) * 100;
              if (bufferPercent > 25 && loadingState !== 'ready') {
                setLoadingState('ready'); // Mark as ready when 25% buffered
              }
            }
          }
        }}
      />

      {/* Clickable overlay for play/pause */}
      <div 
        className="absolute inset-0" 
        onClick={handleVideoClick}
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      />

      {/* Video Controls Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {!isPlaying && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="bg-black/50 backdrop-blur-sm rounded-full p-4 hover:bg-black/70 transition-colors pointer-events-auto"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </button>
        )}
      </div>

      {/* Audio Control */}
      <button
        onClick={(e) => toggleMute(e)}
        className="audio-control absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors z-10"
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
          <span>
            IP-NFT #
            {video.tokenId.length > 20
              ? `${video.tokenId.slice(0, 8)}...${video.tokenId.slice(-8)}`
              : video.tokenId}
          </span>
        </div>
      </div>

      {/* Progressive Loading States */}
      {loadingState !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-white text-center">
            {loadingState === 'loading' && (
              <ProvnBrandLoader size="default" message="Connecting to IPFS..." variant="brand" />
            )}
            {loadingState === 'poster' && (
              <ProvnBrandLoader size="default" message="Loading video..." variant="brand" />
            )}
            {loadingState === 'video' && (
              <ProvnBrandLoader size="default" message="Buffering..." variant="brand" />
            )}
            {isBuffered && (
              <div className="absolute top-2 right-2">
                <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                  ⚡ Cached
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fast Gateway Indicator */}
      {/* {loadingState === 'ready' && isBuffered && (
        <div className="absolute top-2 left-2 bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs font-medium">
          ⚡ Instant Load
        </div>
      )} */}
    </div>
  );
});

export { VideoPlayer };
