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
  Search,
  Award,
  Lock,
  CheckCircle,
  Flame,
  Target,
  TrendingUp,
  Eye,
  Share2,
  Sparkles,
  Shield,
  Rocket,
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"

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
  criteria: {
    derivatives_created?: number
    licenses_sold?: number
    community_members?: number
    total_revenue?: number
    tips_received?: number
    communities_joined?: number
  }
}

interface ApiResponse {
  success: boolean
  achievements: Achievement[]
  userStats?: any
  totalPoints: number
}

interface AchievementsPanelProps {
  userAddress?: string
  className?: string
}

const categoryConfig = {
  creator: {
    icon: Video,
    label: 'Creator',
    color: 'text-provn-accent'
  },
  community: {
    icon: Users,
    label: 'Community', 
    color: 'text-blue-400'
  },
  social: {
    icon: Heart,
    label: 'Social',
    color: 'text-pink-400'
  },
  revenue: {
    icon: DollarSign,
    label: 'Revenue',
    color: 'text-green-400'
  }
}

const rarityConfig = {
  common: {
    label: 'Common',
    color: 'text-gray-400'
  },
  rare: {
    label: 'Rare',
    color: 'text-blue-400'
  },
  epic: {
    label: 'Epic',
    color: 'text-purple-400'
  },
  legendary: {
    label: 'Legendary',
    color: 'text-yellow-400'
  }
}

// Icon mapping
const getIconFromEmoji = (emoji: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    '🎬': Video,
    '🎭': Award,
    '🎨': Trophy,
    '👑': Crown,
    '💰': DollarSign,
    '💎': Sparkles,
    '🏆': Trophy,
    '🏗️': Users,
    '🏘️': Users,
    '🏙️': Crown,
    '🦋': Heart,
    '🎁': Heart,
    '❤️': Heart
  }
  return iconMap[emoji] || Award
}

// Default empty achievements for initial state
const defaultAchievements: Achievement[] = []

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ 
  userAddress, 
  className = "" 
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements)
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>(defaultAchievements)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<any>(null)

  // Fetch achievements from API
  useEffect(() => {
    if (!userAddress) {
      setLoading(false)
      return
    }

    const fetchAchievements = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/achievements?user=${userAddress}`)
        const data: ApiResponse = await response.json()
        
        if (data.success) {
          setAchievements(data.achievements)
          setTotalPoints(data.totalPoints)
          setUserStats(data.userStats)
        } else {
          setError('Failed to load achievements')
        }
      } catch (err) {
        console.error('Error fetching achievements:', err)
        setError('Failed to load achievements')
      } finally {
        setLoading(false)
      }
    }

    fetchAchievements()
  }, [userAddress])

  // Filter achievements based on selected filters
  useEffect(() => {
    let filtered = achievements

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory)
    }

    if (selectedRarity !== 'all') {
      filtered = filtered.filter(achievement => achievement.rarity === selectedRarity)
    }

    if (showUnlockedOnly) {
      filtered = filtered.filter(achievement => achievement.isUnlocked)
    }

    if (searchQuery) {
      filtered = filtered.filter(achievement => 
        achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredAchievements(filtered)
  }, [achievements, selectedCategory, selectedRarity, showUnlockedOnly, searchQuery])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Stats */}
      <ProvnCard>
        <ProvnCardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-provn-text font-headline">
                Achievements
              </h2>
              <p className="text-provn-muted">
                Track your progress and unlock exclusive rewards
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="text-center lg:text-right">
                <div className="text-3xl font-bold text-provn-accent">
                  {totalPoints.toLocaleString()}
                </div>
                <div className="text-sm text-provn-muted">Total Points</div>
              </div>
              <div className="text-center lg:text-right">
                <div className="text-3xl font-bold text-provn-text">
                  {achievements.filter(a => a.isUnlocked).length}/{achievements.length}
                </div>
                <div className="text-sm text-provn-muted">Unlocked</div>
              </div>
            </div>
          </div>

          {/* Progress calculated inline - no separate progress bar needed */}
        </ProvnCardContent>
      </ProvnCard>

      {/* Filters */}
      <ProvnCard>
        <ProvnCardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-provn-muted" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-provn-bg border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-provn-bg border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Rarity Filter */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="px-4 py-2 bg-provn-bg border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
            >
              <option value="all">All Rarities</option>
              {Object.entries(rarityConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Unlocked Only Toggle */}
            <ProvnButton
              variant={showUnlockedOnly ? "primary" : "secondary"}
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className="px-4"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Unlocked Only
            </ProvnButton>
          </div>
        </ProvnCardContent>
      </ProvnCard>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAchievements.map((achievement) => (
            <CompactAchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredAchievements.length === 0 && (
        <ProvnCard>
          <ProvnCardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-provn-muted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-provn-text mb-2">
              No achievements found
            </h3>
            <p className="text-provn-muted">
              Try adjusting your filters or search query
            </p>
          </ProvnCardContent>
        </ProvnCard>
      )}
    </div>
  )
}

// Compact Achievement Card Component
const CompactAchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const categoryConfig_ = categoryConfig[achievement.category]
  const rarityConfig_ = rarityConfig[achievement.rarity]
  const IconComponent = getIconFromEmoji(achievement.icon)
  
  // Calculate progress from criteria
  const criteriaKey = Object.keys(achievement.criteria)[0] as keyof typeof achievement.criteria
  const required = achievement.criteria[criteriaKey] || 1
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <ProvnCard className={`hover:bg-provn-surface-2 transition-colors ${
        achievement.isUnlocked ? 'bg-provn-surface-2/50' : ''
      }`}>
        <ProvnCardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`p-2 rounded-lg bg-provn-surface-2 ${
              achievement.isUnlocked ? categoryConfig_.color : 'text-provn-muted'
            }`}>
              <IconComponent className="w-4 h-4" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className={`text-sm font-medium font-headline truncate ${
                  achievement.isUnlocked ? 'text-provn-text' : 'text-provn-muted'
                }`}>
                  {achievement.name}
                </h3>
                {achievement.isUnlocked && (
                  <CheckCircle className="w-3 h-3 text-green-500 ml-1 flex-shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-provn-muted mb-2 line-clamp-2">
                {achievement.description}
              </p>
              
              {/* Progress */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-provn-muted">
                    {achievement.progress}%
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${rarityConfig_.color}`}>
                      {rarityConfig_.label}
                    </span>
                    <span className="text-xs text-provn-accent font-medium">
                      +{achievement.points}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-provn-surface rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-500 ${
                      achievement.isUnlocked 
                        ? 'bg-provn-accent' 
                        : 'bg-provn-muted'
                    }`}
                    style={{ width: `${Math.min(achievement.progress, 100)}%` }}
                  />
                </div>
              </div>
              
              {/* Unlock date */}
              {achievement.isUnlocked && achievement.unlockedAt && (
                <div className="text-xs text-green-500">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </ProvnCardContent>
      </ProvnCard>
    </motion.div>
  )
}

export default AchievementsPanel
export { type Achievement, type AchievementsPanelProps }