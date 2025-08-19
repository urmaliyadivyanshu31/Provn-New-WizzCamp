import { useState } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { LicenseTemplate, UserRemixingPreference } from '@/types/remixing'
import { toast } from 'sonner'

export function useRemixing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { origin, isAuthenticated, walletAddress } = useAuth()

  const getLicenseTemplates = async (): Promise<LicenseTemplate[]> => {
    try {
      const response = await fetch('/api/remixing/templates')
      const data = await response.json()
      
      if (data.success) {
        return data.templates
      } else {
        throw new Error(data.error || 'Failed to fetch templates')
      }
    } catch (err) {
      console.error('Error fetching license templates:', err)
      throw err
    }
  }

  const purchaseLicense = async (
    tokenId: string, 
    licenseType: string, 
    periods: number,
    userPreferences?: Partial<UserRemixingPreference>
  ): Promise<boolean> => {
    if (!isAuthenticated || !origin) {
      setError('Please connect your wallet first')
      return false
    }

    if (periods <= 0) {
      setError('License periods must be greater than 0')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🎫 Purchasing license via Origin SDK:', {
        tokenId,
        licenseType,
        periods,
        userPreferences
      })

      // Use Origin SDK to purchase license
      const success = await origin.buyAccessSmart(BigInt(tokenId), periods)
      
      if (success) {
        // Save user preferences for this purchase
        if (userPreferences) {
          await saveUserPreferences(tokenId, licenseType, userPreferences)
        }

        console.log('✅ License purchased successfully')
        toast.success(`${licenseType} license purchased successfully!`)
        return true
      } else {
        throw new Error('License purchase failed')
      }
    } catch (err) {
      console.error('Failed to purchase license:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase license'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const saveUserPreferences = async (
    tokenId: string,
    licenseType: string,
    preferences: Partial<UserRemixingPreference>
  ) => {
    try {
      const response = await fetch('/api/remixing/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          licenseType,
          ...preferences,
          submittedAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        console.warn('Failed to save user preferences:', await response.text())
      }
    } catch (error) {
      console.warn('Error saving user preferences:', error)
      // Don't throw error - preferences saving is not critical
    }
  }

  const checkLicenseAccess = async (tokenId: string): Promise<boolean> => {
    if (!isAuthenticated || !origin || !walletAddress) {
      return false
    }

    try {
      const hasAccess = await (origin as any).hasAccess(BigInt(tokenId), walletAddress)
      return hasAccess
    } catch (error) {
      console.error('Error checking license access:', error)
      return false
    }
  }

  const getLicenseExpiry = async (tokenId: string): Promise<Date | null> => {
    if (!isAuthenticated || !origin || !walletAddress) {
      return null
    }

    try {
      const expiry = await (origin as any).subscriptionExpiry(BigInt(tokenId), walletAddress)
      return expiry ? new Date(Number(expiry) * 1000) : null
    } catch (error) {
      console.error('Error getting license expiry:', error)
      return null
    }
  }

  const getUserPreferences = async (tokenId: string): Promise<UserRemixingPreference[]> => {
    try {
      const response = await fetch(`/api/remixing/preferences/${tokenId}`)
      const data = await response.json()
      
      return data.success ? data.preferences : []
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return []
    }
  }

  const renewLicense = async (tokenId: string, periods: number): Promise<boolean> => {
    if (!isAuthenticated || !origin || !walletAddress) {
      setError('Please connect your wallet first')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Renewing license via Origin SDK:', { tokenId, periods })
      
      const success = await (origin as any).renewAccess(BigInt(tokenId), periods, walletAddress)
      
      if (success) {
        console.log('✅ License renewed successfully')
        toast.success('License renewed successfully!')
        return true
      } else {
        throw new Error('License renewal failed')
      }
    } catch (err) {
      console.error('Failed to renew license:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to renew license'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getRemixingHistory = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/remixing/history/${tokenId}`)
      const data = await response.json()
      return data.success ? data.history : []
    } catch (error) {
      console.error('Failed to fetch remixing history:', error)
      return []
    }
  }

  return {
    // Main functions
    getLicenseTemplates,
    purchaseLicense,
    renewLicense,
    checkLicenseAccess,
    getLicenseExpiry,
    
    // User preferences
    getUserPreferences,
    saveUserPreferences,
    
    // History and analytics
    getRemixingHistory,
    
    // State
    loading,
    error,
    clearError: () => setError(null)
  }
}