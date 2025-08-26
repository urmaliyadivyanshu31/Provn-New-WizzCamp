"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoOverlay } from "./VideoOverlay";
import { ExploreVideo } from "@/types/explore";
import { useVideoInteractions } from "@/hooks/useVideoInteractions";
import { useVideoFeed } from "@/hooks/useVideoFeed";
import { trackVideoEvent } from "@/components/analytics/GoogleAnalytics";
import { ProvnBrandLoader } from "@/components/common/LoadingStates";

interface VideoFeedProps {
  onVideoDetails: (video: ExploreVideo) => void;
  isAuthenticated: boolean;
}

export function VideoFeed({
  onVideoDetails,
  isAuthenticated,
}: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
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
    dataSource: "platform",
    userWallet: userWallet || undefined
  });
  
  // Flatten paginated data into single array
  const videos = useMemo(() => {
    return data?.pages?.flatMap(page => page.videos) || [];
  }, [data]);

  const { likeVideo, viewVideo, shareVideo } = useVideoInteractions();

  // Auto-fetch more videos when approaching end
  const loadMoreVideos = useCallback(() => {
    if (hasNextPage && !isFetching) {
      console.log('🔄 Loading more videos...');
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  // Preload more videos when near end
  useEffect(() => {
    if (currentIndex >= videos.length - 3 && hasNextPage && !isFetching) {
      loadMoreVideos();
    }
  }, [currentIndex, videos.length, hasNextPage, isFetching, loadMoreVideos]);

  // Simple scroll handler for TikTok-style navigation
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isScrolling) return;
    e.preventDefault();
    
    const scrollThreshold = 100;
    
    if (Math.abs(e.deltaY) > scrollThreshold) {
      setIsScrolling(true);
      
      if (e.deltaY > 0 && currentIndex < videos.length - 1) {
        // Scroll down - next video
        setCurrentIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        // Scroll up - previous video
        setCurrentIndex(prev => prev - 1);
      }
      
      // Reset scrolling state
      setTimeout(() => setIsScrolling(false), 500);
    }
  }, [currentIndex, videos.length, isScrolling]);

  // Touch/swipe handling for mobile
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isScrolling) return;
    
    touchEndY.current = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY.current;

    // Minimum swipe distance
    if (Math.abs(deltaY) > 80) {
      setIsScrolling(true);
      
      if (deltaY > 0 && currentIndex < videos.length - 1) {
        // Swipe up - next video
        setCurrentIndex(prev => prev + 1);
      } else if (deltaY < 0 && currentIndex > 0) {
        // Swipe down - previous video
        setCurrentIndex(prev => prev - 1);
      }
      
      // Reset scrolling state
      setTimeout(() => setIsScrolling(false), 500);
    }
  };

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) {
        e.preventDefault();
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        // Dispatch spacebar event for video play/pause
        window.dispatchEvent(new CustomEvent('videoTogglePlayPause'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  // Track video views
  useEffect(() => {
    if (videos[currentIndex]) {
      viewVideo(videos[currentIndex].tokenId, true);
    }
  }, [currentIndex, videos, viewVideo]);

  // Video interaction handlers
  const [videoStates, setVideoStates] = useState<Record<string, { isLiked?: boolean; likeCount?: number }>>({});

  const handleLike = async (videoId: string) => {
    if (!isAuthenticated) return;

    const currentVideo = videos.find((v) => v.tokenId === videoId);
    if (!currentVideo) return;

    const currentState = videoStates[videoId] || {};
    const currentIsLiked = currentState.isLiked ?? currentVideo.isLiked;
    const currentLikeCount = currentState.likeCount ?? currentVideo.metrics.likes;

    // Optimistic update
    const newLikeCount = currentIsLiked ? currentLikeCount - 1 : currentLikeCount + 1;
    const newIsLiked = !currentIsLiked;

    setVideoStates(prev => ({
      ...prev,
      [videoId]: {
        isLiked: newIsLiked,
        likeCount: newLikeCount
      }
    }));

    // Track event
    trackVideoEvent(newIsLiked ? 'like' : 'unlike', videoId, {
      like_count: newLikeCount
    });

    // API call
    try {
      const success = await likeVideo(videoId, true);
      if (!success) {
        // Revert on failure
        setVideoStates(prev => ({
          ...prev,
          [videoId]: {
            isLiked: currentIsLiked,
            likeCount: currentLikeCount
          }
        }));
      }
    } catch (error) {
      console.error("Error liking video:", error);
      // Revert on error
      setVideoStates(prev => ({
        ...prev,
        [videoId]: {
          isLiked: currentIsLiked,
          likeCount: currentLikeCount
        }
      }));
    }
  };

  const handleShare = async (video: ExploreVideo, platform: "x" | "instagram") => {
    await shareVideo(video.tokenId, platform, true);
  };

  // Loading states
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Failed to load videos</h2>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  if (isLoading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <ProvnBrandLoader size="lg" message="Loading videos..." variant="brand" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No videos available</h2>
          <p className="text-gray-400">Check back later for new content!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-black"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: "none", // Disable browser touch actions
      }}
    >
      {/* Render current video and adjacent videos for smooth transitions */}
      {[-1, 0, 1].map((offset) => {
        const videoIndex = currentIndex + offset;
        if (videoIndex < 0 || videoIndex >= videos.length) return null;
        
        const video = videos[videoIndex];
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
          <div
            key={`${video.tokenId}-${videoIndex}`}
            className="absolute inset-0"
            style={{
              transform: `translateY(${offset * 100}%)`,
              transition: isScrolling ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
            }}
          >
            <VideoPlayer
              video={updatedVideo}
              isActive={offset === 0}
              isVisible={Math.abs(offset) <= 1}
            />
            <VideoOverlay
              video={updatedVideo}
              isAuthenticated={isAuthenticated}
              onLike={async () => await handleLike(video.tokenId)}
              onShare={handleShare}
              onDetails={() => onVideoDetails(video)}
            />
          </div>
        );
      })}

      {/* Loading indicator */}
      {isFetching && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Loading more...
            </div>
          </div>
        </div>
      )}

      {/* Video counter removed per user request */}
    </div>
  );
}