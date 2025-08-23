"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Check, 
  AlertTriangle, 
  Clock, 
  Lock, 
  Shield,
  Loader2
} from 'lucide-react'
import { useLicenseStatus } from '@/hooks/useLicenseStatus'

interface LicenseStatusBadgeProps {
  tokenId: string
  variant?: 'compact' | 'full'
  showTooltip?: boolean
  className?: string
}

export function LicenseStatusBadge({ 
  tokenId, 
  variant = 'compact', 
  showTooltip = true,
  className = '' 
}: LicenseStatusBadgeProps) {
  const licenseStatus = useLicenseStatus(tokenId)

  if (licenseStatus.loading) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-provn-surface border border-provn-border ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin text-provn-muted" />
        {variant === 'full' && <span className="font-headline">Checking...</span>}
      </div>
    )
  }

  if (licenseStatus.error) {
    return variant === 'full' ? (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20 ${className}`}>
        <AlertTriangle className="w-3 h-3" />
        <span className="font-headline">Error checking license</span>
      </div>
    ) : null
  }

  // No license or access
  if (!licenseStatus.hasAccess) {
    return variant === 'full' ? (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 ${className}`}>
        <Lock className="w-3 h-3" />
        <span className="font-headline">No License</span>
      </div>
    ) : null
  }

  // Expired license
  if (licenseStatus.isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20 ${className}`}
        title={showTooltip ? `License expired on ${licenseStatus.expiryDate?.toLocaleDateString()}` : undefined}
      >
        <Clock className="w-3 h-3" />
        {variant === 'full' && <span className="font-headline">Expired</span>}
        {variant === 'compact' && showTooltip && (
          <span className="sr-only">License expired</span>
        )}
      </motion.div>
    )
  }

  // Expiring soon
  if (licenseStatus.isExpiringSoon) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 ${className}`}
        title={showTooltip ? `License expires in ${licenseStatus.daysUntilExpiry} day${licenseStatus.daysUntilExpiry !== 1 ? 's' : ''}` : undefined}
      >
        <AlertTriangle className="w-3 h-3" />
        {variant === 'full' && (
          <span className="font-headline">
            Expires in {licenseStatus.daysUntilExpiry}d
          </span>
        )}
        {variant === 'compact' && showTooltip && (
          <span className="sr-only">
            License expires in {licenseStatus.daysUntilExpiry} days
          </span>
        )}
      </motion.div>
    )
  }

  // Active license
  if (licenseStatus.hasActiveLicense) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20 ${className}`}
        title={showTooltip ? `Licensed until ${licenseStatus.expiryDate?.toLocaleDateString()}` : undefined}
      >
        <Shield className="w-3 h-3" />
        {variant === 'full' && <span className="font-headline">Licensed</span>}
        {variant === 'compact' && showTooltip && (
          <span className="sr-only">Active license</span>
        )}
      </motion.div>
    )
  }

  return null
}

// Simplified version for use in lists
export function LicenseStatusIndicator({ tokenId, className = '' }: { tokenId: string, className?: string }) {
  const licenseStatus = useLicenseStatus(tokenId)

  if (licenseStatus.loading || !licenseStatus.hasAccess) {
    return null
  }

  if (licenseStatus.isExpired) {
    return <div className={`w-2 h-2 rounded-full bg-red-400 ${className}`} title="License expired" />
  }

  if (licenseStatus.isExpiringSoon) {
    return <div className={`w-2 h-2 rounded-full bg-yellow-400 ${className}`} title="License expiring soon" />
  }

  if (licenseStatus.hasActiveLicense) {
    return <div className={`w-2 h-2 rounded-full bg-green-400 ${className}`} title="Active license" />
  }

  return null
}