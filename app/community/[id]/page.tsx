"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/provn/navigation"
import { FullyProtectedRoute } from "@/components/guards/ProtectedRoute"
import { useAuth } from "@campnetwork/origin/react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Crown, 
  Trophy, 
  Video,
  TrendingUp,
  Calendar,
  Plus,
  Settings,
  Share2,
  Heart,
  MessageCircle,
  Star,
  Zap,
  Upload,
  Play,
  Eye,
  Download,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Grid,
  List,
  Clock,
  Award
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { ProvnBrandLoader } from "@/components/common/LoadingStates"
import { CommunityWithDetails, CommunityMember, CommunityDerivative, CommunityTier } from "@/lib/supabase"
import Link from "next/link"

interface CommunityStats {
  totalMembers: number
  totalDerivatives: number
  totalViews: number
  totalLikes: number
  weeklyGrowth: number
  avgRating: number
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

function CommunityHeader({ 
  community, 
  stats, 
  onJoin, 
  onLeave, 
  isJoining, 
  isOwner 
}: {
  community: CommunityWithDetails
  stats: CommunityStats
  onJoin: () => void
  onLeave: () => void
  isJoining: boolean
  isOwner: boolean
}) {
  const TierIcon = tierIcons[community.tier]
  
  return (
    <div className="bg-provn-surface border border-provn-border rounded-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Community Info */}
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl ${tierBgColors[community.tier]}`}>
              <TierIcon className={`w-8 h-8 ${tierColors[community.tier]}`} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-headline text-provn-text mb-2">
                {community.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-provn-muted mb-3">
                <span>{community.tier.charAt(0).toUpperCase() + community.tier.slice(1).toLowerCase()} Community</span>
                <span>•</span>
                <span>Created by @{community.creator_profile?.handle || 'Unknown'}</span>
                <span>•</span>
                <span>{new Date(community.created_at).toLocaleDateString()}</span>
              </div>
              {community.description && (
                <p className="text-provn-muted leading-relaxed">
                  {community.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-provn-surface-2 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-provn-accent mb-1">
                <Users className="w-4 h-4" />
                <span className="font-bold text-lg">{stats.totalMembers}</span>
              </div>
              <div className="text-xs text-provn-muted">Members</div>
            </div>
            <div className="text-center p-3 bg-provn-surface-2 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                <Video className="w-4 h-4" />
                <span className="font-bold text-lg">{stats.totalDerivatives}</span>
              </div>
              <div className="text-xs text-provn-muted">Derivatives</div>
            </div>
            <div className="text-center p-3 bg-provn-surface-2 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                <Eye className="w-4 h-4" />
                <span className="font-bold text-lg">{stats.totalViews}</span>
              </div>
              <div className="text-xs text-provn-muted">Views</div>
            </div>
            <div className="text-center p-3 bg-provn-surface-2 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                <Heart className="w-4 h-4" />
                <span className="font-bold text-lg">{stats.totalLikes}</span>
              </div>
              <div className="text-xs text-provn-muted">Likes</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 lg:w-48">
          {community.is_member ? (
            <>
              <ProvnButton
                variant="secondary"
                onClick={onLeave}
                disabled={isJoining}
                className="flex items-center justify-center gap-2"
              >
                {isJoining ? <ProvnBrandLoader size="sm" variant="simple" /> : 'Leave Community'}
              </ProvnButton>
              <Link href={`/upload/derivative?community=${community.id}`}>
                <ProvnButton className="w-full flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Submit Derivative
                </ProvnButton>
              </Link>
            </>
          ) : (
            <ProvnButton
              onClick={onJoin}
              disabled={isJoining}
              className="flex items-center justify-center gap-2"
            >
              {isJoining ? <ProvnBrandLoader size="sm" variant="simple" /> : 'Join Community'}
            </ProvnButton>
          )}
          
          {isOwner && (
            <ProvnButton
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage
            </ProvnButton>
          )}
          
          <ProvnButton
            variant="secondary"
            className="flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </ProvnButton>
        </div>
      </div>
    </div>
  )
}

function DerivativeCard({ derivative }: { derivative: CommunityDerivative }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-provn-surface border border-provn-border rounded-xl overflow-hidden hover:border-provn-accent/30 transition-all duration-300 group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-provn-surface-2">
        {derivative.thumbnail_url ? (
          <img
            src={derivative.thumbnail_url}
            alt={derivative.title || ''}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12 text-provn-muted" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-1" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {'0:00'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-provn-text line-clamp-2 mb-2">
          {derivative.title || 'Untitled Derivative'}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-provn-muted mb-3">
          <span>by @{'creator'}</span>
          <span>•</span>
          <span>{new Date(derivative.added_at).toLocaleDateString()}</span>
        </div>

        {derivative.description && (
          <p className="text-sm text-provn-muted line-clamp-2 mb-3">
            {derivative.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-provn-muted">
              <Eye className="w-4 h-4" />
              <span>{derivative.views_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-provn-muted">
              <Heart className="w-4 h-4" />
              <span>{derivative.likes_count || 0}</span>
            </div>
          </div>
          
          <Link href={`/video/${derivative.derivative_token_id}`}>
            <ProvnButton size="sm" variant="secondary">
              <ExternalLink className="w-4 h-4" />
            </ProvnButton>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function MemberCard({ member }: { member: CommunityMember }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-provn-surface border border-provn-border rounded-lg p-4 hover:border-provn-accent/30 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-provn-accent rounded-full flex items-center justify-center">
          <span className="text-white font-bold">
            {member.member_address?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-provn-text">
            {member.member_address?.slice(0, 8) || 'Unknown'}...
          </h4>
          <p className="text-sm text-provn-muted">
            Joined {new Date(member.joined_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-provn-text">
            {member.contribution_score || 0}
          </div>
          <div className="text-xs text-provn-muted">Score</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function CommunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, walletAddress } = useAuth()
  
  const [community, setCommunity] = useState<CommunityWithDetails | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [derivatives, setDerivatives] = useState<CommunityDerivative[]>([])
  const [stats, setStats] = useState<CommunityStats>({
    totalMembers: 0,
    totalDerivatives: 0,
    totalViews: 0,
    totalLikes: 0,
    weeklyGrowth: 0,
    avgRating: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [activeTab, setActiveTab] = useState<'derivatives' | 'members' | 'about'>('derivatives')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  const communityId = params.id as string
  const isOwner = community?.creator_address?.toLowerCase() === walletAddress?.toLowerCase()

  useEffect(() => {
    if (communityId) {
      fetchCommunityData()
    }
  }, [communityId, walletAddress])

  const fetchCommunityData = async () => {
    try {
      setLoading(true)
      
      // Fetch community details
      const params = new URLSearchParams({ user: walletAddress || '' })
      const communityResponse = await fetch(`/api/communities/${communityId}?${params}`)
      const communityData = await communityResponse.json()

      if (communityData.success) {
        setCommunity(communityData.community)
        
        // Calculate stats
        const communityStats: CommunityStats = {
          totalMembers: communityData.community.member_count || 0,
          totalDerivatives: communityData.community.derivative_count || 0,
          totalViews: Math.floor(Math.random() * 10000), // Mock data
          totalLikes: Math.floor(Math.random() * 1000), // Mock data
          weeklyGrowth: Math.floor(Math.random() * 50), // Mock data
          avgRating: 4.5 + Math.random() * 0.5 // Mock data
        }
        setStats(communityStats)
      }

      // Fetch members
      const membersResponse = await fetch(`/api/communities/${communityId}/members`)
      const membersData = await membersResponse.json()
      if (membersData.success) {
        setMembers(membersData.members)
      }

      // Fetch derivatives
      const derivativesResponse = await fetch(`/api/communities/${communityId}/derivatives`)
      const derivativesData = await derivativesResponse.json()
      if (derivativesData.success) {
        setDerivatives(derivativesData.derivatives)
      }

    } catch (error) {
      console.error('Error fetching community data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCommunity = async () => {
    if (!walletAddress || !community || isJoining) return

    setIsJoining(true)
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
        setCommunity(prev => prev ? { ...prev, is_member: true, member_count: prev.member_count + 1 } : null)
        await fetchCommunityData() // Refresh data
      }
    } catch (error) {
      console.error('Error joining community:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveCommunity = async () => {
    if (!walletAddress || !community || isJoining) return

    setIsJoining(true)
    try {
      const response = await fetch(`/api/communities/${communityId}/members?member_address=${walletAddress}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        setCommunity(prev => prev ? { ...prev, is_member: false, member_count: Math.max(0, prev.member_count - 1) } : null)
        await fetchCommunityData() // Refresh data
      }
    } catch (error) {
      console.error('Error leaving community:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const filteredDerivatives = derivatives.filter(derivative =>
    derivative.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    derivative.creator_address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <FullyProtectedRoute
        authMessage="Connect your wallet to view community details."
        profileMessage="Create your profile to view and join communities."
      >
        <div className="min-h-screen bg-provn-bg">
          <Navigation />
          <div className="pt-20 flex items-center justify-center min-h-[50vh]">
            <ProvnBrandLoader size="lg" message="Loading community" />
          </div>
        </div>
      </FullyProtectedRoute>
    )
  }

