"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { useWalletAuth } from "@/components/provn/wallet-connection"
import ProfileSetup from "@/components/provn/profile-setup"
import { TrendingUp, DollarSign, Eye, Users, Video, Heart, Share, Download } from "lucide-react"

interface UserProfile {
  address: string
  handle: string
  displayName: string
  bio: string
  avatarUrl?: string
  createdAt: string
  videoCount: number
  totalEarnings: number
}

interface VideoData {
  tokenId: string
  title: string
  description: string
  ipfsHash: string
  transactionHash: string
  createdAt: string
  status: string
  allowRemixing: boolean
  views: number
  tips: number
  licenses: number
  earnings: number
  tags: string[]
}

interface DashboardStats {
  totalVideos: number
  totalViews: number
  totalEarnings: number
  totalTips: number
  totalLicenses: number
  monthlyGrowth: {
    videos: number
    views: number
    earnings: number
  }
}

export default function DashboardPage() {
  const { address, isConnected } = useWalletAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [videos, setVideos] = useState<VideoData[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      loadDashboardData()
    }
  }, [isConnected, address])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load user profile
      await loadUserProfile()
      
      // Load dashboard analytics
      await loadDashboardAnalytics()
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${address}/profile`)
      if (response.status === 404) {
        // User doesn't have a profile yet
        setShowProfileSetup(true)
        return
      }
      
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
      } else {
        throw new Error('Failed to load profile')
      }
    } catch (error) {
      console.error('Profile load error:', error)
      // If profile doesn't exist, show setup
      setShowProfileSetup(true)
    }
  }

  const loadDashboardAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/dashboard`, {
        headers: {
          'X-Wallet-Address': address || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setVideos(data.videos || [])
      }
    } catch (error) {
      console.error('Analytics load error:', error)
      // Set default empty stats
      setStats({
        totalVideos: 0,
        totalViews: 0,
        totalEarnings: 0,
        totalTips: 0,
        totalLicenses: 0,
        monthlyGrowth: { videos: 0, views: 0, earnings: 0 }
      })
    }
  }

  const handleProfileCreated = (newProfile: any) => {
    setProfile(newProfile)
    setShowProfileSetup(false)
    // Reload dashboard data
    loadDashboardData()
  }

  const handleSkipProfile = () => {
    setShowProfileSetup(false)
    // Load analytics anyway
    loadDashboardAnalytics()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="dashboard" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="font-headline text-4xl font-bold text-provn-text mb-8">Creator Dashboard</h1>
            <div className="max-w-md mx-auto bg-provn-surface border border-provn-border rounded-xl p-8">
              <h2 className="text-xl font-semibold text-provn-text mb-4">Connect Your Wallet</h2>
              <p className="text-provn-muted mb-6">
                Connect your wallet to access your creator dashboard and start managing your content.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="dashboard" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ProfileSetup 
            onProfileCreated={handleProfileCreated}
            onSkip={handleSkipProfile}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="dashboard" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-provn-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-provn-muted">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="dashboard" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="font-headline text-4xl font-bold text-provn-text mb-8">Creator Dashboard</h1>
            <div className="max-w-md mx-auto bg-red-900/20 border border-red-500/30 rounded-xl p-8">
              <h2 className="text-xl font-semibold text-red-400 mb-4">Error Loading Dashboard</h2>
              <p className="text-red-300 mb-6">{error}</p>
              <ProvnButton onClick={loadDashboardData}>Try Again</ProvnButton>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-headline text-4xl font-bold text-provn-text">
                {profile ? `Welcome back, ${profile.displayName}!` : 'Creator Dashboard'}
              </h1>
              <p className="text-provn-muted mt-2">
                {profile ? `@${profile.handle}` : `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </p>
            </div>
            <div className="flex gap-4">
              <ProvnButton 
                variant="secondary"
                onClick={() => window.location.href = '/upload'}
              >
                Upload Video
              </ProvnButton>
              {profile && (
                <ProvnButton 
                  variant="secondary"
                  onClick={() => window.location.href = `/profile/${profile.handle}`}
                >
                  View Profile
                </ProvnButton>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ProvnCard>
              <ProvnCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-provn-muted text-sm font-medium">Total Videos</p>
                    <p className="text-2xl font-bold text-provn-text">{stats.totalVideos}</p>
                  </div>
                  <div className="w-12 h-12 bg-provn-accent/20 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-provn-accent" />
                  </div>
                </div>
                {stats.monthlyGrowth.videos > 0 && (
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm">+{stats.monthlyGrowth.videos} this month</span>
                  </div>
                )}
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard>
              <ProvnCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-provn-muted text-sm font-medium">Total Views</p>
                    <p className="text-2xl font-bold text-provn-text">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                {stats.monthlyGrowth.views > 0 && (
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm">+{stats.monthlyGrowth.views.toLocaleString()} this month</span>
                  </div>
                )}
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard>
              <ProvnCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-provn-muted text-sm font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold text-provn-text">{formatCurrency(stats.totalEarnings)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                {stats.monthlyGrowth.earnings > 0 && (
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm">+{formatCurrency(stats.monthlyGrowth.earnings)} this month</span>
                  </div>
                )}
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard>
              <ProvnCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-provn-muted text-sm font-medium">Tips Received</p>
                    <p className="text-2xl font-bold text-provn-text">{stats.totalTips}</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-400" />
                  </div>
                </div>
              </ProvnCardContent>
            </ProvnCard>
          </div>
        )}

        {/* Video Content */}
        <div className="space-y-8">
          {/* Recent Videos */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-2xl font-bold text-provn-text">Your Videos</h2>
              <ProvnButton 
                variant="secondary" 
                size="sm"
                onClick={() => window.location.href = '/upload'}
              >
                Upload New Video
              </ProvnButton>
            </div>

            {videos.length === 0 ? (
              <ProvnCard>
                <ProvnCardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-provn-surface-2 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-provn-muted" />
                  </div>
                  <h3 className="text-xl font-semibold text-provn-text mb-2">No videos yet</h3>
                  <p className="text-provn-muted mb-6">
                    Start by uploading your first video to protect it on the blockchain.
                  </p>
                  <ProvnButton onClick={() => window.location.href = '/upload'}>
                    Upload Your First Video
                  </ProvnButton>
                </ProvnCardContent>
              </ProvnCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <ProvnCard key={video.tokenId} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <ProvnCardContent className="p-0">
                      <div className="aspect-video bg-provn-surface-2 rounded-t-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-provn-accent/20 to-provn-accent/5 flex items-center justify-center">
                          <Video className="w-12 h-12 text-provn-accent/60" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <ProvnBadge variant={video.status === 'active' ? 'success' : 'default'}>
                            {video.status === 'active' ? 'Minted' : video.status}
                          </ProvnBadge>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-provn-text truncate">{video.title}</h3>
                          <p className="text-provn-muted text-sm">Token ID: {video.tokenId}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {video.tags.map((tag) => (
                            <span 
                              key={tag}
                              className="px-2 py-1 bg-provn-surface text-provn-muted text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-provn-text font-semibold">{video.views}</p>
                            <p className="text-provn-muted">Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-provn-text font-semibold">{video.tips}</p>
                            <p className="text-provn-muted">Tips</p>
                          </div>
                          <div className="text-center">
                            <p className="text-provn-text font-semibold">{formatCurrency(video.earnings)}</p>
                            <p className="text-provn-muted">Earned</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-provn-border">
                          <span className="text-provn-muted text-xs">
                            {formatDate(video.createdAt)}
                          </span>
                          <ProvnButton 
                            size="sm" 
                            variant="secondary"
                            onClick={() => window.location.href = `/video/${video.tokenId}`}
                          >
                            View
                          </ProvnButton>
                        </div>
                      </div>
                    </ProvnCardContent>
                  </ProvnCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}