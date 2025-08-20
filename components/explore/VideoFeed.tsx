"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoOverlay } from "./VideoOverlay";
import { ExploreVideo } from "@/types/explore";
import { useVideoInteractions } from "@/hooks/useVideoInteractions";
import { useVideoFeed } from "@/hooks/useVideoFeed";
import { trackVideoEvent } from "@/components/analytics/GoogleAnalytics";
import { Loader2 } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { logger, perf } from "@/lib/logger";
import { rafThrottle, PerformanceCleanup, measureRenderTime } from "@/lib/utils/performance";
import { videoBufferManager } from "@/lib/video-buffer";
import { performanceTracker } from "@/lib/performance-metrics";

interface VideoFeedProps {
  onVideoDetails: (video: ExploreVideo) => void;
  isAuthenticated: boolean;
  dataSource?: "platform" | "blockchain" | "hybrid" | "mock";
}

export function VideoFeed({
  onVideoDetails,
  isAuthenticated,
  dataSource = "platform",
}: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [renderBuffer] = useState(5); // Increased render buffer for smoother experience
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'both'>('both');
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const cleanupRef = useRef(new PerformanceCleanup());
  const lastScrollTime = useRef(0);
  const scrollVelocity = useRef(0);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.cleanup();
      videoBufferManager.clearBuffer(); // Clean up video buffer
    };
  }, []);
  
  // Get user wallet from localStorage for personalized content
  const userWallet = typeof window !== 'undefined' ? localStorage.getItem('userWallet') : null;
  
  // Use React Query for data fetching with caching
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    error
  } = useVideoFeed({
    dataSource,
    userWallet: userWallet || undefined
  });
  
  // Flatten paginated data into single array
  const videos = useMemo(() => {
    return data?.pages?.flatMap(page => page.videos) || [];
  }, [data]);

  // Aggressive preloading when videos change or current index changes
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= 0) {
      // Preload videos around current position
      videoBufferManager.preloadVideosAroundPosition(
        videos, 
        currentIndex, 
        scrollDirection
      ).catch(error => {
        console.warn('Video preloading failed:', error);
      });
    }
  }, [videos, currentIndex, scrollDirection]);

  const { likeVideo, viewVideo, shareVideo } = useVideoInteractions();

  // Memoize video interactions to prevent unnecessary re-renders
  const memoizedInteractions = useMemo(() => ({
    likeVideo,
    viewVideo, 
    shareVideo
  }), [likeVideo, viewVideo, shareVideo]);

  // Memoize expensive calculations
  const visibleVideoRange = useMemo(() => {
    const start = Math.max(0, currentIndex - renderBuffer);
    const end = Math.min(videos.length, currentIndex + renderBuffer + 1);
    return { start, end };
  }, [currentIndex, renderBuffer, videos.length]);

  // Memoize video slicing for better performance
  const visibleVideos = useMemo(() => {
    return videos.slice(visibleVideoRange.start, visibleVideoRange.end);
  }, [videos, visibleVideoRange.start, visibleVideoRange.end]);

  // Auto-fetch next page when approaching end
  const loadMoreVideos = useCallback(() => {
    if (hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  // Optimized scroll handler with momentum detection and performance tracking
  const handleScrollThrottled = useCallback(
    rafThrottle((e: React.WheelEvent) => {
      const scrollStartTime = performance.now();
      e.preventDefault();
      
      // Only handle scroll if not already scrolling
      if (isScrolling) return;
      
      const now = Date.now();
      const timeDelta = now - lastScrollTime.current;
      lastScrollTime.current = now;
      
      // Calculate scroll velocity for momentum detection
      const currentVelocity = Math.abs(e.deltaY) / Math.max(timeDelta, 1);
      scrollVelocity.current = currentVelocity;
      
      // More conservative scroll sensitivity with velocity consideration
      let scrollSensitivity = 400; // Base sensitivity (higher = less sensitive)
      
      // Reduce sensitivity for high velocity scrolls (prevent accidental skips)
      if (currentVelocity > 2) {
        scrollSensitivity = 600;
      }
      
      const scrollDelta = e.deltaY / scrollSensitivity;
      const newProgress = Math.max(-1, Math.min(1, scrollProgress + scrollDelta));
      
      // Update scroll direction for preloading optimization
      if (scrollDelta > 0.1) {
        setScrollDirection('down');
      } else if (scrollDelta < -0.1) {
        setScrollDirection('up');
      }
      
      setScrollProgress(newProgress);
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Higher threshold for video change - requires more intentional scrolling
      const changeThreshold = currentVelocity > 3 ? 0.6 : 0.85; // Lower threshold for fast scrolls
      
      if (Math.abs(newProgress) >= changeThreshold) {
        setIsScrolling(true);
        
        if (newProgress > 0 && currentIndex < videos.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          // Load more videos when near the end
          if (currentIndex >= videos.length - 5) {
            loadMoreVideos();
          }
        } else if (newProgress < 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
        
        // Force close any open modals when navigating
        window.dispatchEvent(new CustomEvent('forceCloseModals'));
        
        // Reset scroll progress after transition with adaptive timing
        const resetDelay = currentVelocity > 3 ? 200 : 400; // Faster reset for intentional scrolls
        const timeoutId = setTimeout(() => {
          setScrollProgress(0);
          setIsScrolling(false);
        }, resetDelay);
        cleanupRef.current.addTimeoutCleanup(timeoutId);
      } else {
        // Reset scroll progress with shorter delay for better responsiveness
        const timeoutId = setTimeout(() => {
          setScrollProgress(0);
        }, 200);
        scrollTimeoutRef.current = timeoutId;
        cleanupRef.current.addTimeoutCleanup(timeoutId);
      }

      // Track scroll performance
      const scrollProcessTime = performance.now() - scrollStartTime;
      performanceTracker.trackScrollEvent(Math.abs(e.deltaY), scrollProcessTime);
    }),
    [currentIndex, videos.length, isScrolling, scrollProgress, loadMoreVideos]
  );

  const handleScroll = useCallback(handleScrollThrottled, [handleScrollThrottled]);

  // Handle touch gestures for mobile
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndY.current = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY.current;
    const deltaTime = Date.now() - (touchStartY.current ? Date.now() : 0);

    // Require minimum swipe distance and reasonable speed
    if (Math.abs(deltaY) > 50 && deltaTime < 1000) {
      if (deltaY > 0 && currentIndex < videos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        if (currentIndex >= videos.length - 3) {
          loadMoreVideos();
        }
      } else if (deltaY < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      
      // Force close any open modals when navigating via touch
      window.dispatchEvent(new CustomEvent('forceCloseModals'));
    }
  };

  // Track view when video becomes current
  useEffect(() => {
    if (videos[currentIndex]) {
      // Since explore feed uses platform videos, pass isPlatformVideo=true
      viewVideo(videos[currentIndex].tokenId, true);
    }
  }, [currentIndex, videos, viewVideo]);

  // Handle keyboard navigation with proper cleanup
  useEffect(() => {
    const handleKeyboardNav = (e: CustomEvent) => {
      const direction = e.detail.direction;
      if (direction === "down" && currentIndex < videos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        if (currentIndex >= videos.length - 3) {
          loadMoreVideos();
        }
      } else if (direction === "up" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      
      // Force close any open modals when navigating via keyboard
      window.dispatchEvent(new CustomEvent('forceCloseModals'));
    };

    cleanupRef.current.addEventListenerCleanup(
      window,
      "keyboardNavigation" as any,
      handleKeyboardNav as EventListener
    );
  }, [currentIndex, videos.length, hasNextPage]);

  const [videoStates, setVideoStates] = useState<Record<string, { isLiked?: boolean; likeCount?: number }>>({});

  const handleLike = async (videoId: string) => {
    if (!isAuthenticated) return;

    // Find the current video to get its current state
    const currentVideo = videos.find((v) => v.tokenId === videoId);
    if (!currentVideo) return;

    // Get current state (with local updates if any)
    const currentState = videoStates[videoId] || {};
    const currentIsLiked = currentState.isLiked ?? currentVideo.isLiked;
    const currentLikeCount = currentState.likeCount ?? currentVideo.metrics.likes;

    // Optimistic update - immediately update the UI
    const newLikeCount = currentIsLiked ? currentLikeCount - 1 : currentLikeCount + 1;
    const newIsLiked = !currentIsLiked;

    // Update local state immediately for responsive UI
    setVideoStates(prev => ({
      ...prev,
      [videoId]: {
        isLiked: newIsLiked,
        likeCount: newLikeCount
      }
    }));

    // Track like event
    trackVideoEvent(newIsLiked ? 'like' : 'unlike', videoId, {
      like_count: newLikeCount
    });

    // Make the API call in the background
    try {
      const success = await likeVideo(videoId, true);
      if (!success) {
        logger.warn("Failed to like video", { videoId });
        // Revert optimistic update
        setVideoStates(prev => ({
          ...prev,
          [videoId]: {
            isLiked: currentIsLiked,
            likeCount: currentLikeCount
          }
        }));
        
        // Track failed like
        trackVideoEvent('like_failed', videoId);
      }
    } catch (error) {
      logger.error("Error liking video", { videoId, error });
      // Revert optimistic update
      setVideoStates(prev => ({
        ...prev,
        [videoId]: {
          isLiked: currentIsLiked,
          likeCount: currentLikeCount
        }
      }));
      
      // Track error
      trackVideoEvent('like_error', videoId);
    }
  };

  const handleShare = async (
    video: ExploreVideo,
    platform: "twitter" | "instagram"
  ) => {
    // Since explore feed uses platform videos, pass isPlatformVideo=true
    await shareVideo(video.tokenId, platform, true);
    // TODO: Implement optimistic updates for shares with React Query mutations
  };

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 font-headline">Failed to load videos</h2>
          <p className="text-gray-400 font-headline">Please try again later</p>
        </div>
      </div>
    );
  }

  if (isLoading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 font-headline">No provs available</h2>
          <p className="text-gray-400 font-headline">Check back later for new content!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden select-none"
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        touchAction: "none", // Disable browser touch actions for custom handling
      }}
    >
      {visibleVideos.map((video, relativeIndex) => {
        const actualIndex = visibleVideoRange.start + relativeIndex;
        const isVisible = Math.abs(actualIndex - currentIndex) <= 1;
        
        // Apply local state updates to video
        const videoState = videoStates[video.tokenId] || {};
        const updatedVideo = {
          ...video,
          isLiked: videoState.isLiked ?? video.isLiked,
          metrics: {
            ...video.metrics,
            likes: videoState.likeCount ?? video.metrics.likes
          }
        };

        return (
          <MemoizedVirtualVideoItem
            key={`${video.tokenId}-${actualIndex}`}
            video={updatedVideo}
            index={actualIndex}
            currentIndex={currentIndex}
            isAuthenticated={isAuthenticated}
            isVisible={isVisible}
            scrollProgress={scrollProgress}
            onLike={async () => await handleLike(video.tokenId)}
            onShare={handleShare}
            onDetails={() => onVideoDetails(video)}
          />
        );
      })}

      {/* Loading indicator for infinite scroll */}
      {isFetching && videos.length > 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}

      {/* Video indicator dots */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        {videos
          .slice(Math.max(0, currentIndex - 2), currentIndex + 3)
          .map((_, relativeIndex) => {
            const actualIndex = Math.max(0, currentIndex - 2) + relativeIndex;
            return (
              <div
                key={actualIndex}
                className={`w-1 h-6 rounded-full transition-all duration-200 ${
                  actualIndex === currentIndex ? "bg-white" : "bg-white/30"
                }`}
              />
            );
          })}
      </div>
    </div>
  );
}

// Highly optimized virtual video item component
const MemoizedVirtualVideoItem = React.memo(({
  video,
  index,
  currentIndex,
  isAuthenticated,
  isVisible,
  scrollProgress,
  onLike,
  onShare,
  onDetails
}: {
  video: ExploreVideo;
  index: number;
  currentIndex: number;
  isAuthenticated: boolean;
  isVisible: boolean;
  scrollProgress?: number;
  onLike: () => Promise<void>;
  onShare: (video: ExploreVideo, platform: "twitter" | "instagram") => void;
  onDetails: () => void;
}) => {
  // Performance measurement
  const renderTimer = useMemo(() => measureRenderTime(`VideoItem-${video.tokenId}`), [video.tokenId]);
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '50px'
  });

  // Memoized transform calculation for better performance
  const transform = useMemo(() => {
    const progress = scrollProgress || 0;
    // Apply easing to make scroll feel less sensitive
    const easedProgress = progress * Math.abs(progress); // Quadratic easing
    
    if (index === currentIndex) {
      // Current video moves based on scroll progress
      return `translateY(${-easedProgress * 80}%)`; // Reduced from 100% to 80%
    } else if (index === currentIndex - 1) {
      // Previous video
      return `translateY(${-100 + (-easedProgress * 80)}%)`;
    } else if (index === currentIndex + 1) {
      // Next video
      return `translateY(${100 + (-easedProgress * 80)}%)`;
    } else if (index < currentIndex) {
      return 'translateY(-100%)';
    } else {
      return 'translateY(100%)';
    }
  }, [index, currentIndex, scrollProgress]);

  // Memoized transition property
  const transition = useMemo(() => {
    return Math.abs(scrollProgress || 0) < 0.1 
      ? 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
      : 'none';
  }, [scrollProgress]);

  // End performance measurement
  useEffect(() => {
    renderTimer.end();
  }, [renderTimer]);

  return (
    <div
      ref={elementRef}
      className="absolute inset-0 video-item"
      style={{
        transform,
        transition,
      }}
    >
      {(isVisible || isIntersecting) && (
        <>
          <VideoPlayer
            video={video}
            isActive={index === currentIndex}
            isVisible={isVisible}
          />
          <VideoOverlay
            video={video}
            isAuthenticated={isAuthenticated}
            onLike={onLike}
            onShare={onShare}
            onDetails={onDetails}
          />
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.video.tokenId === nextProps.video.tokenId &&
    prevProps.index === nextProps.index &&
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.isAuthenticated === nextProps.isAuthenticated &&
    prevProps.isVisible === nextProps.isVisible &&
    Math.abs((prevProps.scrollProgress || 0) - (nextProps.scrollProgress || 0)) < 0.01 &&
    prevProps.video.metrics.likes === nextProps.video.metrics.likes &&
    prevProps.video.isLiked === nextProps.video.isLiked
  );
});

MemoizedVirtualVideoItem.displayName = 'MemoizedVirtualVideoItem';
