"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  ArrowUpDown
} from 'lucide-react'
import { LicenseCard } from './LicenseCard'
import { ProvnButton } from '@/components/provn/button'
import { ProvnBrandLoader } from '@/components/common/LoadingStates'
import { useAuth } from '@campnetwork/origin/react'
import { useOriginLicensing } from '@/hooks/useOriginLicensing'
import { toast } from 'sonner'

interface LicenseManagerProps {
  userAddress?: string
  className?: string
}

type LicenseStatus = 'all' | 'active' | 'expiring_soon' | 'expired'
type SortOption = 'created_desc' | 'created_asc' | 'expiry_desc' | 'expiry_asc'

const STATUS_OPTIONS = [
  { value: 'all' as LicenseStatus, label: 'All Licenses', icon: Package },
  { value: 'active' as LicenseStatus, label: 'Active', icon: CheckCircle },
  { value: 'expiring_soon' as LicenseStatus, label: 'Expiring Soon', icon: AlertTriangle },
  { value: 'expired' as LicenseStatus, label: 'Expired', icon: Clock }
]

const SORT_OPTIONS = [
  { value: 'created_desc' as SortOption, label: 'Newest First' },
  { value: 'created_asc' as SortOption, label: 'Oldest First' },
  { value: 'expiry_desc' as SortOption, label: 'Expires Latest' },
  { value: 'expiry_asc' as SortOption, label: 'Expires Soonest' }
]

