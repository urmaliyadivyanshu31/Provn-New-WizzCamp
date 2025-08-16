import { useState } from 'react'
import { useAuth } from '@campnetwork/origin/react'

export function useVideoInteractions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, walletAddress } = useAuth()

  const likeVideo = async (videoId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please connect your wallet first')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!
        }
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to like video')
      }

      return true
    } catch (err) {
      console.error('Failed to like video:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to like video'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const viewVideo = async (videoId: string): Promise<boolean> => {
    try {
      // Track view (doesn't require authentication)
      const response = await fetch(`/api/videos/${videoId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          viewerAddress: walletAddress || null,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()
      return data.success
    } catch (err) {
      console.error('Failed to track view:', err)
      return false
    }
  }

  const shareVideo = async (videoId: string, platform: 'twitter' | 'instagram'): Promise<boolean> => {
    try {
      // Track share
      const response = await fetch(`/api/videos/${videoId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform,
          sharerAddress: walletAddress || null,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()
      return data.success
    } catch (err) {
      console.error('Failed to track share:', err)
      return false
    }
  }

  const getVideoStats = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/stats`)
      const data = await response.json()
      
      if (data.success) {
        return {
          views: data.stats.views,
          likes: data.stats.likes,
          shares: data.stats.shares,
          tips: data.stats.tips,
          isLiked: data.stats.isLiked
        }
      }
      return null
    } catch (error) {
      console.error('Failed to fetch video stats:', error)
      return null
    }
  }

  const getUserLikedVideos = async (): Promise<string[]> => {
    if (!isAuthenticated || !walletAddress) return []

    try {
      const response = await fetch(`/api/users/${walletAddress}/liked-videos`)
      const data = await response.json()
      
      return data.success ? data.likedVideos : []
    } catch (error) {
      console.error('Failed to fetch liked videos:', error)
      return []
    }
  }

  return {
    likeVideo,
    viewVideo,
    shareVideo,
    getVideoStats,
    getUserLikedVideos,
    loading,
    error,
    clearError: () => setError(null)
  }
}