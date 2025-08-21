"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Trophy,
  Star,
  Crown,
  Zap,
  Users,
  Video,
  DollarSign,
  Heart,
  Filter,
  Search,
  Award,
  Lock,
  CheckCircle
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { ProvnBrandLoader } from "@/components/common/LoadingStates"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'creator' | 'community' | 'social' | 'revenue'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  isUnlocked: boolean
  progress: number
  unlockedAt?: string
}

interface AchievementsPanelProps {
  userAddress?: string
}

const categoryIcons = {
  creator: Video,
  community: Users,
  social: Heart,
  revenue: DollarSign
}

const rarityColors = {
  common: 'text-gray-500 bg-gray-100 border-gray-200',
  rare: 'text-blue-500 bg-blue-100 border-blue-200',
  epic: 'text-purple-500 bg-purple-100 border-purple-200',
  legendary: 'text-yellow-500 bg-yellow-100 border-yellow-200'
}

const rarityBadgeColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500'
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const CategoryIcon = categoryIcons[achievement.category]
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative p-4 rounded-xl border transition-all duration-300 ${
        achievement.isUnlocked
          ? 'bg-provn-surface border-provn-accent/30 shadow-sm'
          : 'bg-provn-surface/50 border-provn-border/50'
      }`}
    >
      {/* Rarity Badge */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white ${rarityBadgeColors[achievement.rarity]}`}>
        {achievement.rarity}
      </div>

      {/* Achievement Icon */}
      <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl mb-4 ${
        achievement.isUnlocked 
          ? rarityColors[achievement.rarity]
          : 'text-provn-muted bg-provn-surface-2 border-provn-border'
      }`}>
        {achievement.isUnlocked ? achievement.icon : <Lock className="w-6 h-6" />}
      </div>

      {/* Achievement Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${achievement.isUnlocked ? 'text-provn-text' : 'text-provn-muted'}`}>
            {achievement.name}
          </h3>
          {achievement.isUnlocked && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>
        
        <p className={`text-sm ${achievement.isUnlocked ? 'text-provn-muted' : 'text-provn-muted/70'}`}>
          {achievement.description}
        </p>

        {/* Progress Bar */}
        {!achievement.isUnlocked && achievement.progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-provn-muted">Progress</span>
              <span className="text-provn-accent font-medium">{achievement.progress}%</span>
            </div>
            <div className="w-full bg-provn-surface-2 rounded-full h-2">
              <div
                className="bg-provn-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Points and Category */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-provn-muted">
            <CategoryIcon className="w-3 h-3" />
            <span className="capitalize">{achievement.category}</span>
          </div>
          <div className="flex items-center gap-1 text-provn-accent font-medium">
            <Award className="w-3 h-3" />
            <span>{achievement.points}pts</span>
          </div>
        </div>

        {/* Unlock Date */}
        {achievement.isUnlocked && achievement.unlockedAt && (
          <div className="text-xs text-provn-muted">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function AchievementsPanel({ userAddress }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    fetchAchievements()
  }, [userAddress, selectedCategory])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (userAddress) params.set('user', userAddress)
      if (selectedCategory !== 'all') params.set('category', selectedCategory)

      const response = await fetch(`/api/achievements?${params}`)
      const data = await response.json()

      if (data.success) {
        setAchievements(data.achievements)
        setUserStats(data.userStats)
        setTotalPoints(data.totalPoints)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRarity = selectedRarity === 'all' || achievement.rarity === selectedRarity
    const matchesUnlocked = !showUnlockedOnly || achievement.isUnlocked
    
    return matchesSearch && matchesRarity && matchesUnlocked
  })

  const categories = ['all', 'creator', 'community', 'social', 'revenue']
  const rarities = ['all', 'common', 'rare', 'epic', 'legendary']

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalCount = achievements.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ProvnBrandLoader size="lg" message="Loading achievements" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">{unlockedCount}</div>
          <div className="text-sm text-provn-muted">Unlocked</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">{totalCount}</div>
          <div className="text-sm text-provn-muted">Total</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-accent">{totalPoints}</div>
          <div className="text-sm text-provn-muted">Points</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">
            {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
          </div>
          <div className="text-sm text-provn-muted">Complete</div>
        </div>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
          <h3 className="font-semibold text-provn-text mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-provn-text">{userStats.derivatives_created}</div>
              <div className="text-xs text-provn-muted">Derivatives</div>
            </div>
            <div>
              <div className="text-lg font-bold text-provn-text">{userStats.licenses_sold}</div>
              <div className="text-xs text-provn-muted">Licenses</div>
            </div>
            <div>
              <div className="text-lg font-bold text-provn-text">${userStats.total_revenue}</div>
              <div className="text-xs text-provn-muted">Revenue</div>
            </div>
            <div>
              <div className="text-lg font-bold text-provn-text">{userStats.tips_received}</div>
              <div className="text-xs text-provn-muted">Tips</div>
            </div>
            <div>
              <div className="text-lg font-bold text-provn-text">{userStats.community_members}</div>
              <div className="text-xs text-provn-muted">Community Size</div>
            </div>
            <div>
              <div className="text-lg font-bold text-provn-text">{userStats.communities_joined}</div>
              <div className="text-xs text-provn-muted">Joined</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-provn-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>

        {/* Rarity Filter */}
        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
        >
          {rarities.map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity === 'all' ? 'All Rarities' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </option>
          ))}
        </select>

        {/* Show Unlocked Only */}
        <label className="flex items-center gap-2 px-3 py-2 bg-provn-surface border border-provn-border rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={showUnlockedOnly}
            onChange={(e) => setShowUnlockedOnly(e.target.checked)}
            className="w-4 h-4 text-provn-accent border-provn-border rounded focus:ring-provn-accent"
          />
          <span className="text-sm text-provn-text">Unlocked only</span>
        </label>
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20">
          <Trophy className="w-20 h-20 text-provn-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-provn-text mb-2">No achievements found</h3>
          <p className="text-provn-muted">
            {searchTerm || selectedCategory !== 'all' || selectedRarity !== 'all' || showUnlockedOnly
              ? "Try adjusting your filters to see more achievements."
              : "Start creating content to unlock your first achievements!"
            }
          </p>
        </div>
      )}
    </div>
  )
}