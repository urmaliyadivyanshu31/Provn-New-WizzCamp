"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoOverlay } from "./VideoOverlay";
import { ExploreVideo } from "@/types/explore";
import { useVideoInteractions } from "@/hooks/useVideoInteractions";
import { Loader2 } from "lucide-react";

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
  // Fake video data for development/demo
  const [videos, setVideos] = useState<ExploreVideo[]>([
    {
      tokenId: "1",
      title: "Exploring the Mountains",
      description: "A breathtaking journey through the Alps.",
      tags: ["travel", "nature", "mountains"],
      videoUrl:
        "https://gateway.pinata.cloud/ipfs/Qmd3iMSFz3GKfT25YRihEpYzpcakjmJTim8YnbT8sXtM5f",

      thumbnailUrl: "https://source.unsplash.com/400x700/?mountain",
      creator: {
        handle: "mountain_lover",
        displayName: "Alice Peaks",
        avatarUrl: "https://randomuser.me/api/portraits/women/1.jpg",
        walletAddress: "0x1234567890abcdef",
        followers: 1200,
        joinedDate: "2022-01-15",
      },
      ipInfo: {
        ipnftId: "ipnft-001",
        status: "verified",
        type: "original",
        mintDate: "2023-06-01",
        platformOrigin: true,
      },
      licensing: {
        price: 10,
        duration: 30,
        royalty: 5,
        paymentToken: "wCAMP",
      },
      metrics: {
        views: 1500,
        likes: 230,
        tips: 12,
        shares: 18,
      },
      isLiked: false,
      hasAccess: true,
    },
    {
      tokenId: "2",
      title: "City Lights Timelapse",
      description: "A mesmerizing timelapse of city nightlife.",
      tags: ["city", "timelapse", "night"],
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      thumbnailUrl: "https://source.unsplash.com/400x700/?city,night",
      creator: {
        handle: "urban_vibes",
        displayName: "Bob Urban",
        avatarUrl: "https://randomuser.me/api/portraits/men/2.jpg",
        walletAddress: "0xabcdef1234567890",
        followers: 980,
        joinedDate: "2021-11-20",
      },
      ipInfo: {
        ipnftId: "ipnft-002",
        status: "pending",
        type: "derivative",
        mintDate: "2023-07-10",
        parentId: "ipnft-001",
        platformOrigin: false,
      },
      licensing: {
        price: 8,
        duration: 15,
        royalty: 3,
        paymentToken: "wCAMP",
      },
      metrics: {
        views: 900,
        likes: 110,
        tips: 5,
        shares: 7,
      },
      isLiked: true,
      hasAccess: false,
    },
    {
      tokenId: "3",
      title: "Surfing the Waves",
      description: "Catch the best waves with pro surfers.",
      tags: ["surfing", "ocean", "sports"],
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      thumbnailUrl: "https://source.unsplash.com/400x700/?surfing",
      creator: {
        handle: "wave_rider",
        displayName: "Charlie Surf",
        avatarUrl: "https://randomuser.me/api/portraits/men/3.jpg",
        walletAddress: "0x9876543210fedcba",
        followers: 2100,
        joinedDate: "2020-05-10",
      },
      ipInfo: {
        ipnftId: "ipnft-003",
        status: "verified",
        type: "original",
        mintDate: "2023-08-15",
        platformOrigin: true,
      },
      licensing: {
        price: 12,
        duration: 45,
        royalty: 7,
        paymentToken: "wCAMP",
      },
      metrics: {
        views: 2000,
        likes: 340,
        tips: 20,
        shares: 25,
      },
      isLiked: false,
      hasAccess: true,
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const { likeVideo, viewVideo, shareVideo } = useVideoInteractions();

  useEffect(() => {
    fetchVideos(0, dataSource);
  }, [dataSource]);

  const fetchVideos = async (page: number = 0, source: string = dataSource) => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        source,
      });

      const userWallet = localStorage.getItem("userWallet");
      if (userWallet) {
        params.append("userWallet", userWallet);
      }

      const response = await fetch(`/api/explore/feed?${params}`);
      const data = await response.json();

      if (data.success) {
        if (page === 0) {
          setVideos(data.videos);
        } else {
          setVideos((prev) => [...prev, ...data.videos]);
        }
        setHasMore(data.hasMore);

        console.log(
          "📺 VideoFeed: Loaded videos from",
          data.source || "unknown",
          {
            count: data.videos.length,
            page,
            hasMore: data.hasMore,
          }
        );
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll/swipe navigation
  const handleScroll = useCallback(
    (e: React.WheelEvent) => {
      if (isScrolling) return;

      setIsScrolling(true);

      const delta = e.deltaY;
      if (delta > 50 && currentIndex < videos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        // Load more videos when near the end
        if (currentIndex >= videos.length - 3 && hasMore) {
          fetchVideos(Math.floor(videos.length / 10), dataSource);
        }
      } else if (delta < -50 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }

      setTimeout(() => setIsScrolling(false), 500);
    },
    [currentIndex, videos.length, hasMore, isScrolling]
  );

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
        if (currentIndex >= videos.length - 3 && hasMore) {
          fetchVideos(Math.floor(videos.length / 10), dataSource);
        }
      } else if (deltaY < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  // Track view when video becomes current
  useEffect(() => {
    if (videos[currentIndex]) {
      // Since explore feed uses platform videos, pass isPlatformVideo=true
      viewVideo(videos[currentIndex].tokenId, true);
    }
  }, [currentIndex, videos, viewVideo]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyboardNav = (e: CustomEvent) => {
      const direction = e.detail.direction;
      if (direction === "down" && currentIndex < videos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        if (currentIndex >= videos.length - 3 && hasMore) {
          fetchVideos(Math.floor(videos.length / 10), dataSource);
        }
      } else if (direction === "up" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    };

    window.addEventListener("keyboardNavigation" as any, handleKeyboardNav);
    return () =>
      window.removeEventListener(
        "keyboardNavigation" as any,
        handleKeyboardNav
      );
  }, [currentIndex, videos.length, hasMore]);

  const handleLike = async (videoId: string) => {
    if (!isAuthenticated) return;

    // Find the current video to get its current state
    const currentVideo = videos.find((v) => v.tokenId === videoId);
    if (!currentVideo) return;

    // Optimistic update - immediately update the UI
    const newLikeCount = currentVideo.isLiked
      ? currentVideo.metrics.likes - 1
      : currentVideo.metrics.likes + 1;
    const newIsLiked = !currentVideo.isLiked;

    setVideos((prev) =>
      prev.map((video) =>
        video.tokenId === videoId
          ? {
              ...video,
              isLiked: newIsLiked,
              metrics: {
                ...video.metrics,
                likes: newLikeCount,
              },
            }
          : video
      )
    );

    // Make the API call in the background
    try {
      const success = await likeVideo(videoId, true);
      if (!success) {
        // Revert the optimistic update if the API call failed
        setVideos((prev) =>
          prev.map((video) =>
            video.tokenId === videoId
              ? {
                  ...video,
                  isLiked: currentVideo.isLiked,
                  metrics: {
                    ...video.metrics,
                    likes: currentVideo.metrics.likes,
                  },
                }
              : video
          )
        );
        // You could show a toast error here
        console.error("Failed to like video, reverting UI update");
      }
    } catch (error) {
      // Revert the optimistic update if there's an error
      setVideos((prev) =>
        prev.map((video) =>
          video.tokenId === videoId
            ? {
                ...video,
                isLiked: currentVideo.isLiked,
                metrics: {
                  ...video.metrics,
                  likes: currentVideo.metrics.likes,
                },
              }
            : video
        )
      );
      console.error("Error liking video:", error);
    }
  };

  const handleShare = async (
    video: ExploreVideo,
    platform: "twitter" | "instagram"
  ) => {
    // Since explore feed uses platform videos, pass isPlatformVideo=true
    await shareVideo(video.tokenId, platform, true);
    setVideos((prev) =>
      prev.map((v) =>
        v.tokenId === video.tokenId
          ? { ...v, metrics: { ...v.metrics, shares: v.metrics.shares + 1 } }
          : v
      )
    );
  };

  if (loading && videos.length === 0) {
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
          <h2 className="text-2xl font-bold mb-2">No videos available</h2>
          <p className="text-gray-400">Check back later for new content!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden touch-pan-y select-none"
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        touchAction: "pan-y",
      }}
    >
      {videos.map((video, index) => (
        <div
          key={video.tokenId}
          className={`absolute inset-0 transition-transform duration-300 ease-out video-item ${
            index === currentIndex
              ? "translate-y-0"
              : index < currentIndex
              ? "-translate-y-full"
              : "translate-y-full"
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
