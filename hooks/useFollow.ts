import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { toast } from 'sonner'

interface UseFollowReturn {
  followers: number
  following: number
  isFollowing: boolean
  loading: boolean
  followUser: () => Promise<void>
  unfollowUser: () => Promise<void>
  refetch: () => Promise<void>
}

export function useFollow(profileIdentifier: string): UseFollowReturn {
  const { walletAddress } = useAuth()
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchFollowData = useCallback(async () => {
    if (!profileIdentifier) return

    setLoading(true)
    try {
      const currentUser = walletAddress || ''
      const response = await fetch(`/api/profile/${profileIdentifier}/follows?currentUser=${currentUser}`)
      const data = await response.json()

      if (data.success) {
        setFollowers(data.data.followers)
        setFollowing(data.data.following)
        setIsFollowing(data.data.isFollowing)
      }
    } catch (error) {
      console.error('Error fetching follow data:', error)
    } finally {
      setLoading(false)
    }
  }, [profileIdentifier, walletAddress])

  const followUser = useCallback(async () => {
    if (!walletAddress || !profileIdentifier) {
      toast.error('Wallet not connected')
      return
    }

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({
          followingAddress: profileIdentifier
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsFollowing(true)
        setFollowers(prev => prev + 1)
        toast.success('Successfully followed user!')
      } else {
        throw new Error(data.error || 'Failed to follow user')
      }
    } catch (error: any) {
      console.error('Failed to follow user:', error)
      toast.error(error.message || 'Failed to follow user')
    }
  }, [walletAddress, profileIdentifier])

  const unfollowUser = useCallback(async () => {
    if (!walletAddress || !profileIdentifier) {
      toast.error('Wallet not connected')
      return
    }

    try {
      const response = await fetch('/api/follow', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({
          followingAddress: profileIdentifier
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsFollowing(false)
        setFollowers(prev => Math.max(0, prev - 1))
        toast.success('Successfully unfollowed user!')
      } else {
        throw new Error(data.error || 'Failed to unfollow user')
      }
    } catch (error: any) {
      console.error('Failed to unfollow user:', error)
      toast.error(error.message || 'Failed to unfollow user')
    }
  }, [walletAddress, profileIdentifier])

  const refetch = useCallback(async () => {
    await fetchFollowData()
  }, [fetchFollowData])

  useEffect(() => {
    fetchFollowData()
  }, [fetchFollowData])

  return {
    followers,
    following,
    isFollowing,
    loading,
    followUser,
    unfollowUser,
    refetch
  }
}
