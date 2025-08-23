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
  CheckCircle,
  Flame,
  Target,
  TrendingUp,
  Eye,
  Share2,
  Sparkles,
  Shield,
  Rocket
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'creator' | 'community' | 'social' | 'revenue' | 'milestone' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  points: number
  isUnlocked: boolean
  progress: number
  maxProgress: number
  unlockedAt?: string
  reward?: string
  tier: number
}

interface AchievementsPanelProps {
  userAddress?: string
  className?: string
}

const categoryConfig = {
  creator: {
    icon: Video,
    label: 'Creator',
    color: 'from-provn-accent to-orange-500',
    bgColor: 'bg-gradient-to-br from-provn-accent/10 to-orange-500/10',
    borderColor: 'border-provn-accent/30'
  },
  community: {
    icon: Users,
    label: 'Community',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-500/30'
  },
  social: {
    icon: Heart,
    label: 'Social',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-gradient-to-br from-pink-500/10 to-rose-500/10',
    borderColor: 'border-pink-500/30'
  },
  revenue: {
    icon: DollarSign,
    label: 'Revenue',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/30'
  },
  milestone: {
    icon: Target,
    label: 'Milestone',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-gradient-to-br from-purple-500/10 to-violet-500/10',
    borderColor: 'border-purple-500/30'
  },
  special: {
    icon: Crown,
    label: 'Special',
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10',
    borderColor: 'border-yellow-500/30'
  }
}

const rarityConfig = {
  common: {
    label: 'Common',
    color: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-500/20',
    points: '10-50',
    probability: '60%'
  },
  rare: {
    label: 'Rare',
    color: 'from-blue-400 to-blue-600',
    glow: 'shadow-blue-500/30',
    points: '50-150',
    probability: '25%'
  },
  epic: {
    label: 'Epic',
    color: 'from-purple-400 to-purple-600',
    glow: 'shadow-purple-500/40',
    points: '150-500',
    probability: '10%'
  },
  legendary: {
    label: 'Legendary',
    color: 'from-yellow-400 to-orange-500',
    glow: 'shadow-yellow-500/50',
    points: '500-1500',
    probability: '4%'
  },
  mythic: {
    label: 'Mythic',
    color: 'from-pink-400 via-purple-500 to-indigo-500',
    glow: 'shadow-pink-500/60',
    points: '1500+',
    probability: '1%'
  }
}

// Icon mapping
const getIcon = (iconName: string) => {
  const icons: { [key: string]: React.ComponentType<any> } = {
    trophy: Trophy,
    star: Star,
    crown: Crown,
    zap: Zap,
    users: Users,
    video: Video,
    dollar: DollarSign,
    heart: Heart,
    award: Award,
    flame: Flame,
    target: Target,
    trending: TrendingUp,
    eye: Eye,
    share: Share2,
    sparkles: Sparkles,
    shield: Shield,
    rocket: Rocket
  }
  return icons[iconName] || Trophy
}

// Sample achievements data - in production this would come from API
const sampleAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Upload your first video to the platform',
    icon: 'rocket',
    category: 'creator',
    rarity: 'common',
    points: 25,
    isUnlocked: true,
    progress: 1,
    maxProgress: 1,
    unlockedAt: '2024-01-15',
    reward: '+25 Creator Points',
    tier: 1
  },
  {
    id: '2',
    name: 'Rising Star',
    description: 'Get 100 views on a single video',
    icon: 'star',
    category: 'creator',
    rarity: 'rare',
    points: 100,
    isUnlocked: true,
    progress: 150,
    maxProgress: 100,
    unlockedAt: '2024-01-18',
    reward: '+100 Creator Points',
    tier: 1
  },
  {
    id: '3',
    name: 'Viral Creator',
    description: 'Reach 10,000 views across all videos',
    icon: 'flame',
    category: 'creator',
    rarity: 'epic',
    points: 500,
    isUnlocked: false,
    progress: 7580,
    maxProgress: 10000,
    tier: 2
  },
  {
    id: '4',
    name: 'Community Builder',
    description: 'Get 50 followers on your profile',
    icon: 'users',
    category: 'community',
    rarity: 'rare',
    points: 150,
    isUnlocked: false,
    progress: 28,
    maxProgress: 50,
    tier: 1
  },
  {
    id: '5',
    name: 'Revenue Royalty',
    description: 'Earn 1000 CAMP tokens from licensing',
    icon: 'crown',
    category: 'revenue',
    rarity: 'legendary',
    points: 1000,
    isUnlocked: false,
    progress: 125,
    maxProgress: 1000,
    tier: 3
  },
  {
    id: '6',
    name: 'Platform Pioneer',
    description: 'Be among the first 100 creators on Provn',
    icon: 'shield',
    category: 'special',
    rarity: 'mythic',
    points: 2500,
    isUnlocked: true,
    progress: 1,
    maxProgress: 1,
    unlockedAt: '2024-01-10',
    reward: 'Exclusive Pioneer Badge + 2500 Points',
    tier: 4
  },
  {
    id: '7',
    name: 'Social Butterfly',
    description: 'Like 100 videos from other creators',
    icon: 'heart',
    category: 'social',
    rarity: 'common',
    points: 50,
    isUnlocked: false,
    progress: 73,
    maxProgress: 100,
    tier: 1
  },
  {
    id: '8',
    name: 'License Master',
    description: 'Have your content licensed 25 times',
    icon: 'sparkles',
    category: 'revenue',
    rarity: 'epic',
    points: 750,
    isUnlocked: false,
    progress: 8,
    maxProgress: 25,
    tier: 2
  }
]

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ 
  userAddress, 
  className = "" 
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>(sampleAchievements)
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>(sampleAchievements)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalPoints, setTotalPoints] = useState(0)

  // Calculate total points from unlocked achievements
  useEffect(() => {
    const points = achievements
      .filter(achievement => achievement.isUnlocked)
      .reduce((sum, achievement) => sum + achievement.points, 0)
    setTotalPoints(points)
  }, [achievements])

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

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const progressPercentage = Math.round((unlockedCount / achievements.length) * 100)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Stats */}
      <ProvnCard>
        <ProvnCardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-provn-text mb-2 font-headline">
                🏆 Achievements
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
                  {unlockedCount}/{achievements.length}
                </div>
                <div className="text-sm text-provn-muted">Unlocked</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-provn-text">
                Overall Progress
              </span>
              <span className="text-sm font-medium text-provn-accent">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-provn-surface rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-provn-accent to-orange-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
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
              variant={showUnlockedOnly ? "default" : "secondary"}
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
            <AchievementCard
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

