"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
// Icons replaced with emojis for compatibility

interface VideoStats {
  id: string
  title: string
  thumbnail: string
  views: number
  tips: number
  licenses: number
  earnings: number
  createdAt: string
  status: "minted" | "processing" | "failed"
}

interface Campaign {
  id: string
  videoId: string
  videoTitle: string
  videoThumbnail: string
  budget: number
  spent: number
  duration: number
  startDate: string
  endDate: string
  status: "active" | "paused" | "completed" | "draft"
  stats: {
    impressions: number
    clicks: number
    engagement: number
    ctr: number
    roi: number
  }
}

// Mock data - in real app this would come from API
const mockVideos: VideoStats[] = [
  {
    id: "1",
    title: "Creative Dance Routine",
    thumbnail: "/short-form-video.png?height=200&width=112&query=dance routine",
    views: 1250,
    tips: 25,
    licenses: 3,
    earnings: 47.5,
    createdAt: "2024-01-15",
    status: "minted",
  },
  {
    id: "2",
    title: "Urban Art Tutorial",
    thumbnail: "/short-form-video.png?height=200&width=112&query=art tutorial",
    views: 890,
    tips: 18,
    licenses: 1,
    earnings: 28.0,
    createdAt: "2024-01-12",
    status: "minted",
  },
  {
    id: "3",
    title: "Cooking Experiment",
    thumbnail: "/short-form-video.png?height=200&width=112&query=cooking video",
    views: 2100,
    tips: 42,
    licenses: 5,
    earnings: 92.0,
    createdAt: "2024-01-10",
    status: "minted",
  },
  {
    id: "4",
    title: "Music Production Tips",
    thumbnail: "/short-form-video.png?height=200&width=112&query=music production",
    views: 0,
    tips: 0,
    licenses: 0,
    earnings: 0,
    createdAt: "2024-01-16",
    status: "processing",
  },
]

