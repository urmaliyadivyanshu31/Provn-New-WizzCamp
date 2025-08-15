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
      console.log('🔍 useProfile: No identifier provided')
      setProfile(null)
      setError(null)
      return
    }

    console.log('🔍 useProfile: Fetching profile for identifier:', identifier)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profile/${identifier}`)
      const data = await response.json()
      
      console.log('🔍 useProfile: API response:', {
        status: response.status,
        success: data.success,
        profile: data.profile,
        error: data.error
      })

      if (data.success) {
        console.log('✅ useProfile: Profile found:', data.profile)
        setProfile(data.profile)
      } else {
        if (response.status === 404) {
          console.log('❌ useProfile: Profile not found (404)')
          setProfile(null)
          setError(null)
        } else {
          console.log('❌ useProfile: API error:', data.error)
          setError(data.error || 'Failed to fetch profile')
        }
      }
    } catch (err) {
      console.error('❌ useProfile: Network error:', err)
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
