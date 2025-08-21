"use client"

import React, { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { FullyProtectedRoute } from "@/components/guards/ProtectedRoute"
import { useAuth } from "@campnetwork/origin/react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Filter, 
  Users, 
  Crown, 
  Trophy, 
  Video,
  TrendingUp,
  Calendar,
  Plus,
  ChevronDown,
  Star,
  Eye,
  Zap
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { ProvnBrandLoader } from "@/components/common/LoadingStates"
import { CommunityWithDetails, CommunityTier } from "@/lib/supabase"
import Link from "next/link"

interface CommunityCardProps {
  community: CommunityWithDetails
  onJoin: (communityId: string) => void
  onLeave: (communityId: string) => void
  isJoining: boolean
}

const tierIcons = {
  BRONZE: Star,
  SILVER: Trophy,
  GOLD: Crown,
  PLATINUM: Zap
}

const tierColors = {
  BRONZE: "text-amber-600",
  SILVER: "text-gray-500",
  GOLD: "text-yellow-500",
  PLATINUM: "text-purple-500"
}

const tierBgColors = {
  BRONZE: "bg-amber-100 border-amber-200",
  SILVER: "bg-gray-100 border-gray-200",
  GOLD: "bg-yellow-100 border-yellow-200",
  PLATINUM: "bg-purple-100 border-purple-200"
}

function CommunityCard({ community, onJoin, onLeave, isJoining }: CommunityCardProps) {
  const TierIcon = tierIcons[community.tier]
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-provn-surface border border-provn-border rounded-xl overflow-hidden hover:border-provn-accent/30 transition-all duration-300 group"
    >
      {/* Community Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tierBgColors[community.tier]}`}>
              <TierIcon className={`w-5 h-5 ${tierColors[community.tier]}`} />
            </div>
            <div>
              <Link 
                href={`/community/${community.id}`}
                className="font-headline font-bold text-lg text-provn-text hover:text-provn-accent transition-colors"
              >
                {community.name}
              </Link>
              <p className="text-sm text-provn-muted capitalize">
                {community.tier.toLowerCase()} Community
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-provn-muted">Created by</div>
            <div className="font-medium text-provn-text">
              @{community.creator_profile?.handle || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-provn-muted text-sm mb-4 line-clamp-2">
            {community.description}
          </p>
        )}

        {/* Community Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-provn-accent">
              <Users className="w-4 h-4" />
              <span className="font-bold">{community.member_count}</span>
            </div>
            <div className="text-xs text-provn-muted">Members</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400">
              <Video className="w-4 h-4" />
              <span className="font-bold">{community.derivative_count}</span>
            </div>
            <div className="text-xs text-provn-muted">Derivatives</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="font-bold">{Math.floor(Math.random() * 100)}</span>
            </div>
            <div className="text-xs text-provn-muted">Activity</div>
          </div>
        </div>

        {/* Recent Derivatives Preview */}
        {community.recent_derivatives && community.recent_derivatives.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-provn-muted mb-2">Recent Derivatives</div>
            <div className="flex gap-2">
              {community.recent_derivatives.slice(0, 3).map((derivative) => (
                <div
                  key={derivative.id}
                  className="w-12 h-12 bg-provn-surface-2 rounded-lg overflow-hidden"
                >
                  {derivative.thumbnail_url ? (
                    <img
                      src={derivative.thumbnail_url}
                      alt={derivative.title || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-4 h-4 text-provn-muted" />
                    </div>
                  )}
                </div>
              ))}
              {community.recent_derivatives.length > 3 && (
                <div className="w-12 h-12 bg-provn-surface-2 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-provn-muted">+{community.recent_derivatives.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          {community.is_member ? (
            <>
              <ProvnButton
                variant="outline"
                onClick={() => onLeave(community.id)}
                disabled={isJoining}
                className="flex-1"
              >
                {isJoining ? <ProvnBrandLoader size="sm" variant="simple" /> : 'Leave'}
              </ProvnButton>
              <Link href={`/community/${community.id}`} className="flex-1">
                <ProvnButton className="w-full">
                  View Community
                </ProvnButton>
              </Link>
            </>
          ) : (
            <>
              <ProvnButton
                onClick={() => onJoin(community.id)}
                disabled={isJoining}
                className="flex-1"
              >
                {isJoining ? <ProvnBrandLoader size="sm" variant="simple" /> : 'Join Community'}
              </ProvnButton>
              <Link href={`/community/${community.id}`}>
                <ProvnButton variant="outline">
                  <Eye className="w-4 h-4" />
                </ProvnButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function CommunitiesPage() {
  const { isAuthenticated, walletAddress } = useAuth()
  const [communities, setCommunities] = useState<CommunityWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTier, setSelectedTier] = useState<CommunityTier | "ALL">("ALL")
  const [sortBy, setSortBy] = useState<"created_at" | "member_count" | "derivative_count">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [joiningCommunities, setJoiningCommunities] = useState<Set<string>>(new Set())
  const [canCreateCommunity, setCanCreateCommunity] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchCommunities()
    checkCommunityCreationEligibility()
  }, [searchTerm, selectedTier, sortBy, sortOrder, walletAddress])

  const fetchCommunities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        sortBy,
        sortOrder
      })

      if (selectedTier !== "ALL") {
        params.set('tier', selectedTier)
      }

      if (searchTerm) {
        params.set('search', searchTerm)
      }

      if (walletAddress) {
        params.set('user', walletAddress)
      }

      const response = await fetch(`/api/communities?${params}`)
      const data = await response.json()

      if (data.success) {
        setCommunities(data.communities)
      } else {
        console.error('Failed to fetch communities:', data.error)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkCommunityCreationEligibility = async () => {
    if (!walletAddress) return

    try {
      const response = await fetch(`/api/creators/monthly-top?user=${walletAddress}`)
      const data = await response.json()

      if (data.success) {
        setCanCreateCommunity(data.userCanCreateCommunity)
      }
    } catch (error) {
      console.error('Error checking community creation eligibility:', error)
    }
  }

  const handleJoinCommunity = async (communityId: string) => {
    if (!walletAddress || joiningCommunities.has(communityId)) return

    setJoiningCommunities(prev => new Set(prev).add(communityId))

    try {
      const response = await fetch(`/api/communities/${communityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_address: walletAddress,
          transaction_hash: `demo_${Date.now()}`
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setCommunities(prev => prev.map(community => 
          community.id === communityId 
            ? { ...community, is_member: true, member_count: community.member_count + 1 }
            : community
        ))
      } else {
        console.error('Failed to join community:', data.error)
      }
    } catch (error) {
      console.error('Error joining community:', error)
    } finally {
      setJoiningCommunities(prev => {
        const next = new Set(prev)
        next.delete(communityId)
        return next
      })
    }
  }

  const handleLeaveCommunity = async (communityId: string) => {
    if (!walletAddress || joiningCommunities.has(communityId)) return

    setJoiningCommunities(prev => new Set(prev).add(communityId))

    try {
      const response = await fetch(`/api/communities/${communityId}/members?member_address=${walletAddress}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setCommunities(prev => prev.map(community => 
          community.id === communityId 
            ? { ...community, is_member: false, member_count: Math.max(0, community.member_count - 1) }
            : community
        ))
      } else {
        console.error('Failed to leave community:', data.error)
      }
    } catch (error) {
      console.error('Error leaving community:', error)
    } finally {
      setJoiningCommunities(prev => {
        const next = new Set(prev)
        next.delete(communityId)
        return next
      })
    }
  }

  return (
    <FullyProtectedRoute
      authMessage="Connect your wallet to discover and join creator communities on Provn."
      profileMessage="Create your profile to join communities and collaborate with other creators."
    >
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="communities" />
        
        <div className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold font-headline text-provn-text mb-2">
                    Creator Communities
                  </h1>
                  <p className="text-provn-muted">
                    Discover communities, collaborate on derivatives, and grow together
                  </p>
                </div>
                
                {canCreateCommunity && (
                  <Link href="/communities/create">
                    <ProvnButton className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Community
                    </ProvnButton>
                  </Link>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-provn-muted w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-provn-surface border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <ProvnButton
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </ProvnButton>

                {/* Quick Tier Filters */}
                <div className="flex gap-2">
                  {(['ALL', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                        selectedTier === tier
                          ? 'bg-provn-accent text-white'
                          : 'bg-provn-surface border border-provn-border text-provn-muted hover:text-provn-text hover:border-provn-accent/30'
                      }`}
                    >
                      {tier === 'ALL' ? 'All' : tier.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expanded Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-provn-surface border border-provn-border rounded-lg p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-provn-text mb-2">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                        >
                          <option value="created_at">Date Created</option>
                          <option value="member_count">Member Count</option>
                          <option value="derivative_count">Derivative Count</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-provn-text mb-2">Order</label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                        >
                          <option value="desc">Descending</option>
                          <option value="asc">Ascending</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Communities Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <ProvnBrandLoader size="lg" message="Loading communities" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {communities.map((community) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      onJoin={handleJoinCommunity}
                      onLeave={handleLeaveCommunity}
                      isJoining={joiningCommunities.has(community.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Empty State */}
            {!loading && communities.length === 0 && (
              <div className="text-center py-20">
                <Users className="w-20 h-20 text-provn-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-provn-text mb-2">No communities found</h3>
                <p className="text-provn-muted">
                  {searchTerm || selectedTier !== "ALL" 
                    ? "Try adjusting your search or filters"
                    : "Be the first to create a community when you become a top creator!"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FullyProtectedRoute>
  )
}