  if (!community) {
    return (
      <FullyProtectedRoute
        authMessage="Connect your wallet to view community details."
        profileMessage="Create your profile to view and join communities."
      >
        <div className="min-h-screen bg-provn-bg">
          <Navigation />
          <div className="pt-20 flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-provn-text mb-2">Community not found</h2>
              <p className="text-provn-muted mb-4">The community you're looking for doesn't exist.</p>
              <Link href="/communities">
                <ProvnButton>Browse Communities</ProvnButton>
              </Link>
            </div>
          </div>
        </div>
      </FullyProtectedRoute>
    )
  }

  return (
    <FullyProtectedRoute
      authMessage="Connect your wallet to view community details."
      profileMessage="Create your profile to view and join communities."
    >
      <div className="min-h-screen bg-provn-bg">
        <Navigation />
        
        <div className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Link href="/communities" className="flex items-center gap-2 text-provn-muted hover:text-provn-accent transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Communities
              </Link>
            </div>

            {/* Community Header */}
            <CommunityHeader
              community={community}
              stats={stats}
              onJoin={handleJoinCommunity}
              onLeave={handleLeaveCommunity}
              isJoining={isJoining}
              isOwner={isOwner}
            />

            {/* Tab Navigation */}
            <div className="border-b border-provn-border mb-8">
              <nav className="flex space-x-8">
                {[
                  { id: 'derivatives', label: 'Derivatives', count: derivatives.length },
                  { id: 'members', label: 'Members', count: members.length },
                  { id: 'about', label: 'About' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-provn-accent text-provn-accent'
                        : 'border-transparent text-provn-muted hover:text-provn-text hover:border-provn-border'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-provn-surface text-provn-muted px-2 py-0.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'derivatives' && (
                <motion.div
                  key="derivatives"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Derivatives Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-provn-muted w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search derivatives..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                      >
                        <option value="created_at">Latest</option>
                        <option value="views">Most Viewed</option>
                        <option value="likes">Most Liked</option>
                      </select>
                      
                      <ProvnButton
                        variant="secondary"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="p-2"
                      >
                        {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                      </ProvnButton>
                    </div>
                  </div>

                  {/* Derivatives Grid */}
                  {filteredDerivatives.length > 0 ? (
                    <div className={viewMode === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                    }>
                      <AnimatePresence>
                        {filteredDerivatives.map((derivative) => (
                          <DerivativeCard key={derivative.id} derivative={derivative} />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Video className="w-20 h-20 text-provn-muted mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-provn-text mb-2">No derivatives yet</h3>
                      <p className="text-provn-muted mb-4">
                        {community.is_member 
                          ? "Be the first to submit a derivative to this community!"
                          : "Join the community to submit derivatives."
                        }
                      </p>
                      {community.is_member && (
                        <Link href={`/upload/derivative?community=${communityId}`}>
                          <ProvnButton>Submit Derivative</ProvnButton>
                        </Link>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {members.map((member) => (
                          <MemberCard key={member.id} member={member} />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Users className="w-20 h-20 text-provn-muted mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-provn-text mb-2">No members yet</h3>
                      <p className="text-provn-muted">Be the first to join this community!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'about' && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl"
                >
                  <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-provn-text mb-4">About this Community</h3>
                    
                    {community.description ? (
                      <p className="text-provn-muted leading-relaxed mb-6">
                        {community.description}
                      </p>
                    ) : (
                      <p className="text-provn-muted italic mb-6">
                        No description provided.
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-provn-text mb-3">Community Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-provn-muted">Tier:</span>
                            <span className="text-provn-text">{community.tier.charAt(0).toUpperCase() + community.tier.slice(1).toLowerCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-provn-muted">Created:</span>
                            <span className="text-provn-text">{new Date(community.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-provn-muted">Creator:</span>
                            <span className="text-provn-text">@{community.creator_profile?.handle}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-provn-text mb-3">Community Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-provn-muted">Weekly Growth:</span>
                            <span className="text-green-400">+{stats.weeklyGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-provn-muted">Avg Rating:</span>
                            <span className="text-provn-text">{stats.avgRating.toFixed(1)} ⭐</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-provn-muted">Total Views:</span>
                            <span className="text-provn-text">{stats.totalViews.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </FullyProtectedRoute>
  )
}