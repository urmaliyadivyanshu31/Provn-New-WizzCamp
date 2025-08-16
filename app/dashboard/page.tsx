"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from '@campnetwork/origin/react'

interface CreatorRanking {
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
  total_views: number
  total_tips: number
  total_licenses: number
  total_earnings: number
  rank_change: number
  streak_days: number
  tier: 'legendary' | 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'rising'
  achievements: string[]
}

interface LeaderboardData {
  leaderboard: CreatorRanking[]
  userRank: number | null
  stats: {
    total_creators: number
    avg_score: number
    highest_score: number
  }
}

interface CategoryData {
  category: string
  total_creators: number
  total_videos: number
  total_views: number
  total_tips: number
  total_licenses: number
  total_revenue: number
  avg_views_per_video: number
  competition_level: 'low' | 'medium' | 'high' | 'intense'
  growth_rate: number
  emoji: string
}

const tierColors = {
  legendary: 'from-yellow-400 via-yellow-500 to-orange-500',
  diamond: 'from-blue-400 via-blue-500 to-blue-600', 
  platinum: 'from-gray-300 via-gray-400 to-gray-500',
  gold: 'from-yellow-300 via-yellow-400 to-yellow-500',
  silver: 'from-gray-200 via-gray-300 to-gray-400',
  bronze: 'from-orange-300 via-orange-400 to-orange-500',
  rising: 'from-green-300 via-green-400 to-green-500'
}

const tierEmojis = {
  legendary: '👑',
  diamond: '💎', 
  platinum: '🥈',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  rising: '🌟'
}

const achievementEmojis: { [key: string]: string } = {
  'Champion': '🏆',
  'Podium Finisher': '🥇',
  'Top 10': '🔟',
  'Viral Creator': '🌟',
  'View Master': '👁️',
  'Rising Star': '⭐',
  'wCAMP Millionaire': '💰',
  'Revenue Generator': '💵',
  'First Earnings': '🪙',
  'Monthly Consistent': '📅',
  'Weekly Warrior': '⚡',
  'Consistent Creator': '🎯',
  'Engagement Expert': '🤝',
  'Community Favorite': '❤️',
  'License Legend': '📜',
  'IP Pioneer': '🚀',
  'First License': '📄'
}