const mockCampaigns: Campaign[] = [
  {
    id: "camp_001",
    videoId: "1",
    videoTitle: "Creative Dance Routine",
    videoThumbnail: "/dance-creator-avatar.png",
    budget: 100,
    spent: 45.5,
    duration: 7,
    startDate: "2024-03-01",
    endDate: "2024-03-08",
    status: "active",
    stats: {
      impressions: 12500,
      clicks: 890,
      engagement: 156,
      ctr: 7.1,
      roi: 2.3,
    },
  },
  {
    id: "camp_002",
    videoId: "2",
    videoTitle: "Digital Art Process",
    videoThumbnail: "/digital-artist-avatar.png",
    budget: 50,
    spent: 50,
    duration: 5,
    startDate: "2024-02-20",
    endDate: "2024-02-25",
    status: "completed",
    stats: {
      impressions: 8200,
      clicks: 654,
      engagement: 89,
      ctr: 8.0,
      roi: 1.8,
    },
  },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "videos" | "campaigns" | "earnings" | "profile">("overview")
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string>("")
  const [campaignBudget, setCampaignBudget] = useState<number>(50)
  const [campaignDuration, setCampaignDuration] = useState<number>(7)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [userVideos, setUserVideos] = useState<VideoStats[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // In real app, get current user address from wallet context
        const currentUserAddress = "0x1234567890abcdef1234567890abcdef12345678"
        
        // Fetch analytics data
        const analyticsResponse = await fetch(`/api/analytics/dashboard?address=${currentUserAddress}`)
        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json()
          setAnalyticsData(data)
        }

        // Fetch user's videos
        const videosResponse = await fetch(`/api/videos?creator=${currentUserAddress}&includeDerivatives=true&limit=50`)
        if (videosResponse.ok) {
          const videosData = await videosResponse.json()
          
          // Transform to VideoStats format
          const transformedVideos: VideoStats[] = videosData.videos.map((video: any) => ({
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnailUrl,
            views: video.stats.views,
            tips: video.stats.tips,
            licenses: video.licensing.available ? 1 : 0, // Simplified
            earnings: video.stats.tips * 2.5 + (video.licensing.available ? 10 : 0), // Rough calculation
            createdAt: video.createdAt,
            status: video.status as "minted" | "processing" | "failed",
          }))

          setUserVideos(transformedVideos)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Calculate totals from analytics data or fallback to user videos
  const totalEarnings = analyticsData?.overview?.totalEarnings || userVideos.reduce((sum, video) => sum + video.earnings, 0)
  const totalViews = analyticsData?.overview?.totalViews || userVideos.reduce((sum, video) => sum + video.views, 0)
  const totalTips = analyticsData?.overview?.totalTips || userVideos.reduce((sum, video) => sum + video.tips, 0)
  const totalLicenses = analyticsData?.overview?.totalLicenses || userVideos.reduce((sum, video) => sum + video.licenses, 0)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleCreateCampaign = () => {
    // TODO: Implement campaign creation
    console.log("Creating campaign:", { selectedVideo, campaignBudget, campaignDuration })
    setShowCampaignModal(false)
  }

  const handleCampaignAction = (campaignId: string, action: "pause" | "resume" | "edit" | "delete") => {
    // TODO: Implement campaign actions
    console.log("Campaign action:", { campaignId, action })
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="dashboard" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-provn-muted">Loading dashboard...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-headline text-3xl font-bold text-provn-text mb-2">Creator Dashboard</h1>
              <p className="text-provn-muted">
                Connected: {formatAddress("0x1234567890abcdef1234567890abcdef12345678")}
              </p>
            </div>
            <div className="flex gap-3">
              <ProvnButton variant="secondary" onClick={() => (window.location.href = "/profile/creativedancer")}>
                View Profile
              </ProvnButton>
              <ProvnButton onClick={() => (window.location.href = "/upload")}>Upload New Video</ProvnButton>
            </div>
          </div>

          {/* Enhanced Stats Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProvnCard>
              <ProvnCardContent className="p-6 text-center">
                <div className="text-3xl font-headline font-bold text-provn-text mb-1">{totalEarnings.toFixed(1)}</div>
                <div className="text-provn-muted text-sm mb-2">wCAMP Earned</div>
                <div className="text-xs text-green-400">+8.3% from last month</div>
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard>
              <ProvnCardContent className="p-6 text-center">
                <div className="text-3xl font-headline font-bold text-provn-text mb-1">
                  {totalViews.toLocaleString()}
                </div>
                <div className="text-provn-muted text-sm mb-2">Total Views</div>
                <div className="text-xs text-green-400">+12.5% from last month</div>
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard>
              <ProvnCardContent className="p-6 text-center">
                <div className="text-3xl font-headline font-bold text-provn-text mb-1">{totalTips}</div>
                <div className="text-provn-muted text-sm mb-2">Tips Received</div>
                <div className="text-xs text-green-400">+5.2% from last month</div>
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard>
              <ProvnCardContent className="p-6 text-center">
                <div className="text-3xl font-headline font-bold text-provn-text mb-1">{totalLicenses}</div>
                <div className="text-provn-muted text-sm mb-2">Licenses Sold</div>
                <div className="text-xs text-green-400">+15.7% from last month</div>
              </ProvnCardContent>
            </ProvnCard>
          </div>

          {/* Enhanced Tabs */}
          <div className="border-b border-provn-border">
            <nav className="flex gap-8">
              {[
                { id: "overview", label: "Overview" },
                { id: "videos", label: "My Videos" },
                { id: "campaigns", label: "Campaigns" },
                { id: "earnings", label: "Earnings" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-headline font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-provn-accent text-provn-accent"
                      : "border-transparent text-provn-muted hover:text-provn-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Recent Activity */}
                <div>
                  <h2 className="font-headline text-xl font-semibold text-provn-text mb-4">Recent Activity</h2>
                  <div className="space-y-3">
                    {(analyticsData?.recentActivity || [
                      { type: "tip", amount: "5 wCAMP", video: "Creative Dance Routine", time: "2 hours ago" },
                      { type: "license", amount: "10 wCAMP", video: "Urban Art Tutorial", time: "1 day ago" },
                      { type: "mint", amount: "0 wCAMP", video: "Music Production Tips", time: "1 day ago" },
                      { type: "tip", amount: "2 wCAMP", video: "Cooking Experiment", time: "3 days ago" },
                    ]).map((activity: any, index: number) => (
                      <ProvnCard key={index}>
                        <ProvnCardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  activity.type === "tip"
                                    ? "bg-provn-success"
                                    : activity.type === "license"
                                      ? "bg-provn-accent"
                                      : "bg-provn-muted"
                                }`}
                              />
                              <span className="text-provn-text capitalize">{activity.type}</span>
                              <span className="text-provn-muted">on "{activity.video}"</span>
                            </div>
                            <div className="text-right">
                              <div className="text-provn-text font-medium">{activity.amount}</div>
                              <div className="text-provn-muted text-sm">{activity.time}</div>
                            </div>
                          </div>
                        </ProvnCardContent>
                      </ProvnCard>
                    ))}
                  </div>
                </div>

                {/* Top Performing Videos */}
                <div>
                  <h2 className="font-headline text-xl font-semibold text-provn-text mb-4">Top Performing</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {userVideos
                      .filter((video) => video.status === "minted")
                      .sort((a, b) => b.views - a.views)
                      .slice(0, 3)
                      .map((video) => (
                        <ProvnCard
                          key={video.id}
                          className="cursor-pointer"
                          onClick={() => (window.location.href = `/video/${video.id}`)}
                        >
                          <div className="aspect-[9/16] bg-provn-surface-2 relative">
                            <img
                              src={video.thumbnail || "/placeholder.svg"}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2">
                              <ProvnBadge variant="verified" className="text-xs">
                                {video.views.toLocaleString()} views
                              </ProvnBadge>
                            </div>
                          </div>
                          <ProvnCardContent className="p-4">
                            <h3 className="font-medium text-provn-text mb-1 truncate">{video.title}</h3>
                            <p className="text-sm text-provn-muted">{video.earnings.toFixed(1)} wCAMP earned</p>
                          </ProvnCardContent>
                        </ProvnCard>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "videos" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-headline text-xl font-semibold text-provn-text">
                    All Videos ({userVideos.length})
                  </h2>
                  <ProvnButton onClick={() => (window.location.href = "/upload")}>Upload New</ProvnButton>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userVideos.map((video) => (
                    <ProvnCard key={video.id}>
                      <div className="aspect-[9/16] bg-provn-surface-2 relative">
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <ProvnBadge
                            variant={
                              video.status === "minted"
                                ? "verified"
                                : video.status === "processing"
                                  ? "warning"
                                  : "error"
                            }
                            className="text-xs"
                          >
                            {video.status}
                          </ProvnBadge>
                        </div>
                        {video.status === "minted" && (
                          <div className="absolute bottom-2 left-2">
                            <ProvnBadge className="text-xs bg-black/50 text-white">
                              {video.views.toLocaleString()} views
                            </ProvnBadge>
                          </div>
                        )}
                      </div>
                      <ProvnCardContent className="p-4">
                        <h3 className="font-medium text-provn-text mb-2 truncate">{video.title}</h3>
                        <div className="space-y-1 text-sm text-provn-muted">
                          <div className="flex justify-between">
                            <span>Tips:</span>
                            <span>{video.tips}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Licenses:</span>
                            <span>{video.licenses}</span>
                          </div>
                          <div className="flex justify-between font-medium text-provn-text">
                            <span>Earned:</span>
                            <span>{video.earnings.toFixed(1)} wCAMP</span>
                          </div>
                        </div>
                        {video.status === "minted" && (
                          <div className="mt-3">
                            <ProvnButton
                              variant="secondary"
                              size="sm"
                              className="w-full"
                              onClick={() => (window.location.href = `/video/${video.id}`)}
                            >
                              View Details
                            </ProvnButton>
                          </div>
                        )}
                      </ProvnCardContent>
                    </ProvnCard>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "campaigns" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-headline text-xl font-semibold text-provn-text">
                      Ad Campaigns ({mockCampaigns.length})
                    </h2>
                    <p className="text-provn-muted text-sm mt-1">Promote your Provs to reach more viewers</p>
                  </div>
                  <ProvnButton onClick={() => setShowCampaignModal(true)} className="flex items-center gap-2">
                    📢
                    Promote Your Prov
                  </ProvnButton>
                </div>

                {/* Campaign Stats Overview */}
                <div className="grid md:grid-cols-4 gap-4">
                  <ProvnCard>
                    <ProvnCardContent className="p-4 text-center">
                      <div className="text-2xl font-headline font-bold text-provn-text mb-1">
                        {mockCampaigns.reduce((sum, c) => sum + c.stats.impressions, 0).toLocaleString()}
                      </div>
                      <div className="text-provn-muted text-sm">Total Impressions</div>
                    </ProvnCardContent>
                  </ProvnCard>
                  <ProvnCard>
                    <ProvnCardContent className="p-4 text-center">
                      <div className="text-2xl font-headline font-bold text-provn-text mb-1">
                        {mockCampaigns.reduce((sum, c) => sum + c.stats.clicks, 0).toLocaleString()}
                      </div>
                      <div className="text-provn-muted text-sm">Total Clicks</div>
                    </ProvnCardContent>
                  </ProvnCard>
                  <ProvnCard>
                    <ProvnCardContent className="p-4 text-center">
                      <div className="text-2xl font-headline font-bold text-provn-text mb-1">
                        {(mockCampaigns.reduce((sum, c) => sum + c.stats.ctr, 0) / mockCampaigns.length).toFixed(1)}%
                      </div>
                      <div className="text-provn-muted text-sm">Avg. CTR</div>
                    </ProvnCardContent>
                  </ProvnCard>
                  <ProvnCard>
                    <ProvnCardContent className="p-4 text-center">
                      <div className="text-2xl font-headline font-bold text-provn-text mb-1">
                        {mockCampaigns.reduce((sum, c) => sum + c.spent, 0).toFixed(1)}
                      </div>
                      <div className="text-provn-muted text-sm">wCAMP Spent</div>
                    </ProvnCardContent>
                  </ProvnCard>
                </div>

                {/* Campaigns List */}
                <div className="space-y-4">
                  {mockCampaigns.map((campaign) => (
                    <ProvnCard key={campaign.id}>
                      <ProvnCardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <img
                              src={campaign.videoThumbnail || "/placeholder.svg"}
                              alt={campaign.videoTitle}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="font-headline font-semibold text-provn-text mb-1">
                                {campaign.videoTitle}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-provn-muted mb-2">
                                <div className="flex items-center space-x-1">
                                  📅
                                  <span>
                                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                                  </span>
                                </div>
                                <ProvnBadge
                                  variant={
                                    campaign.status === "active"
                                      ? "verified"
                                      : campaign.status === "completed"
                                        ? "default"
                                        : campaign.status === "paused"
                                          ? "warning"
                                          : "default"
                                  }
                                  className="text-xs"
                                >
                                  {campaign.status}
                                </ProvnBadge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                <div>
                                  <div className="text-provn-muted">Budget</div>
                                  <div className="font-medium text-provn-text">{campaign.budget} wCAMP</div>
                                </div>
                                <div>
                                  <div className="text-provn-muted">Spent</div>
                                  <div className="font-medium text-provn-text">{campaign.spent} wCAMP</div>
                                </div>
                                <div>
                                  <div className="text-provn-muted">Impressions</div>
                                  <div className="font-medium text-provn-text">
                                    {campaign.stats.impressions.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-provn-muted">CTR</div>
                                  <div className="font-medium text-provn-text">{campaign.stats.ctr}%</div>
                                </div>
                                <div>
                                  <div className="text-provn-muted">ROI</div>
                                  <div className="font-medium text-green-400">{campaign.stats.roi}x</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {campaign.status === "active" && (
                              <ProvnButton
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCampaignAction(campaign.id, "pause")}
                              >
                                ⏸️
                              </ProvnButton>
                            )}
                            {campaign.status === "paused" && (
                              <ProvnButton
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCampaignAction(campaign.id, "resume")}
                              >
                                ▶️
                              </ProvnButton>
                            )}
                            <ProvnButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCampaignAction(campaign.id, "edit")}
                            >
                              ✏️
                            </ProvnButton>
                            <ProvnButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCampaignAction(campaign.id, "delete")}
                              className="text-red-400 hover:text-red-300"
                            >
                              🗑️
                            </ProvnButton>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-provn-muted mb-1">
                            <span>Budget Progress</span>
                            <span>{((campaign.spent / campaign.budget) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-provn-surface-2 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </ProvnCardContent>
                    </ProvnCard>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="space-y-8">
                {/* Earnings Summary */}
                <ProvnCard>
                  <ProvnCardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-headline font-bold text-provn-success mb-1">
                          {(totalTips * 2.5).toFixed(1)}
                        </div>
                        <div className="text-provn-muted text-sm">From Tips</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-headline font-bold text-provn-accent mb-1">
                          {(totalLicenses * 7).toFixed(1)}
                        </div>
                        <div className="text-provn-muted text-sm">From Licenses (70%)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-headline font-bold text-provn-text mb-1">
                          {totalEarnings.toFixed(1)}
                        </div>
                        <div className="text-provn-muted text-sm">Total Earned</div>
                      </div>
                    </div>
                  </ProvnCardContent>
                </ProvnCard>

                {/* Earnings History */}
                <div>
                  <h2 className="font-headline text-xl font-semibold text-provn-text mb-4">Recent Earnings</h2>
                  <div className="space-y-3">
                    {[
                      {
                        type: "tip",
                        amount: 5.0,
                        video: "Creative Dance Routine",
                        date: "2024-01-16",
                        from: "0x9876...5432",
                      },
                      {
                        type: "license",
                        amount: 7.0,
                        video: "Urban Art Tutorial",
                        date: "2024-01-15",
                        from: "0x5678...9012",
                      },
                      {
                        type: "tip",
                        amount: 3.5,
                        video: "Cooking Experiment",
                        date: "2024-01-14",
                        from: "0x3456...7890",
                      },
                      {
                        type: "license",
                        amount: 7.0,
                        video: "Creative Dance Routine",
                        date: "2024-01-13",
                        from: "0x2345...6789",
                      },
                      {
                        type: "tip",
                        amount: 2.0,
                        video: "Cooking Experiment",
                        date: "2024-01-12",
                        from: "0x1234...5678",
                      },
                    ].map((earning, index) => (
                      <ProvnCard key={index}>
                        <ProvnCardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  earning.type === "tip" ? "bg-provn-success" : "bg-provn-accent"
                                }`}
                              />
                              <div>
                                <div className="text-provn-text font-medium capitalize">{earning.type}</div>
                                <div className="text-provn-muted text-sm">
                                  "{earning.video}" from {formatAddress(earning.from)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-provn-text font-semibold">+{earning.amount.toFixed(1)} wCAMP</div>
                              <div className="text-provn-muted text-sm">{earning.date}</div>
                            </div>
                          </div>
                        </ProvnCardContent>
                      </ProvnCard>
                    ))}
                  </div>
                </div>

                {/* Withdraw Section */}
                <ProvnCard>
                  <ProvnCardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-headline text-lg font-semibold text-provn-text mb-1">Available Balance</h3>
                        <p className="text-provn-muted text-sm">Ready to withdraw to your wallet</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-headline font-bold text-provn-text mb-2">
                          {totalEarnings.toFixed(1)} wCAMP
                        </div>
                        <ProvnButton size="sm">Withdraw</ProvnButton>
                      </div>
                    </div>
                  </ProvnCardContent>
                </ProvnCard>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-8">
                <ProvnCard>
                  <ProvnCardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-provn-surface-2 rounded-full overflow-hidden">
                        <img src="/diverse-profile-avatars.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <ProvnButton variant="secondary" size="sm">
                          Change Avatar
                        </ProvnButton>
                        <p className="text-provn-muted text-sm mt-1">JPG, PNG or GIF. Max 2MB.</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block font-headline font-semibold text-provn-text">Handle</label>
                        <input
                          type="text"
                          defaultValue="creativedancer"
                          className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block font-headline font-semibold text-provn-text">Display Name</label>
                        <input
                          type="text"
                          defaultValue="Creative Dancer"
                          className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-headline font-semibold text-provn-text">Bio</label>
                      <textarea
                        rows={4}
                        defaultValue="Digital creator exploring the intersection of movement and technology. Passionate about on-chain provenance and creative ownership."
                        className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <ProvnButton>Save Changes</ProvnButton>
                      <ProvnButton variant="secondary">Cancel</ProvnButton>
                    </div>
                  </ProvnCardContent>
                </ProvnCard>

                {/* Public Profile Preview */}
                <ProvnCard>
                  <ProvnCardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-provn-muted mb-2">Your profile is visible to other users</p>
                        <p className="text-provn-accent text-sm">provn.app/profile/creativedancer</p>
                      </div>
                      <ProvnButton
                        variant="secondary"
                        onClick={() => (window.location.href = "/profile/creativedancer")}
                      >
                        View Profile
                      </ProvnButton>
                    </div>
                  </ProvnCardContent>
                </ProvnCard>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCampaignModal(false)} />
          <div className="relative w-full max-w-2xl bg-provn-surface rounded-xl border border-provn-border max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-provn-border">
              <h2 className="font-headline text-xl font-bold text-provn-text">Create Ad Campaign</h2>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="text-provn-muted hover:text-provn-text transition-colors"
              >
                ❌
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Video Selection */}
              <div className="space-y-3">
                <label className="block font-headline font-semibold text-provn-text">Select Video to Promote</label>
                <div className="grid md:grid-cols-2 gap-3">
                  {userVideos
                    .filter((video) => video.status === "minted")
                    .map((video) => (
                      <div
                        key={video.id}
                        onClick={() => setSelectedVideo(video.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVideo === video.id
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-provn-border hover:border-provn-muted"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-provn-text text-sm">{video.title}</div>
                            <div className="text-provn-muted text-xs">{video.views.toLocaleString()} views</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Budget Setting */}
              <div className="space-y-3">
                <label className="block font-headline font-semibold text-provn-text">Campaign Budget</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="10"
                      max="500"
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(Number(e.target.value))}
                      className="flex-1 h-2 bg-provn-surface-2 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-provn-text font-medium min-w-[100px]">{campaignBudget} wCAMP</div>
                  </div>
                  <div className="text-sm text-provn-muted">
                    Estimated reach: {(campaignBudget * 125).toLocaleString()} -{" "}
                    {(campaignBudget * 200).toLocaleString()} impressions
                  </div>
                </div>
              </div>

              {/* Duration Setting */}
              <div className="space-y-3">
                <label className="block font-headline font-semibold text-provn-text">Campaign Duration</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={campaignDuration}
                      onChange={(e) => setCampaignDuration(Number(e.target.value))}
                      className="flex-1 h-2 bg-provn-surface-2 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-provn-text font-medium min-w-[80px]">{campaignDuration} days</div>
                  </div>
                  <div className="text-sm text-provn-muted">
                    Daily budget: {(campaignBudget / campaignDuration).toFixed(1)} wCAMP per day
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-3">
                <label className="block font-headline font-semibold text-provn-text">Target Audience</label>
                <div className="p-4 bg-provn-surface-2 rounded-lg">
                  <div className="flex items-center space-x-2 text-provn-muted">
                    🎯
                    <span>All Provn users (MVP - advanced targeting coming soon)</span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {selectedVideo && (
                <div className="space-y-3">
                  <label className="block font-headline font-semibold text-provn-text">Campaign Preview</label>
                  <div className="p-4 bg-provn-surface-2 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <img
                          src={userVideos.find((v) => v.id === selectedVideo)?.thumbnail || "/placeholder.svg"}
                          alt="Preview"
                          className="w-16 h-16 rounded object-cover"
                        />
                        <ProvnBadge className="absolute -top-1 -right-1 text-xs bg-orange-500 text-white">
                          Promoted
                        </ProvnBadge>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-provn-text">
                          {userVideos.find((v) => v.id === selectedVideo)?.title}
                        </div>
                        <div className="text-sm text-provn-muted">
                          This is how your promoted Prov will appear in the feed
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Summary */}
              <div className="bg-provn-surface-2 rounded-lg p-4 space-y-2">
                <h3 className="font-headline font-semibold text-provn-text">Campaign Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-provn-muted">Total Budget</div>
                    <div className="font-medium text-provn-text">{campaignBudget} wCAMP</div>
                  </div>
                  <div>
                    <div className="text-provn-muted">Duration</div>
                    <div className="font-medium text-provn-text">{campaignDuration} days</div>
                  </div>
                  <div>
                    <div className="text-provn-muted">Daily Spend</div>
                    <div className="font-medium text-provn-text">
                      {(campaignBudget / campaignDuration).toFixed(1)} wCAMP
                    </div>
                  </div>
                  <div>
                    <div className="text-provn-muted">Est. Impressions</div>
                    <div className="font-medium text-provn-text">{(campaignBudget * 150).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-provn-border">
              <div className="text-sm text-provn-muted">Campaign will start immediately after creation</div>
              <div className="flex space-x-3">
                <ProvnButton variant="secondary" onClick={() => setShowCampaignModal(false)}>
                  Cancel
                </ProvnButton>
                <ProvnButton onClick={handleCreateCampaign} disabled={!selectedVideo}>
                  Create Campaign
                </ProvnButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
