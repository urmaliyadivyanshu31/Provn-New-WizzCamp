import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ExploreVideo } from '@/types/explore';

interface VideoFeedParams {
  dataSource?: "platform" | "blockchain" | "hybrid" | "mock";
  category?: string;
  tag?: string;
  creator?: string;
  sortBy?: 'latest' | 'popular' | 'trending';
  userWallet?: string;
  limit?: number;
}

interface VideoFeedResponse {
  success: boolean;
  videos: ExploreVideo[];
  hasMore: boolean;
  totalCount: number;
  page: number;
  limit: number;
  source: string;
}

export function useVideoFeed(params: VideoFeedParams = {}) {
  const {
    dataSource = 'platform',
    category,
    tag,
    creator,
    sortBy = 'latest',
    userWallet,
    limit = 25
  } = params;

  return useInfiniteQuery({
    queryKey: ['videoFeed', { dataSource, category, tag, creator, sortBy, userWallet }],
    queryFn: async ({ pageParam = 0 }): Promise<VideoFeedResponse> => {
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
        source: dataSource,
        sortBy,
      });

      if (category) searchParams.append('category', category);
      if (tag) searchParams.append('tag', tag);
      if (creator) searchParams.append('creator', creator);
      if (userWallet) searchParams.append('userWallet', userWallet);

      const response = await fetch(`/api/explore/feed?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 0,
    // Advanced caching strategy
    staleTime: 3 * 60 * 1000, // 3 minutes for video feeds
    gcTime: 10 * 60 * 1000,   // 10 minutes in cache
    // Enable optimistic updates for better UX
    placeholderData: (previousData) => previousData,
    // Prefetch next page when we're close to the end
    getPreviousPageParam: (firstPage) => {
      return firstPage.page > 0 ? firstPage.page - 1 : undefined;
    },
  });
}

// Hook for individual video details with prefetching
export function useVideoDetails(tokenId: string, enabled = true) {
  return useQuery({
    queryKey: ['videoDetails', tokenId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${tokenId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch video details: ${response.statusText}`);
      }
      return response.json();
    },
    enabled,
    staleTime: 10 * 60 * 1000, // Video details are more stable
    gcTime: 30 * 60 * 1000,    // Keep longer in cache
  });
}

// Hook for video metrics that update frequently
export function useVideoMetrics(tokenId: string) {
  return useQuery({
    queryKey: ['videoMetrics', tokenId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${tokenId}/metrics`);
      if (!response.ok) {
        throw new Error(`Failed to fetch video metrics: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 30 * 1000,    // Metrics change frequently - 30 seconds
    gcTime: 5 * 60 * 1000,   // 5 minutes in cache
    refetchInterval: 60 * 1000, // Refetch every minute for active videos
    refetchIntervalInBackground: false,
  });
}