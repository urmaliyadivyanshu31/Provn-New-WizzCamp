import { useState, useEffect, useCallback } from 'react'
import { Profile } from '@/lib/supabase'

interface UseProfileReturn {
  profile: Profile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createProfile: (data: any) => Promise<boolean>
}

export function useProfile(identifier?: string): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!identifier) {
      setProfile(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profile/${identifier}`)
      const data = await response.json()

      if (data.success) {
        setProfile(data.profile)
      } else {
        if (response.status === 404) {
          setProfile(null)
          setError(null)
        } else {
          setError(data.error || 'Failed to fetch profile')
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [identifier])

  const createProfile = useCallback(async (profileData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': profileData.walletAddress
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (data.success) {
        // Invalidate and refetch
        await fetchProfile()
        return true
      } else {
        throw new Error(data.error || 'Failed to create profile')
      }
    } catch (err) {
      console.error('Error creating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to create profile')
      return false
    }
  }, [fetchProfile])

  const refetch = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    refetch,
    createProfile
  }
}