export function LicenseManager({ userAddress, className }: LicenseManagerProps) {
  const { walletAddress } = useAuth()
  const { renewAccess, loading: renewLoading } = useOriginLicensing()
  
  const [licenses, setLicenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<LicenseStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('created_desc')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const targetAddress = userAddress || walletAddress

  const fetchLicenses = useCallback(async (
    resetPage = false,
    status: LicenseStatus = statusFilter,
    search = searchQuery,
    sort = sortOption
  ) => {
    if (!targetAddress) return

    try {
      setLoading(resetPage)
      setError(null)

      const currentPage = resetPage ? 0 : page
      const limit = 12
      const offset = currentPage * limit

      // Build query parameters
      const params = new URLSearchParams({
        purchaser: targetAddress,
        detailed: 'true',
        limit: limit.toString(),
        offset: offset.toString()
      })

      if (status !== 'all') {
        params.append('status', status)
      }

      const response = await fetch(`/api/licenses?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch licenses: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch licenses')
      }

      let processedLicenses = data.licenses || []

      // Client-side search filtering
      if (search.trim()) {
        processedLicenses = processedLicenses.filter((license: any) =>
          license.platform_videos?.title?.toLowerCase().includes(search.toLowerCase()) ||
          license.platform_videos?.profiles?.handle?.toLowerCase().includes(search.toLowerCase()) ||
          license.license_type.toLowerCase().includes(search.toLowerCase()) ||
          license.token_id.toString().includes(search)
        )
      }

      // Client-side sorting
      processedLicenses.sort((a: any, b: any) => {
        switch (sort) {
          case 'created_asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'expiry_desc':
            return new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
          case 'expiry_asc':
            return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
          case 'created_desc':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })

      if (resetPage) {
        setLicenses(processedLicenses)
        setPage(1)
      } else {
        setLicenses(prev => [...prev, ...processedLicenses])
        setPage(prev => prev + 1)
      }

      setHasMore(data.pagination?.has_more || false)
      setTotalCount(data.total_count || 0)

    } catch (err) {
      console.error('Failed to fetch licenses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch licenses')
      toast.error('Failed to load licenses')
    } finally {
      setLoading(false)
    }
  }, [targetAddress, statusFilter, searchQuery, sortOption, page])

  // Initial load and refresh when filters change
  useEffect(() => {
    if (targetAddress) {
      setPage(0)
      fetchLicenses(true, statusFilter, searchQuery, sortOption)
    }
  }, [targetAddress, statusFilter, searchQuery, sortOption])

  const handleStatusFilterChange = (status: LicenseStatus) => {
    setStatusFilter(status)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort)
  }

  const handleRenewLicense = async (licenseId: number) => {
    const license = licenses.find(l => l.id === licenseId)
    if (!license) return

    try {
      // This would use the Origin SDK to renew the license
      // For now, we'll show a placeholder implementation
      toast.info('License renewal coming soon! Contact support for manual renewal.')
      
      // Future implementation:
      // await renewAccess(license.token_id.toString(), 1)
      // await fetchLicenses(true) // Refresh the list
      
    } catch (error) {
      console.error('Failed to renew license:', error)
      toast.error('Failed to renew license')
    }
  }

  const handleViewContent = (tokenId: number) => {
    window.location.href = `/video/${tokenId}`
  }

  const handleLoadMore = () => {
    fetchLicenses(false)
  }

  const handleRefresh = () => {
    fetchLicenses(true)
  }

  // Stats calculation
  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.computed?.status === 'active').length,
    expiringSoon: licenses.filter(l => l.computed?.status === 'expiring_soon').length,
    expired: licenses.filter(l => l.computed?.status === 'expired').length
  }

  if (!targetAddress) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Package className="w-12 h-12 text-provn-muted mx-auto mb-4" />
        <p className="text-provn-muted">Connect your wallet to view your licenses</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-provn-text font-headline">
            My Licenses
          </h2>
          <p className="text-provn-muted">
            {totalCount} license{totalCount !== 1 ? 's' : ''} purchased
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ProvnButton
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </ProvnButton>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_OPTIONS.map(option => {
          const count = option.value === 'all' ? stats.total : stats[option.value as keyof typeof stats]
          const Icon = option.icon
          
          return (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStatusFilterChange(option.value)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                statusFilter === option.value
                  ? 'border-provn-accent bg-provn-accent/5'
                  : 'border-provn-border bg-provn-surface hover:border-provn-accent/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${
                  statusFilter === option.value ? 'text-provn-accent' : 'text-provn-muted'
                }`} />
                <span className={`text-sm font-medium font-headline ${
                  statusFilter === option.value ? 'text-provn-accent' : 'text-provn-text'
                }`}>
                  {option.label}
                </span>
              </div>
              <p className={`text-2xl font-bold font-headline ${
                statusFilter === option.value ? 'text-provn-accent' : 'text-provn-text'
              }`}>
                {count}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-provn-muted" />
          <input
            type="text"
            placeholder="Search licenses by content title, creator, or token ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-provn-border rounded-lg bg-provn-surface text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-provn-muted" />
          <select
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="border border-provn-border rounded-lg bg-provn-surface text-provn-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-headline">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && licenses.length === 0 && (
        <div className="py-12">
          <ProvnBrandLoader size="lg" message="Loading your licenses..." variant="brand" />
        </div>
      )}

      {/* Empty State */}
      {!loading && licenses.length === 0 && !error && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-provn-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-provn-text mb-2 font-headline">
            No Licenses Found
          </h3>
          <p className="text-provn-muted mb-4">
            {searchQuery ? 
              "No licenses match your search criteria." :
              statusFilter === 'all' ?
                "You haven't purchased any licenses yet." :
                `No ${statusFilter.replace('_', ' ')} licenses found.`
            }
          </p>
          {statusFilter !== 'all' && (
            <ProvnButton
              variant="secondary"
              onClick={() => setStatusFilter('all')}
            >
              View All Licenses
            </ProvnButton>
          )}
        </div>
      )}

      {/* License Grid */}
      {licenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licenses.map((license, index) => (
            <motion.div
              key={`${license.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <LicenseCard
                license={license}
                onRenew={handleRenewLicense}
                onViewContent={handleViewContent}
                showActions={true}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="text-center pt-6">
          <ProvnButton
            variant="secondary"
            onClick={handleLoadMore}
            disabled={loading}
          >
            <Package className="w-4 h-4 mr-2" />
            Load More Licenses
          </ProvnButton>
        </div>
      )}

      {/* Loading More Indicator */}
      {loading && licenses.length > 0 && (
        <div className="text-center py-4">
          <RefreshCw className="w-4 h-4 animate-spin text-provn-accent mx-auto" />
        </div>
      )}
    </div>
  )
}