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
  Calendar,
  Star,
  Filter,
  RefreshCw
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { ProvnBrandLoader } from "@/components/common/LoadingStates"
import Link from "next/link"

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    handle: string
    displayName?: string
    avatar?: string
    walletAddress: string
  }
  community?: {
    id: string
    name: string
    tier: string
    memberCount: number
    derivativeCount: number
  }
  score: number
  metrics: any
}

interface LeaderboardPanelProps {
  userAddress?: string
}

const leaderboardTypes = [
  { id: 'overall', name: 'Overall', icon: Trophy, description: 'Top creators by combined metrics' },
  { id: 'creators', name: 'Creators', icon: Video, description: 'Most prolific content creators' },
  { id: 'revenue', name: 'Revenue', icon: DollarSign, description: 'Highest earning creators' },
  { id: 'community', name: 'Communities', icon: Users, description: 'Largest communities' },
  { id: 'achievements', name: 'Achievements', icon: Award, description: 'Most achievement points' }
]

const periods = [
  { id: 'all', name: 'All Time' },
  { id: 'month', name: 'This Month' },
  { id: 'week', name: 'This Week' }
]

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return { icon: Crown, color: 'text-yellow-500' }
    case 2:
      return { icon: Medal, color: 'text-gray-400' }
    case 3:
      return { icon: Award, color: 'text-amber-600' }
    default:
      return { icon: Star, color: 'text-provn-muted' }
  }
}

function LeaderboardRow({ entry, type, userAddress }: { 
  entry: LeaderboardEntry
  type: string
  userAddress?: string 
}) {
  const { icon: RankIcon, color } = getRankIcon(entry.rank)
  const isCurrentUser = userAddress && entry.user.walletAddress.toLowerCase() === userAddress.toLowerCase()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
        isCurrentUser 
          ? 'bg-provn-accent/10 border-provn-accent/30' 
          : 'bg-provn-surface border-provn-border hover:border-provn-accent/30'
      }`}
    >
      {/* Rank */}
      <div className="flex items-center gap-2 w-12">
        <RankIcon className={`w-5 h-5 ${color}`} />
        <span className={`font-bold ${color}`}>#{entry.rank}</span>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-provn-accent rounded-full flex items-center justify-center">
          {entry.user.avatar ? (
            <img 
              src={entry.user.avatar} 
              alt={entry.user.handle}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-bold">
              {entry.user.handle?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        
        <div className="flex-1">
          {type === 'community' && entry.community ? (
            <div>
              <Link href={`/community/${entry.community.id}`}>
                <h4 className="font-medium text-provn-text hover:text-provn-accent transition-colors">
                  {entry.community.name}
                </h4>
              </Link>
              <p className="text-sm text-provn-muted">
                by @{entry.user.handle} • {entry.community.tier.toLowerCase()}
              </p>
            </div>
          ) : (
            <div>
              <Link href={`/u/${entry.user.handle}`}>
                <h4 className="font-medium text-provn-text hover:text-provn-accent transition-colors">
                  @{entry.user.handle}
                </h4>
              </Link>
              {entry.user.displayName && (
                <p className="text-sm text-provn-muted">{entry.user.displayName}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="font-bold text-provn-text">
          {type === 'revenue' ? `$${entry.score}` : entry.score.toLocaleString()}
        </div>
        <div className="text-xs text-provn-muted">
          {type === 'overall' && 'Score'}
          {type === 'creators' && 'Derivatives'}
          {type === 'revenue' && 'Revenue'}
          {type === 'community' && 'Members'}
          {type === 'achievements' && 'Points'}
        </div>
      </div>

      {/* Additional Metrics */}
      {entry.metrics && (
        <div className="hidden lg:flex flex-col text-xs text-provn-muted min-w-[120px]">
          {type === 'overall' && (
            <>
              <span>🎬 {entry.metrics.derivatives || 0} derivatives</span>
              <span>💰 {entry.metrics.tips || 0} tips</span>
            </>
          )}
          {type === 'creators' && (
            <>
              <span>🎬 {entry.metrics.derivatives || 0} derivatives</span>
              <span>💰 {entry.metrics.tips || 0} tips</span>
            </>
          )}
          {type === 'community' && (
            <>
              <span>🎭 {entry.metrics.derivatives} derivatives</span>
              <span>👑 {entry.community?.tier.toLowerCase()}</span>
            </>
          )}
          {type === 'achievements' && (
            <>
              <span>🏆 {entry.metrics.achievements} achievements</span>
            </>
          )}
        </div>
      )}

      {/* Current User Badge */}
      {isCurrentUser && (
        <div className="bg-provn-accent text-white text-xs px-2 py-1 rounded-full">
          You
        </div>
      )}
    </motion.div>
  )
}

export function LeaderboardPanel({ userAddress }: LeaderboardPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('overall')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedType, selectedPeriod])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: selectedType,
        period: selectedPeriod,
        limit: '50'
      })

      const response = await fetch(`/api/leaderboards?${params}`)
      const data = await response.json()

      if (data.success) {
        setLeaderboard(data.leaderboard)
        setLastUpdated(data.lastUpdated)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentType = leaderboardTypes.find(t => t.id === selectedType)
  const TypeIcon = currentType?.icon || Trophy

  const userRank = userAddress 
    ? leaderboard.findIndex(entry => 
        entry.user.walletAddress.toLowerCase() === userAddress.toLowerCase()
      ) + 1 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <TypeIcon className="w-8 h-8 text-provn-accent" />
          <div>
            <h2 className="text-2xl font-bold text-provn-text">
              {currentType?.name} Leaderboard
            </h2>
            <p className="text-provn-muted">{currentType?.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-sm text-provn-muted">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
          <ProvnButton
            variant="secondary"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </ProvnButton>
        </div>
      </div>

      {/* User's Current Rank */}
      {userAddress && userRank > 0 && (
        <div className="bg-gradient-to-r from-provn-accent/10 to-purple-500/10 border border-provn-accent/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-provn-accent rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-provn-text">Your Rank</h3>
              <p className="text-provn-muted">
                You're currently #{userRank} out of {leaderboard.length} {currentType?.name.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-provn-text mb-2">
            Leaderboard Type
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {leaderboardTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                    selectedType === type.id
                      ? 'bg-provn-accent text-white border-provn-accent'
                      : 'bg-provn-surface text-provn-text border-provn-border hover:border-provn-accent/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{type.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-provn-text mb-2">
            Time Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <ProvnBrandLoader size="lg" message="Loading leaderboard" />
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {leaderboard.map((entry) => (
              <LeaderboardRow
                key={`${entry.user.walletAddress}-${entry.rank}`}
                entry={entry}
                type={selectedType}
                userAddress={userAddress}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20">
          <Trophy className="w-20 h-20 text-provn-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-provn-text mb-2">No data available</h3>
          <p className="text-provn-muted">
            No {currentType?.name.toLowerCase()} found for the selected time period.
          </p>
        </div>
      )}
    </div>
  )
}