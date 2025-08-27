"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Trophy,
  Medal,
  Award,
  Crown,
  Users,
  Video,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Eye,
  Heart,
  Zap
} from "lucide-react"

interface CreatorScore {
  rank: number
  profile_id: string
  wallet_address: string
  handle: string
  display_name?: string
  avatar_url?: string
  total_score: number
  views_score: number
  tips_score: number
  licenses_score: number
  engagement_score: number
  consistency_score: number
  quality_score: number
  videos_count: number
  derivatives_count: number
  total_views: number
  total_tips: number
  total_licenses: number
  total_earnings: number
  rank_change: number
  streak_days: number
  tier: 'legendary' | 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'rising'
  achievements: string[]
}

interface LeaderboardStats {
  total_creators: number
  avg_score: number
  highest_score: number
}

interface PremiumLeaderboardProps {
  userAddress?: string
}

const tierGradients = {
  legendary: 'from-yellow-500 via-yellow-400 to-yellow-600',
  diamond: 'from-blue-400 via-cyan-300 to-blue-600',
  platinum: 'from-gray-400 via-gray-300 to-gray-600',
  gold: 'from-yellow-400 via-yellow-300 to-yellow-500',
  silver: 'from-gray-300 via-gray-200 to-gray-500',
  bronze: 'from-orange-400 via-orange-300 to-orange-600',
  rising: 'from-green-400 via-green-300 to-green-600'
}

const tierIcons = {
  legendary: Crown,
  diamond: Award,
  platinum: Medal,
  gold: Trophy,
  silver: Medal,
  bronze: Award,
  rising: TrendingUp
}

const competitionLevels = {
  low: { label: 'Low', color: 'text-green-400', dotColor: 'bg-green-400' },
  medium: { label: 'Medium', color: 'text-yellow-400', dotColor: 'bg-yellow-400' },
  high: { label: 'High', color: 'text-orange-400', dotColor: 'bg-orange-400' },
  intense: { label: 'High', color: 'text-red-400', dotColor: 'bg-red-400' }
}

