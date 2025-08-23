import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { useOriginLicensing } from './useOriginLicensing'

// Debounce utility
const useDebounce = <T extends any[]>(callback: (...args: T) => void, delay: number) => {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay)
  }, [delay])
}

interface LicenseStatus {
  hasAccess: boolean
  hasActiveLicense: boolean
  isExpired: boolean
  isExpiringSoon: boolean
  expiryDate: Date | null
  daysUntilExpiry: number | null
  loading: boolean
  error: string | null
}

export function useLicenseStatus(tokenId: string): LicenseStatus {
  const { walletAddress, isAuthenticated } = useAuth()
  const { hasAccess, getSubscriptionExpiry } = useOriginLicensing()
  
  const [status, setStatus] = useState<LicenseStatus>({
    hasAccess: false,
    hasActiveLicense: false,
    isExpired: false,
    isExpiringSoon: false,
    expiryDate: null,
    daysUntilExpiry: null,
    loading: true,
    error: null
  })

  // Debounced license check to prevent excessive API calls
  const checkLicenseStatus = useCallback(async () => {
    if (!isAuthenticated || !walletAddress || !tokenId) {
      setStatus(prev => ({
        ...prev,
        hasAccess: false,
        hasActiveLicense: false,
        loading: false
      }))
      return
    }

    // Validate tokenId format before making any API calls
    if (!tokenId || typeof tokenId !== 'string' || !/^\d+$/.test(tokenId.trim())) {
      console.warn('⚠️ Invalid tokenId in useLicenseStatus:', tokenId)
      setStatus(prev => ({
        ...prev,
        hasAccess: false,
        hasActiveLicense: false,
        loading: false,
        error: 'Invalid token ID format'
      }))
      return
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }))

      // Check if user has access to this content
      const userHasAccess = await hasAccess(tokenId, walletAddress)
      
      // Get subscription expiry
      const expiryDate = await getSubscriptionExpiry(tokenId, walletAddress)
      
      const now = new Date()
      const isExpired = expiryDate ? expiryDate <= now : false
      const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
      const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0

      setStatus({
        hasAccess: userHasAccess,
        hasActiveLicense: userHasAccess && !isExpired,
        isExpired: userHasAccess && isExpired,
        isExpiringSoon: userHasAccess && isExpiringSoon,
        expiryDate,
        daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Failed to check license status:', error)
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check license status'
      }))
    }
  }, [tokenId, walletAddress, isAuthenticated, hasAccess, getSubscriptionExpiry])

  const debouncedCheckLicenseStatus = useDebounce(checkLicenseStatus, 1000) // 1 second debounce

  useEffect(() => {
    debouncedCheckLicenseStatus()
  }, [debouncedCheckLicenseStatus])

  return status
}

// Hook for checking multiple tokens at once
export function useBulkLicenseStatus(tokenIds: string[]) {
  const { walletAddress, isAuthenticated } = useAuth()
  const [statusMap, setStatusMap] = useState<Record<string, LicenseStatus>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkBulkLicenseStatus = async () => {
      if (!isAuthenticated || !walletAddress || tokenIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch user's licenses from API for bulk checking
        const response = await fetch(`/api/licenses?purchaser=${walletAddress}&detailed=false`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch licenses')
        }

        const userLicenses = data.licenses || []
        const licenseMap: Record<string, any> = {}

        // Map licenses by token ID
        userLicenses.forEach((license: any) => {
          licenseMap[license.token_id.toString()] = license
        })

        // Build status map for each token
        const newStatusMap: Record<string, LicenseStatus> = {}
        const now = new Date()

        tokenIds.forEach(tokenId => {
          const license = licenseMap[tokenId]
          
          if (!license) {
            newStatusMap[tokenId] = {
              hasAccess: false,
              hasActiveLicense: false,
              isExpired: false,
              isExpiringSoon: false,
              expiryDate: null,
              daysUntilExpiry: null,
              loading: false,
              error: null
            }
            return
          }

          const expiryDate = new Date(license.expires_at)
          const isExpired = expiryDate <= now
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          const isExpiringSoon = !isExpired && daysUntilExpiry <= 7

          newStatusMap[tokenId] = {
            hasAccess: true,
            hasActiveLicense: !isExpired,
            isExpired,
            isExpiringSoon,
            expiryDate,
            daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
            loading: false,
            error: null
          }
        })

        setStatusMap(newStatusMap)

      } catch (error) {
        console.error('Failed to check bulk license status:', error)
        // Set error state for all tokens
        const errorStatusMap: Record<string, LicenseStatus> = {}
        tokenIds.forEach(tokenId => {
          errorStatusMap[tokenId] = {
            hasAccess: false,
            hasActiveLicense: false,
            isExpired: false,
            isExpiringSoon: false,
            expiryDate: null,
            daysUntilExpiry: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to check license status'
          }
        })
        setStatusMap(errorStatusMap)
      } finally {
        setLoading(false)
      }
    }

    checkBulkLicenseStatus()
  }, [tokenIds.join(','), walletAddress, isAuthenticated])

  return {
    statusMap,
    loading,
    getStatus: (tokenId: string) => statusMap[tokenId] || {
      hasAccess: false,
      hasActiveLicense: false,
      isExpired: false,
      isExpiringSoon: false,
      expiryDate: null,
      daysUntilExpiry: null,
      loading: false,
      error: null
    }
  }
}