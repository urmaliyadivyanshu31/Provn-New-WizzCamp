"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle,
  Check,
  Eye,
  Download,
  User,
  DollarSign
} from 'lucide-react'
import { ProvnCard, ProvnCardContent } from '@/components/provn/card'
import { ProvnButton } from '@/components/provn/button'
import { ProvnBadge } from '@/components/provn/badge'
import { LicenseRenewalModal } from './LicenseRenewalModal'
import { toast } from 'sonner'

interface LicenseData {
  id: number
  token_id: number
  license_type: string
  price_paid: number
  periods: number
  duration_seconds: number
  expires_at: string
  transaction_hash: string
  created_at: string
  computed: {
    is_expired: boolean
    is_expiring_soon: boolean
    days_until_expiry: number
    status: 'active' | 'expired' | 'expiring_soon'
  }
  platform_videos?: {
    token_id: number
    title: string
    description: string
    video_url: string
    thumbnail_url: string
    creator_address: string
    profiles: {
      handle: string
      display_name: string
      avatar_url?: string
    }
  }
}

interface LicenseCardProps {
  license: LicenseData
  onRenew?: (licenseId: number) => void
  onViewContent?: (tokenId: number) => void
  showActions?: boolean
}

export function LicenseCard({ 
  license, 
  onRenew, 
  onViewContent,
  showActions = true 
}: LicenseCardProps) {
  const [isRenewing, setIsRenewing] = useState(false)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPROVN = (amount: number | null | undefined) => {
    if (!amount || amount === 0) return "Free"
    return `${amount.toFixed(amount < 1 ? 2 : 1)} PROVN`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'expiring_soon':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'expired':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-provn-surface-2 text-provn-muted'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Check className="w-3 h-3" />
      case 'expiring_soon':
      case 'expired':
        return <AlertTriangle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const handleRenew = async () => {
    setShowRenewalModal(true)
  }

  const handleRenewalSuccess = () => {
    // Refresh the license data if callback provided
    if (onRenew) {
      onRenew(license.id)
    }
    setShowRenewalModal(false)
  }

  const handleViewContent = () => {
    if (onViewContent) {
      onViewContent(license.token_id)
    } else {
      // Fallback to direct navigation
      window.location.href = `/video/${license.token_id}`
    }
  }

  const handleViewTransaction = () => {
    if (license.transaction_hash) {
      window.open(
        `https://basecamp.cloud.blockscout.com/tx/${license.transaction_hash}`,
        '_blank'
      )
    }
  }

  const copyLicenseInfo = async () => {
    const info = `License #${license.id} for Token #${license.token_id}\nType: ${license.license_type}\nExpires: ${formatDate(license.expires_at)}\nTransaction: ${license.transaction_hash}`
    
    try {
      await navigator.clipboard.writeText(info)
      toast.success('License info copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy license info')
    }
  }

  return (
    <ProvnCard className="overflow-hidden hover:shadow-lg transition-shadow">
      <ProvnCardContent className="p-0">
        {/* Header with Content Info */}
        <div className="p-4 border-b border-provn-border">
          <div className="flex items-start gap-3">
            {/* Content Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-provn-surface-2 flex-shrink-0">
              {license.platform_videos?.thumbnail_url ? (
                <img
                  src={license.platform_videos.thumbnail_url}
                  alt={license.platform_videos.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-provn-accent/20 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-provn-accent" />
                </div>
              )}
            </div>

            {/* Content Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-provn-text text-sm truncate font-headline">
                {license.platform_videos?.title || `Content #${license.token_id}`}
              </h3>
              <p className="text-xs text-provn-muted font-headline mb-1">
                Token ID: #{license.token_id}
              </p>
              {license.platform_videos?.profiles && (
                <div className="flex items-center gap-1 text-xs text-provn-muted">
                  <User className="w-3 h-3" />
                  <span>by @{license.platform_videos.profiles.handle}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(license.computed.status)}`}>
              {getStatusIcon(license.computed.status)}
              <span className="capitalize font-headline">
                {license.computed.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* License Details */}
        <div className="p-4 space-y-3">
          {/* License Type and Price */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-provn-text font-headline">
                {license.license_type} License
              </p>
              <p className="text-xs text-provn-muted font-headline">
                {license.periods} period{license.periods !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-provn-accent font-bold">
                <DollarSign className="w-3 h-3" />
                <span className="font-headline">{formatPROVN(license.price_paid)}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-provn-muted font-headline mb-1">Purchased</p>
              <div className="flex items-center gap-1 text-provn-text">
                <Calendar className="w-3 h-3" />
                <span className="font-headline">{formatDate(license.created_at)}</span>
              </div>
            </div>
            <div>
              <p className="text-provn-muted font-headline mb-1">
                {license.computed.is_expired ? 'Expired' : 'Expires'}
              </p>
              <div className={`flex items-center gap-1 ${license.computed.is_expired ? 'text-red-400' : license.computed.is_expiring_soon ? 'text-yellow-400' : 'text-provn-text'}`}>
                <Clock className="w-3 h-3" />
                <span className="font-headline">{formatDate(license.expires_at)}</span>
              </div>
            </div>
          </div>

          {/* Expiry Warning */}
          {license.computed.is_expiring_soon && !license.computed.is_expired && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-headline">
                  Expires in {license.computed.days_until_expiry} day{license.computed.days_until_expiry !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {license.computed.is_expired && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-headline">
                  This license has expired
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <ProvnButton
                variant="secondary"
                size="sm"
                onClick={handleViewContent}
                className="flex-1"
              >
                <Eye className="w-3 h-3 mr-1" />
                View Content
              </ProvnButton>
              
              {(license.computed.is_expired || license.computed.is_expiring_soon) && (
                <ProvnButton
                  size="sm"
                  onClick={handleRenew}
                  className="flex-1"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Renew
                </ProvnButton>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-provn-border">
            <button
              onClick={copyLicenseInfo}
              className="text-xs text-provn-muted hover:text-provn-accent transition-colors font-headline"
            >
              Copy License Info
            </button>
            
            {license.transaction_hash && (
              <button
                onClick={handleViewTransaction}
                className="flex items-center gap-1 text-xs text-provn-muted hover:text-provn-accent transition-colors font-headline"
              >
                <ExternalLink className="w-3 h-3" />
                View TX
              </button>
            )}
          </div>
        </div>
      </ProvnCardContent>
      
      {/* Renewal Modal */}
      <LicenseRenewalModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        license={license}
        onSuccess={handleRenewalSuccess}
      />
    </ProvnCard>
  )
}