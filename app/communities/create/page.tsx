"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/provn/navigation"
import { FullyProtectedRoute } from "@/components/guards/ProtectedRoute"
import { useAuth } from "@campnetwork/origin/react"
import { motion } from "framer-motion"
import { 
  Crown, 
  Trophy, 
  Star, 
  Zap,
  ArrowLeft,
  Check,
  AlertCircle,
  Users,
  Video,
  Target,
  ChevronDown
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { ProvnBrandLoader } from "@/components/common/LoadingStates"
import { CommunityTier } from "@/lib/supabase"
import Link from "next/link"

interface TopCreatorStatus {
  isTopCreator: boolean
  rank?: number
  canCreateCommunity: boolean
  hasExistingCommunity: boolean
  monthlyStats?: {
    revenue: number
    licensesSold: number
    derivatives: number
  }
}

const tierOptions = [
  {
    tier: 'BRONZE' as CommunityTier,
    name: 'Bronze Community',
    icon: Star,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 border-amber-200',
    description: 'Perfect for starting your creator community',
    features: ['Up to 50 members', 'Basic collaboration tools', 'Community profile'],
    requirements: 'Available to all top creators'
  },
  {
    tier: 'SILVER' as CommunityTier,
    name: 'Silver Community',
    icon: Trophy,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 border-gray-200',
    description: 'Enhanced features for growing communities',
    features: ['Up to 200 members', 'Advanced analytics', 'Featured placement'],
    requirements: '10+ derivatives submitted'
  },
  {
    tier: 'GOLD' as CommunityTier,
    name: 'Gold Community',
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 border-yellow-200',
    description: 'Premium community with advanced features',
    features: ['Up to 500 members', 'Revenue sharing tools', 'Priority support'],
    requirements: '25+ derivatives and 100+ licenses sold'
  },
  {
    tier: 'PLATINUM' as CommunityTier,
    name: 'Platinum Community',
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 border-purple-200',
    description: 'Elite community for top performers',
    features: ['Unlimited members', 'Custom branding', 'Dedicated manager'],
    requirements: '50+ derivatives and 500+ licenses sold'
  }
]

export default function CreateCommunityPage() {
  const router = useRouter()
  const { isAuthenticated, walletAddress } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [topCreatorStatus, setTopCreatorStatus] = useState<TopCreatorStatus | null>(null)
  
  // Form state
  const [selectedTier, setSelectedTier] = useState<CommunityTier>('BRONZE')
  const [communityName, setCommunityName] = useState('')
  const [description, setDescription] = useState('')
  const [creatorTokenId, setCreatorTokenId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    checkEligibility()
  }, [walletAddress])

  const checkEligibility = async () => {
    if (!walletAddress) return

    try {
      setLoading(true)
      
      // Check if user is a top creator
      const response = await fetch(`/api/creators/monthly-top?user=${walletAddress}`)
      const data = await response.json()

      if (data.success) {
        const isTopCreator = data.userCanCreateCommunity
        const userStats = data.topCreators?.find(
          (creator: any) => creator.creator_address.toLowerCase() === walletAddress.toLowerCase()
        )

        // Check if user already has a community
        const communityResponse = await fetch(`/api/communities?creator=${walletAddress}&limit=1`)
        const communityData = await communityResponse.json()
        const hasExistingCommunity = communityData.success && communityData.communities.length > 0

        setTopCreatorStatus({
          isTopCreator,
          rank: userStats?.rank,
          canCreateCommunity: isTopCreator && !hasExistingCommunity,
          hasExistingCommunity,
          monthlyStats: userStats ? {
            revenue: parseFloat(userStats.total_revenue),
            licensesSold: userStats.licenses_sold,
            derivatives: userStats.derivatives_created
          } : undefined
        })
      }
    } catch (error) {
      console.error('Error checking eligibility:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!communityName.trim()) {
      newErrors.name = 'Community name is required'
    } else if (communityName.length < 3) {
      newErrors.name = 'Community name must be at least 3 characters'
    } else if (communityName.length > 50) {
      newErrors.name = 'Community name must be less than 50 characters'
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    if (!creatorTokenId.trim()) {
      newErrors.tokenId = 'Creator token ID is required'
    } else if (!/^\d+$/.test(creatorTokenId)) {
      newErrors.tokenId = 'Token ID must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !walletAddress || creating) return

    setCreating(true)
    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: communityName.trim(),
          description: description.trim() || null,
          tier: selectedTier,
          creator_address: walletAddress,
          creator_token_id: parseInt(creatorTokenId),
          transaction_hash: `demo_create_${Date.now()}`
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/community/${data.community.id}`)
      } else {
        setErrors({ submit: data.error || 'Failed to create community' })
      }
    } catch (error) {
      console.error('Error creating community:', error)
      setErrors({ submit: 'Failed to create community. Please try again.' })
    } finally {
      setCreating(false)
    }
  }

  const getAvailableTiers = () => {
    if (!topCreatorStatus?.monthlyStats) return ['BRONZE']
    
    const { derivatives, licensesSold } = topCreatorStatus.monthlyStats
    const available = ['BRONZE']
    
    if (derivatives >= 10) available.push('SILVER')
    if (derivatives >= 25 && licensesSold >= 100) available.push('GOLD')
    if (derivatives >= 50 && licensesSold >= 500) available.push('PLATINUM')
    
    return available
  }

  if (loading) {
    return (
      <FullyProtectedRoute
        authMessage="Connect your wallet to create a community."
        profileMessage="Create your profile to create communities."
      >
        <div className="min-h-screen bg-provn-bg">
          <Navigation />
          <div className="pt-20 flex items-center justify-center min-h-[50vh]">
            <ProvnBrandLoader size="lg" message="Checking eligibility" />
          </div>
        </div>
      </FullyProtectedRoute>
    )
  }

  return (
    <FullyProtectedRoute
      authMessage="Connect your wallet to create a community."
      profileMessage="Create your profile to create communities."
    >
      <div className="min-h-screen bg-provn-bg">
        <Navigation />
        
        <div className="pt-20 pb-8 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Link href="/communities" className="flex items-center gap-2 text-provn-muted hover:text-provn-accent transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Communities
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold font-headline text-provn-text mb-2">
                Create Your Community
              </h1>
              <p className="text-provn-muted">
                Build a space for creators to collaborate and share derivatives
              </p>
            </div>

            {/* Eligibility Check */}
            {!topCreatorStatus?.canCreateCommunity ? (
              <div className="bg-provn-surface border border-provn-border rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-provn-text mb-2">Community Creation Requirements</h3>
                    {!topCreatorStatus?.isTopCreator ? (
                      <div>
                        <p className="text-provn-muted mb-4">
                          Only top creators (top 2 monthly) can create communities. Keep creating great content to earn your spot!
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-provn-surface-2 rounded-lg">
                            <Video className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <div className="font-medium text-provn-text">Create Content</div>
                            <div className="text-sm text-provn-muted">Upload engaging videos</div>
                          </div>
                          <div className="text-center p-4 bg-provn-surface-2 rounded-lg">
                            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <div className="font-medium text-provn-text">Sell Licenses</div>
                            <div className="text-sm text-provn-muted">Build revenue from your content</div>
                          </div>
                          <div className="text-center p-4 bg-provn-surface-2 rounded-lg">
                            <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <div className="font-medium text-provn-text">Rank Top 2</div>
                            <div className="text-sm text-provn-muted">Become a monthly top creator</div>
                          </div>
                        </div>
                      </div>
                    ) : topCreatorStatus?.hasExistingCommunity ? (
                      <p className="text-provn-muted">
                        You already have an existing community. Each creator can only create one community.
                      </p>
                    ) : (
                      <p className="text-provn-muted">
                        There was an error checking your eligibility. Please try again.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Top Creator Status */}
                <div className="bg-gradient-to-r from-provn-accent/10 to-purple-500/10 border border-provn-accent/20 rounded-xl p-6 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-provn-accent rounded-full flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-provn-text">Top Creator Status</h3>
                      <p className="text-provn-muted">
                        Congratulations! You're eligible to create a community (Rank #{topCreatorStatus.rank})
                      </p>
                    </div>
                  </div>
                  
                  {topCreatorStatus.monthlyStats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-provn-text">{topCreatorStatus.monthlyStats.derivatives}</div>
                        <div className="text-sm text-provn-muted">Derivatives</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-provn-text">{topCreatorStatus.monthlyStats.licensesSold}</div>
                        <div className="text-sm text-provn-muted">Licenses Sold</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-provn-text">${(topCreatorStatus.monthlyStats.revenue || 0).toFixed(2)}</div>
                        <div className="text-sm text-provn-muted">Revenue</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Community Creation Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Community Tier Selection */}
                  <div>
                    <h3 className="text-xl font-semibold text-provn-text mb-4">Choose Community Tier</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tierOptions.map((option) => {
                        const Icon = option.icon
                        const isAvailable = getAvailableTiers().includes(option.tier)
                        
                        return (
                          <motion.div
                            key={option.tier}
                            whileHover={isAvailable ? { scale: 1.02 } : {}}
                            className={`relative p-6 border rounded-xl cursor-pointer transition-all ${
                              selectedTier === option.tier
                                ? 'border-provn-accent bg-provn-accent/5'
                                : isAvailable
                                  ? 'border-provn-border hover:border-provn-accent/30'
                                  : 'border-provn-border/50 opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => isAvailable && setSelectedTier(option.tier)}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-lg ${option.bgColor}`}>
                                <Icon className={`w-6 h-6 ${option.color}`} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-provn-text mb-1">{option.name}</h4>
                                <p className="text-sm text-provn-muted mb-3">{option.description}</p>
                                <ul className="text-xs text-provn-muted space-y-1">
                                  {option.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <Check className="w-3 h-3 text-green-400" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                                {!isAvailable && (
                                  <div className="mt-3 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                    Requires: {option.requirements}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {selectedTier === option.tier && (
                              <div className="absolute top-4 right-4 w-6 h-6 bg-provn-accent rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Community Details */}
                  <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-provn-text mb-6">Community Details</h3>
                    
                    <div className="space-y-6">
                      {/* Community Name */}
                      <div>
                        <label className="block text-sm font-medium text-provn-text mb-2">
                          Community Name *
                        </label>
                        <input
                          type="text"
                          value={communityName}
                          onChange={(e) => setCommunityName(e.target.value)}
                          placeholder="Enter your community name"
                          className={`w-full px-4 py-3 bg-provn-surface-2 border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent transition-all ${
                            errors.name ? 'border-red-500' : 'border-provn-border'
                          }`}
                          maxLength={50}
                        />
                        {errors.name && (
                          <p className="mt-2 text-sm text-red-500">{errors.name}</p>
                        )}
                        <p className="mt-2 text-xs text-provn-muted">
                          {communityName.length}/50 characters
                        </p>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-provn-text mb-2">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe your community's purpose and goals"
                          rows={4}
                          className={`w-full px-4 py-3 bg-provn-surface-2 border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent transition-all resize-none ${
                            errors.description ? 'border-red-500' : 'border-provn-border'
                          }`}
                          maxLength={500}
                        />
                        {errors.description && (
                          <p className="mt-2 text-sm text-red-500">{errors.description}</p>
                        )}
                        <p className="mt-2 text-xs text-provn-muted">
                          {description.length}/500 characters
                        </p>
                      </div>

                      {/* Creator Token ID */}
                      <div>
                        <label className="block text-sm font-medium text-provn-text mb-2">
                          Creator Token ID *
                        </label>
                        <input
                          type="text"
                          value={creatorTokenId}
                          onChange={(e) => setCreatorTokenId(e.target.value)}
                          placeholder="Enter your creator token ID"
                          className={`w-full px-4 py-3 bg-provn-surface-2 border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent transition-all ${
                            errors.tokenId ? 'border-red-500' : 'border-provn-border'
                          }`}
                        />
                        {errors.tokenId && (
                          <p className="mt-2 text-sm text-red-500">{errors.tokenId}</p>
                        )}
                        <p className="mt-2 text-xs text-provn-muted">
                          This should be the token ID of your main creator content
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{errors.submit}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <ProvnButton
                      type="submit"
                      disabled={creating}
                      className="px-8"
                    >
                      {creating ? (
                        <div className="flex items-center gap-2">
                          <ProvnBrandLoader size="sm" variant="simple" />
                          Creating Community...
                        </div>
                      ) : (
                        'Create Community'
                      )}
                    </ProvnButton>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </FullyProtectedRoute>
  )
}