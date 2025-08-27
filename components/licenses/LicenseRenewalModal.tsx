"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  RefreshCw, 
  Calendar, 
  DollarSign, 
  Clock, 
  Shield,
  Loader2,
  AlertTriangle,
  Check
} from 'lucide-react'
import { ProvnButton } from '@/components/provn/button'
import { useAuth } from '@campnetwork/origin/react'
import { useOriginLicensing } from '@/hooks/useOriginLicensing'
import { toast } from 'sonner'

interface LicenseRenewalModalProps {
  isOpen: boolean
  onClose: () => void
  license: {
    id: number
    token_id: number
    license_type: string
    price_paid: number
    expires_at: string
    duration_seconds: number
    platform_videos?: {
      title: string
      profiles: {
        handle: string
        display_name: string
      }
    }
    computed: {
      is_expired: boolean
      is_expiring_soon: boolean
      days_until_expiry: number
    }
  }
  onSuccess?: () => void
}

export function LicenseRenewalModal({ 
  isOpen, 
  onClose, 
  license, 
  onSuccess 
}: LicenseRenewalModalProps) {
  const { walletAddress } = useAuth()
  const { getLicenseTerms, loading: originLoading } = useOriginLicensing()
  
  const [periods, setPeriods] = useState(1)
  const [currentTerms, setCurrentTerms] = useState<any>(null)
  const [termsLoading, setTermsLoading] = useState(false)
  const [isRenewing, setIsRenewing] = useState(false)
  const [renewalStep, setRenewalStep] = useState<string | null>(null)
  const [renewalSuccess, setRenewalSuccess] = useState(false)

  // Fetch current license terms when modal opens
  useEffect(() => {
    if (isOpen && license.token_id) {
      fetchLicenseTerms()
    }
  }, [isOpen, license.token_id])

  const fetchLicenseTerms = async () => {
    try {
      setTermsLoading(true)
      const terms = await getLicenseTerms(license.token_id.toString())
      if (terms) {
        setCurrentTerms(terms)
      } else {
        // Fallback to original license terms
        setCurrentTerms({
          price: license.price_paid * (10**18), // Convert back to wei
          duration: license.duration_seconds,
          royaltyBps: 500, // Default 5%
          paymentToken: "0x0000000000000000000000000000000000000000"
        })
      }
    } catch (error) {
      console.error('Failed to fetch license terms:', error)
      toast.error('Failed to load license terms')
    } finally {
      setTermsLoading(false)
    }
  }

  const formatPROVN = (amount: number) => {
    return `${amount.toFixed(amount < 1 ? 2 : 1)} PROVN`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateNewExpiryDate = () => {
    const currentExpiry = new Date(license.expires_at)
    const now = new Date()
    
    // If license is expired, start from now, otherwise extend from current expiry
    const startDate = currentExpiry > now ? currentExpiry : now
    const additionalSeconds = (currentTerms?.duration || license.duration_seconds) * periods
    
    return new Date(startDate.getTime() + (additionalSeconds * 1000))
  }

  const getTotalCost = () => {
    if (!currentTerms) return license.price_paid * periods
    return (Number(currentTerms.price) / (10**18)) * periods
  }

  const handleRenewal = async () => {
    if (!walletAddress || !currentTerms) {
      toast.error('Wallet not connected or terms not loaded')
      return
    }

    try {
      setIsRenewing(true)
      setRenewalSuccess(false)
      setRenewalStep('Preparing renewal...')

      const newExpiryDate = calculateNewExpiryDate()
      const totalCost = getTotalCost()

      // Here we would integrate with the Origin SDK for actual renewal
      // For now, we'll simulate the renewal process
      setRenewalStep('Confirming transaction...')
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Call renewal API
      const response = await fetch('/api/licenses/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license_id: license.id,
          additional_periods: periods,
          new_expires_at: newExpiryDate.toISOString(),
          price_paid: totalCost.toString(),
          transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`, // Simulated
          block_number: Math.floor(Math.random() * 1000000)
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to renew license')
      }

      setRenewalStep('Renewal successful!')
      setRenewalSuccess(true)
      
      toast.success(`License renewed for ${periods} additional period${periods !== 1 ? 's' : ''}!`)
      
      // Call success callback to refresh parent data
      if (onSuccess) {
        onSuccess()
      }

      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 3000)

    } catch (error) {
      console.error('License renewal failed:', error)
      setRenewalStep(null)
      toast.error(error instanceof Error ? error.message : 'Failed to renew license')
    } finally {
      setIsRenewing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-provn-surface border border-provn-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-2 sm:mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-provn-border">
            <div>
              <h2 className="text-lg font-bold text-provn-text font-headline">
                Renew License
              </h2>
              <p className="text-xs text-provn-muted font-headline">
                Extend your access period
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isRenewing}
              className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 text-provn-muted hover:text-provn-text" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Content Info */}
            <div className="bg-provn-surface-2 rounded-lg p-3">
              <h3 className="font-semibold text-provn-text text-sm mb-1 truncate font-headline">
                {license.platform_videos?.title || `Content #${license.token_id}`}
              </h3>
              <p className="text-xs text-provn-muted font-headline">
                by @{license.platform_videos?.profiles?.handle}
              </p>
              <p className="text-xs text-provn-muted font-headline mt-1">
                Token ID: #{license.token_id}
              </p>
            </div>

            {/* Current License Status */}
            <div className="bg-provn-surface-2 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-provn-text mb-2 font-headline">
                Current License
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-provn-muted">Type:</span>
                  <span className="text-provn-text font-headline">{license.license_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-provn-muted">Status:</span>
                  <span className={`font-headline ${
                    license.computed.is_expired ? 'text-red-400' : 
                    license.computed.is_expiring_soon ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {license.computed.is_expired ? 'Expired' : 
                     license.computed.is_expiring_soon ? 'Expiring Soon' : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-provn-muted">
                    {license.computed.is_expired ? 'Expired:' : 'Expires:'}
                  </span>
                  <span className="text-provn-text font-headline">
                    {formatDate(license.expires_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Loading Terms */}
            {termsLoading && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-provn-accent mx-auto mb-2" />
                <p className="text-xs text-provn-muted font-headline">Loading renewal terms...</p>
              </div>
            )}

            {/* Renewal Configuration */}
            {!termsLoading && currentTerms && (
              <>
                {/* Period Selection */}
                <div>
                  <label className="block text-sm font-semibold text-provn-text mb-2 font-headline">
                    Extension Periods
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPeriods(Math.max(1, periods - 1))}
                      disabled={periods <= 1 || isRenewing}
                      className="w-8 h-8 rounded-lg bg-provn-surface-2 border border-provn-border text-provn-text hover:bg-provn-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-lg font-semibold text-provn-text font-headline">
                        {periods}
                      </span>
                      <p className="text-xs text-provn-muted font-headline">
                        {periods === 1 ? 'period' : 'periods'}
                      </p>
                    </div>
                    <button
                      onClick={() => setPeriods(periods + 1)}
                      disabled={isRenewing}
                      className="w-8 h-8 rounded-lg bg-provn-surface-2 border border-provn-border text-provn-text hover:bg-provn-accent hover:text-white transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* New Expiry Date */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-provn-text font-headline">
                      New Expiry Date
                    </span>
                  </div>
                  <p className="text-provn-text font-headline">
                    {formatDate(calculateNewExpiryDate().toISOString())}
                  </p>
                  <p className="text-xs text-provn-muted font-headline mt-1">
                    +{Math.floor((currentTerms.duration * periods) / 86400)} days extension
                  </p>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-gradient-to-r from-purple-500/10 to-green-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-provn-text font-headline">
                        Renewal Cost
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-provn-accent font-headline">
                        {formatPROVN(getTotalCost())}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-provn-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Price per period:</span>
                      <span className="text-provn-text font-headline">
                        {formatPROVN(Number(currentTerms.price) / (10**18))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Periods:</span>
                      <span className="text-provn-text font-headline">{periods}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Renewal Progress */}
            {isRenewing && renewalStep && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-400">
                  {renewalSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span className="text-sm font-headline">{renewalStep}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <ProvnButton
                variant="secondary"
                onClick={onClose}
                disabled={isRenewing}
                className="flex-1"
              >
                {renewalSuccess ? 'Close' : 'Cancel'}
              </ProvnButton>
              
              {!renewalSuccess && (
                <ProvnButton
                  onClick={handleRenewal}
                  disabled={isRenewing || termsLoading || !currentTerms}
                  className="flex-1"
                >
                  {isRenewing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Renewing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renew License
                    </>
                  )}
                </ProvnButton>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-provn-border">
              <p className="text-xs text-provn-muted font-headline">
                Renewal extends your license from the current expiry date
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}