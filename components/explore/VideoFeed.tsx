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
  const [renderBuffer] = useState(3); // Number of videos to render around current index
  const [scrollProgress, setScrollProgress] = useState(0); // For smooth scroll animation
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const cleanupRef = useRef(new PerformanceCleanup());
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.cleanup();
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

  const { likeVideo, viewVideo, shareVideo } = useVideoInteractions();

  // Memoize video interactions to prevent unnecessary re-renders
  const memoizedInteractions = useMemo(() => ({
    likeVideo,
    viewVideo, 
    shareVideo
  }), [likeVideo, viewVideo, shareVideo]);

  // Auto-fetch next page when approaching end
  const loadMoreVideos = useCallback(() => {
    if (hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  // RAF-throttled scroll handler for 60fps performance
  const handleScrollThrottled = useCallback(
    rafThrottle((e: React.WheelEvent) => {
      e.preventDefault();
      
      // Only handle scroll if not already scrolling
      if (isScrolling) return;
      
      // More conservative scroll sensitivity
      const scrollDelta = e.deltaY / 300;
      const newProgress = Math.max(-1, Math.min(1, scrollProgress + scrollDelta));
      
      setScrollProgress(newProgress);
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Higher threshold for video change (was 0.5, now 0.8)
      if (Math.abs(newProgress) >= 0.8) {
        setIsScrolling(true);
        
        if (newProgress > 0 && currentIndex < videos.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          // Load more videos when near the end
          if (currentIndex >= videos.length - 3) {
            loadMoreVideos();
          }
        } else if (newProgress < 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
        
        // Force close any open modals when navigating
        window.dispatchEvent(new CustomEvent('forceCloseModals'));
        
        // Reset scroll progress after transition
        const timeoutId = setTimeout(() => {
          setScrollProgress(0);
          setIsScrolling(false);
        }, 400);
        cleanupRef.current.addTimeoutCleanup(timeoutId);
      } else {
        // Reset scroll progress if no action taken after a longer delay
        const timeoutId = setTimeout(() => {
          setScrollProgress(0);
        }, 300);
        scrollTimeoutRef.current = timeoutId;
        cleanupRef.current.addTimeoutCleanup(timeoutId);
      }
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
      {videos
        .slice(Math.max(0, currentIndex - renderBuffer), currentIndex + renderBuffer + 1)
        .map((video, relativeIndex) => {
          const actualIndex = Math.max(0, currentIndex - renderBuffer) + relativeIndex;
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
            <VirtualVideoItem
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

// Memoized virtual video item component for performance
const VirtualVideoItem = React.memo(({
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
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '50px'
  });

  // Calculate smooth transform based on scroll progress with dampening
  const getTransform = () => {
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
  };

  return (
    <div
      ref={elementRef}
      className="absolute inset-0 video-item"
      style={{
        transform: getTransform(),
        transition: Math.abs(scrollProgress || 0) < 0.1 ? 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
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
});

VirtualVideoItem.displayName = 'VirtualVideoItem';
