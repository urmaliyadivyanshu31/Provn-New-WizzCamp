import { useState, useCallback } from 'react'
import { useAuth, useAuthState } from '@campnetwork/origin/react'

interface UserProfile {
  id?: string
  email: string
  firstName: string
  lastName: string
  username: string
  bio: string
  location: string
  website: string
  dateOfBirth: string
  avatar?: string
  solana_public_key?: string
}

interface UseUserProfileReturn {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  isRegistered: boolean
  registerUser: () => Promise<boolean>
  refetch: () => Promise<void>
  getDisplayName: () => string
  getFirstName: () => string
}

export function useUserProfile(): UseUserProfileReturn {
  const { walletAddress: address } = useAuth()
  const { authenticated: isConnected } = useAuthState()
  const [profile] = useState<UserProfile | null>(null)
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const [isRegistered] = useState(false)

  const registerUser = useCallback(async (): Promise<boolean> => {
    // Simplified version - always return false for now
    return false
  }, [])



  const refetch = useCallback(async (): Promise<void> => {
    // Simplified version - no-op for now
  }, [])

  const getDisplayName = useCallback(() => {
    if (!isConnected) return 'Guest'
    
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`
    } else if (profile?.firstName) {
      return profile.firstName
    } else if (profile?.username) {
      return profile.username
    } else if (address) {
      return `${address.slice(0, 8)}...${address.slice(-8)}`
    } else {
      return 'User'
    }
  }, [profile, address, isConnected])

  const getFirstName = useCallback(() => {
    if (!isConnected) return 'Guest'
    
    if (profile?.firstName) {
      return profile.firstName
    } else if (profile?.username) {
      return profile.username
    } else if (address) {
      return `${address.slice(0, 8)}...`
    } else {
      return 'Guest'
    }
  }, [profile, address, isConnected])

  return {
    profile,
    isLoading,
    error,
    isRegistered,
    registerUser,
    refetch,
    getDisplayName,
    getFirstName
  }
}