export default function LeaderboardPage() {
  const { isAuthenticated, walletAddress } = useAuth()
  const [activeView, setActiveView] = useState<'global' | 'category' | 'weekly' | 'monthly'>('global')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('all-time')
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams({
          timeframe,
          limit: '50',
          offset: '0'
        })
        
        if (selectedCategory) params.append('category', selectedCategory)
        if (selectedTier) params.append('tier', selectedTier)
        if (walletAddress) params.append('userWallet', walletAddress)

        const response = await fetch(`/api/leaderboard?${params}`)
        if (response.ok) {
          const data = await response.json()
          setLeaderboardData(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [timeframe, selectedCategory, selectedTier, walletAddress])

  // Fetch categories data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/leaderboard/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.data.categories)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getRankChange = (change: number) => {
    if (change > 0) return { icon: '📈', color: 'text-green-400', text: `+${change}` }
    if (change < 0) return { icon: '📉', color: 'text-red-400', text: `${change}` }
    return { icon: '➡️', color: 'text-provn-muted', text: '0' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="dashboard" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <motion.div 
              className="text-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="text-6xl mb-4">🏆</div>
              <div className="text-provn-muted font-headline">Loading Leaderboard...</div>
            </motion.div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="dashboard" />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-provn-bg via-provn-surface to-provn-bg">
        <div className="absolute inset-0 bg-gradient-to-r from-provn-accent/5 to-transparent" />
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="font-headline text-5xl md:text-6xl font-bold text-provn-text mb-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              🏆 Creator Leaderboard
            </motion.h1>
            <motion.p 
              className="text-xl text-provn-muted max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Compete, create, and climb the ranks. Where creativity meets competition.
            </motion.p>
            
            {leaderboardData?.userRank && (
              <motion.div 
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-provn-accent/10 border border-provn-accent/20 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span className="text-provn-accent font-semibold">Your Rank: #{leaderboardData.userRank}</span>
                <span className="text-2xl">🎯</span>
              </motion.div>
            )}
          </div>

          {/* Stats Overview */}
          {leaderboardData && (
            <motion.div 
              className="grid md:grid-cols-3 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <ProvnCard className="text-center">
                <ProvnCardContent className="p-6">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-2xl font-headline font-bold text-provn-text">
                    {formatNumber(leaderboardData.stats.total_creators)}
                  </div>
                  <div className="text-provn-muted">Competing Creators</div>
                </ProvnCardContent>
              </ProvnCard>

              <ProvnCard className="text-center">
                <ProvnCardContent className="p-6">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-2xl font-headline font-bold text-provn-text">
                    {formatNumber(leaderboardData.stats.avg_score)}
                  </div>
                  <div className="text-provn-muted">Average Score</div>
                </ProvnCardContent>
              </ProvnCard>

              <ProvnCard className="text-center">
                <ProvnCardContent className="p-6">
                  <div className="text-3xl mb-2">🚀</div>
                  <div className="text-2xl font-headline font-bold text-provn-text">
                    {formatNumber(leaderboardData.stats.highest_score)}
                  </div>
                  <div className="text-provn-muted">Top Score</div>
                </ProvnCardContent>
              </ProvnCard>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <motion.div 
          className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Timeframe Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all-time', label: 'All Time', icon: '🏆' },
              { value: 'monthly', label: 'Monthly', icon: '📅' },
              { value: 'weekly', label: 'Weekly', icon: '⚡' }
            ].map(option => (
              <ProvnButton
                key={option.value}
                variant={timeframe === option.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTimeframe(option.value as any)}
                className="flex items-center gap-2"
              >
                {option.icon} {option.label}
              </ProvnButton>
            ))}
          </div>

          {/* Category Filter */}
          <select 
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.category} value={cat.category}>
                {cat.emoji} {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select 
            value={selectedTier || ''}
            onChange={(e) => setSelectedTier(e.target.value || null)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
          >
            <option value="">All Tiers</option>
            {Object.entries(tierEmojis).map(([tier, emoji]) => (
              <option key={tier} value={tier}>
                {emoji} {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Podium for Top 3 */}
        {leaderboardData && leaderboardData.leaderboard.length >= 3 && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="font-headline text-2xl font-bold text-provn-text mb-6 text-center">
              🏆 Champions Podium
            </h2>
            <div className="flex flex-col sm:flex-row sm:justify-center sm:items-end gap-4 sm:gap-4 mb-8">
              {[1, 0, 2].map((index) => {
                const creator = leaderboardData.leaderboard[index]
                if (!creator) return null
                
                const podiumHeight = index === 0 ? 'h-24 sm:h-32' : index === 1 ? 'h-20 sm:h-24' : 'h-16 sm:h-20'
                const podiumOrder = index === 0 ? 1 : index === 1 ? 2 : 3
                
                return (
                  <motion.div 
                    key={creator.profile_id}
                    className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + (podiumOrder * 0.1) }}
                  >
                    {/* Creator Avatar */}
                    <div className="relative mb-0 sm:mb-4">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${tierColors[creator.tier]} p-1`}>
                        <img
                          src={creator.avatar_url || '/diverse-profile-avatars.png'}
                          alt={creator.display_name || creator.handle}
                          className="w-full h-full rounded-full object-cover bg-provn-surface"
                        />
                      </div>
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-xl sm:text-2xl">
                        {podiumOrder === 1 ? '🥇' : podiumOrder === 2 ? '🥈' : '🥉'}
                      </div>
                    </div>
                    
                    {/* Creator Info */}
                    <div className="flex-1 sm:mb-4">
                      <h3 className="font-semibold text-provn-text text-sm sm:text-base">
                        {creator.display_name || creator.handle}
                      </h3>
                      <div className="text-xs sm:text-sm text-provn-muted">@{creator.handle}</div>
                      <div className="text-sm sm:text-lg font-bold text-provn-accent">
                        {formatNumber(creator.total_score)} pts
                      </div>
                    </div>
                    
                    {/* Podium Base - hidden on mobile, shown on larger screens */}
                    <div className={`hidden sm:block ${podiumHeight} w-20 sm:w-24 bg-gradient-to-t ${tierColors[creator.tier]} rounded-t-lg mx-auto flex items-end justify-center pb-2`}>
                      <span className="text-white font-bold text-lg sm:text-xl">#{podiumOrder}</span>
                    </div>

                    {/* Mobile rank indicator */}
                    <div className="sm:hidden text-2xl font-bold text-provn-text">
                      #{podiumOrder}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Leaderboard Table */}
        {leaderboardData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="font-headline text-2xl font-bold text-provn-text mb-6">
              📊 Full Rankings
            </h2>
            
            <div className="space-y-4">
              {leaderboardData.leaderboard.map((creator, index) => {
                const rankChange = getRankChange(creator.rank_change)
                const isCurrentUser = walletAddress?.toLowerCase() === creator.wallet_address.toLowerCase()
                
                return (
                  <motion.div
                    key={creator.profile_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    className={`${isCurrentUser ? 'ring-2 ring-provn-accent' : ''}`}
                  >
                    <ProvnCard className={`${isCurrentUser ? 'bg-provn-accent/5' : ''}`}>
                      <ProvnCardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Rank */}
                            <div className="text-center min-w-[60px]">
                              <div className="text-xl sm:text-2xl font-bold text-provn-text">#{creator.rank}</div>
                              <div className={`flex items-center justify-center gap-1 text-xs sm:text-sm ${rankChange.color}`}>
                                {rankChange.icon}
                                <span>{rankChange.text}</span>
                              </div>
                            </div>

                            {/* Creator Info */}
                            <div className="flex items-center gap-3 sm:gap-4 flex-1">
                              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${tierColors[creator.tier]} p-1`}>
                                <img
                                  src={creator.avatar_url || '/diverse-profile-avatars.png'}
                                  alt={creator.display_name || creator.handle}
                                  className="w-full h-full rounded-full object-cover bg-provn-surface"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-provn-text text-sm sm:text-base truncate">
                                    {creator.display_name || creator.handle}
                                  </h3>
                                  <span className="text-base sm:text-lg">{tierEmojis[creator.tier]}</span>
                                  {isCurrentUser && <span className="text-provn-accent font-semibold text-xs sm:text-sm">(You)</span>}
                                </div>
                                <div className="text-xs sm:text-sm text-provn-muted truncate">@{creator.handle}</div>
                                <div className="flex gap-1 sm:gap-2 mt-1">
                                  {creator.achievements.slice(0, 3).map(achievement => (
                                    <span key={achievement} className="text-xs" title={achievement}>
                                      {achievementEmojis[achievement] || '🏅'}
                                    </span>
                                  ))}
                                  {creator.achievements.length > 3 && (
                                    <span className="text-xs text-provn-muted">
                                      +{creator.achievements.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between lg:justify-end gap-4 sm:gap-6 lg:gap-8">
                            <div className="text-center">
                              <div className="text-lg sm:text-xl font-bold text-provn-text">
                                {formatNumber(creator.total_score)}
                              </div>
                              <div className="text-xs sm:text-sm text-provn-muted">Score</div>
                            </div>
                            
                            <div className="text-center hidden sm:block">
                              <div className="text-sm sm:text-lg font-semibold text-provn-text">
                                {formatNumber(creator.total_views)}
                              </div>
                              <div className="text-xs sm:text-sm text-provn-muted">Views</div>
                            </div>
                            
                            <div className="text-center hidden sm:block">
                              <div className="text-sm sm:text-lg font-semibold text-provn-text">
                                {formatNumber(creator.total_earnings)}
                              </div>
                              <div className="text-xs sm:text-sm text-provn-muted">wCAMP</div>
                            </div>
                            
                            <div className="text-center hidden lg:block">
                              <div className="text-sm sm:text-lg font-semibold text-provn-text">
                                {creator.streak_days}
                              </div>
                              <div className="text-xs sm:text-sm text-provn-muted">Streak</div>
                            </div>

                            {/* View Profile Button */}
                            <ProvnButton
                              variant="secondary"
                              size="sm"
                              onClick={() => window.location.href = `/u/${creator.handle}`}
                              className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                              View
                            </ProvnButton>
                          </div>

                          {/* Mobile-only additional stats */}
                          <div className="flex justify-around pt-3 border-t border-provn-border/30 sm:hidden">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-provn-text">
                                {formatNumber(creator.total_views)}
                              </div>
                              <div className="text-xs text-provn-muted">Views</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold text-provn-text">
                                {formatNumber(creator.total_earnings)}
                              </div>
                              <div className="text-xs text-provn-muted">wCAMP</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold text-provn-text">
                                {creator.streak_days}
                              </div>
                              <div className="text-xs text-provn-muted">Streak</div>
                            </div>
                          </div>
                        </div>
                      </ProvnCardContent>
                    </ProvnCard>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Category Overview */}
        {categories.length > 0 && (
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="font-headline text-2xl font-bold text-provn-text mb-6">
              🎯 Compete by Category
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.slice(0, 6).map((category, index) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedCategory(category.category)}
                  className="cursor-pointer"
                >
                  <ProvnCard className="hover:ring-2 hover:ring-provn-accent transition-all">
                    <ProvnCardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">{category.emoji}</div>
                      <h3 className="font-semibold text-provn-text mb-2 capitalize">
                        {category.category}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Creators:</span>
                          <span className="text-provn-text font-medium">{category.total_creators}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Competition:</span>
                          <ProvnBadge 
                            variant={
                              category.competition_level === 'intense' ? 'error' :
                              category.competition_level === 'high' ? 'warning' :
                              category.competition_level === 'medium' ? 'default' : 'verified'
                            }
                            className="text-xs"
                          >
                            {category.competition_level}
                          </ProvnBadge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Growth:</span>
                          <span className={`font-medium ${category.growth_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {category.growth_rate >= 0 ? '+' : ''}{category.growth_rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </ProvnCardContent>
                  </ProvnCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <ProvnCard className="bg-gradient-to-r from-provn-accent/10 to-provn-surface border-provn-accent/20">
            <ProvnCardContent className="p-8">
              <h2 className="font-headline text-2xl font-bold text-provn-text mb-4">
                Ready to Climb the Ranks? 🚀
              </h2>
              <p className="text-provn-muted mb-6 max-w-2xl mx-auto">
                Create amazing content, engage with the community, and watch your score soar. 
                Every view, tip, and license brings you closer to the top!
              </p>
              <div className="flex gap-4 justify-center">
                <ProvnButton onClick={() => window.location.href = '/upload'}>
                  🎬 Create Content
                </ProvnButton>
                <ProvnButton variant="secondary" onClick={() => window.location.href = '/explore'}>
                  🔍 Explore Feed
                </ProvnButton>
              </div>
            </ProvnCardContent>
          </ProvnCard>
        </motion.div>
      </main>
    </div>
  )
}