// Individual Achievement Card Component
const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const categoryConfig_ = categoryConfig[achievement.category]
  const rarityConfig_ = rarityConfig[achievement.rarity]
  const IconComponent = getIcon(achievement.icon)
  const progressPercentage = Math.min((achievement.progress / achievement.maxProgress) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <ProvnCard 
        className={`
          relative overflow-hidden transition-all duration-300 hover:scale-105
          ${achievement.isUnlocked ? rarityConfig_.glow : 'hover:shadow-lg'}
          ${categoryConfig_.borderColor} border-2
        `}
      >
        <ProvnCardContent className="p-6">
          {/* Rarity Badge */}
          <div className="absolute top-4 right-4">
            <div className={`
              px-2 py-1 rounded-full text-xs font-bold text-white
              bg-gradient-to-r ${rarityConfig_.color}
            `}>
              {rarityConfig_.label}
            </div>
          </div>

          {/* Lock/Unlock Indicator */}
          <div className="absolute top-4 left-4">
            {achievement.isUnlocked ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
              </motion.div>
            ) : (
              <Lock className="w-5 h-5 text-provn-muted" />
            )}
          </div>

          {/* Achievement Icon */}
          <div className="flex justify-center mb-4 mt-8">
            <div className={`
              p-4 rounded-full ${categoryConfig_.bgColor}
              ${achievement.isUnlocked ? 'animate-pulse' : ''}
            `}>
              <IconComponent className={`
                w-8 h-8 bg-gradient-to-r ${categoryConfig_.color} bg-clip-text text-transparent
                ${achievement.isUnlocked ? 'filter-none' : 'opacity-50'}
              `} />
            </div>
          </div>

          {/* Achievement Info */}
          <div className="text-center mb-4">
            <h3 className={`
              text-lg font-bold mb-2 font-headline
              ${achievement.isUnlocked ? 'text-provn-text' : 'text-provn-muted'}
            `}>
              {achievement.name}
            </h3>
            <p className={`
              text-sm mb-3
              ${achievement.isUnlocked ? 'text-provn-text' : 'text-provn-muted'}
            `}>
              {achievement.description}
            </p>

            {/* Points */}
            <div className={`
              inline-flex items-center px-3 py-1 rounded-full text-sm font-bold
              ${achievement.isUnlocked 
                ? 'bg-provn-accent/20 text-provn-accent' 
                : 'bg-provn-surface text-provn-muted'
              }
            `}>
              <Star className="w-3 h-3 mr-1" />
              {achievement.points} pts
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-provn-muted">
                Progress
              </span>
              <span className="text-xs font-medium text-provn-text">
                {achievement.progress.toLocaleString()} / {achievement.maxProgress.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-provn-surface rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full bg-gradient-to-r ${categoryConfig_.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Unlock Date or Reward */}
          {achievement.isUnlocked ? (
            <div className="text-center">
              <div className="text-xs text-provn-muted mb-1">Unlocked</div>
              <div className="text-xs font-medium text-provn-accent">
                {new Date(achievement.unlockedAt!).toLocaleDateString()}
              </div>
              {achievement.reward && (
                <div className="text-xs text-green-500 mt-1">
                  {achievement.reward}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-xs text-provn-muted">
                {Math.round(progressPercentage)}% Complete
              </div>
              <div className="text-xs text-provn-accent mt-1">
                Tier {achievement.tier}
              </div>
            </div>
          )}
        </ProvnCardContent>
      </ProvnCard>
    </motion.div>
  )
}

export default AchievementsPanel
export { type Achievement, type AchievementsPanelProps }