export function PremiumLeaderboard({ userAddress }: PremiumLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<CreatorScore[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<number | null>(null)
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('all-time')
  const [category, setCategory] = useState<string>('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe, category, userAddress])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        timeframe,
        limit: '50'
      })
      
      if (category !== 'all') {
        params.set('category', category)
      }
      
      if (userAddress) {
        params.set('userWallet', userAddress)
      }

      const response = await fetch(`/api/leaderboard?${params}`)
      const result = await response.json()

      if (result.success) {
        setLeaderboard(result.data.leaderboard)
        setStats(result.data.stats)
        setUserRank(result.data.userRank)
      } else {
        console.error('Leaderboard API error:', result.error)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompetitionLevel = (totalCreators: number): keyof typeof competitionLevels => {
    if (totalCreators >= 100) return 'intense'
    if (totalCreators >= 50) return 'high'
    if (totalCreators >= 20) return 'medium'
    return 'low'
  }

  const competition = stats ? competitionLevels[getCompetitionLevel(stats.total_creators)] : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-provn-accent animate-spin" />
          <span className="text-provn-muted">Loading leaderboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline text-provn-text mb-2">
          Creator Leaderboard
        </h1>
        <p className="text-provn-muted">
          Compete with the best creators and climb your way to the top
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">
            {stats?.total_creators || 0}
          </div>
          <div className="text-sm text-provn-muted">Total Creators</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">
            {stats?.avg_score || 0}
          </div>
          <div className="text-sm text-provn-muted">Average Score</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">
            {stats?.highest_score ? `${(stats.highest_score / 1000).toFixed(1)}K` : '0'}
          </div>
          <div className="text-sm text-provn-muted">Top Score</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className={`text-2xl font-bold ${competition?.color || 'text-provn-text'}`}>
              {competition?.label || 'Low'}
            </div>
            {/* Blinking Dot - synced with status color */}
            <div className={`w-2 h-2 rounded-full animate-pulse ${competition?.dotColor || 'bg-provn-accent'}`} style={{minWidth: '8px', minHeight: '8px'}}></div>
          </div>
          <div className="text-sm text-provn-muted">Competition Level</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <label className="text-sm font-medium text-provn-muted">Time Period:</label>
          <div className="flex gap-1">
            {(['all-time', 'monthly', 'weekly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  timeframe === period
                    ? 'bg-provn-accent text-white'
                    : 'bg-provn-surface text-provn-muted hover:text-provn-text'
                }`}
              >
                {period === 'all-time' ? 'All' : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <label className="text-sm font-medium text-provn-muted">Search:</label>
          <input
            type="text"
            placeholder="Search creators..."
            className="px-3 py-1 text-xs bg-provn-surface border border-provn-border rounded text-provn-text placeholder-provn-muted focus:outline-none focus:ring-1 focus:ring-provn-accent"
          />
        </div>

        <div className="flex gap-2">
          <label className="text-sm font-medium text-provn-muted">Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1 text-xs bg-provn-surface border border-provn-border rounded text-provn-text focus:outline-none focus:ring-1 focus:ring-provn-accent"
          >
            <option value="all">All Categories</option>
          </select>
        </div>

        <div className="flex gap-2">
          <label className="text-sm font-medium text-provn-muted">Tier:</label>
          <select
            className="px-3 py-1 text-xs bg-provn-surface border border-provn-border rounded text-provn-text focus:outline-none focus:ring-1 focus:ring-provn-accent"
          >
            <option value="all">All Tiers</option>
          </select>
        </div>
      </div>

      {/* User Rank Card */}
      {userRank && userAddress && (
        <div className="bg-gradient-to-r from-provn-accent/10 to-purple-500/10 border border-provn-accent/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-provn-accent rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-provn-text">Your Rank</h3>
              <p className="text-provn-muted">
                You're currently #{userRank} out of {stats?.total_creators || 0} creators
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-provn-text">Full Rankings</h2>
        
        {leaderboard.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence>
              {leaderboard.map((creator, index) => {
                const TierIcon = tierIcons[creator.tier]
                const isCurrentUser = userAddress && creator.wallet_address.toLowerCase() === userAddress.toLowerCase()
                
                return (
                  <motion.div
                    key={creator.profile_id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:border-provn-accent/30 ${
                      isCurrentUser 
                        ? 'bg-provn-accent/10 border-provn-accent/30' 
                        : 'bg-provn-surface border-provn-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center min-w-[60px]">
                        <div className={`text-lg font-bold text-center ${
                          creator.rank === 1 ? 'text-yellow-500' :
                          creator.rank === 2 ? 'text-gray-400' :
                          creator.rank === 3 ? 'text-amber-600' :
                          'text-provn-text'
                        }`}>
                          #{creator.rank}
                        </div>
                      </div>

                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-provn-accent flex items-center justify-center">
                            {creator.avatar_url ? (
                              <img 
                                src={creator.avatar_url} 
                                alt={creator.handle}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold">
                                {creator.handle?.[0]?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          {/* Tier indicator */}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br ${tierGradients[creator.tier]} flex items-center justify-center`}>
                            <TierIcon className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-provn-text">
                              {creator.display_name || creator.handle}
                            </h4>
                            {isCurrentUser && (
                              <span className="text-xs bg-provn-accent text-white px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-provn-muted">
                            @{creator.handle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-provn-text">
                          {creator.total_score.toLocaleString()}
                        </div>
                        <div className="text-xs text-provn-muted">Points</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium text-provn-text">
                          {creator.videos_count}
                        </div>
                        <div className="text-xs text-provn-muted">Videos</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium text-provn-text">
                          {creator.derivatives_count || 0}
                        </div>
                        <div className="text-xs text-provn-muted">Derivatives</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium text-provn-text">
                          {creator.total_tips}
                        </div>
                        <div className="text-xs text-provn-muted">Tips</div>
                      </div>

                      <button className="px-3 py-1 text-xs bg-provn-surface hover:bg-provn-surface-2 border border-provn-border rounded transition-colors text-provn-text">
                        View
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <Trophy className="w-20 h-20 text-provn-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-provn-text mb-2">No creators found</h3>
            <p className="text-provn-muted">
              Be the first to create content and claim the top spot!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}