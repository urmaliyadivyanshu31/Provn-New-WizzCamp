"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { FullyProtectedRoute } from "@/components/guards/ProtectedRoute"
import { useAuth } from '@campnetwork/origin/react'
import { LicenseStatusBadge, LicenseStatusIndicator } from "@/components/licenses/LicenseStatusBadge"
import { ProvnBrandLoader } from "@/components/common/LoadingStates"
import { 
  Play, 
  Eye, 
  Download, 
  ExternalLink, 
  Search,
  Filter,
  Grid3X3,
  List,
  ArrowLeft,
  Package,
  Calendar,
  User,
  Clock
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface LicensedVideo {
  id: number
  token_id: number
  license_type: string
  price_paid: number
  expires_at: string
  created_at: string
  computed: {
    is_expired: boolean
    is_expiring_soon: boolean
    days_until_expiry: number
    status: 'active' | 'expired' | 'expiring_soon'
  }
  platform_videos: {
    token_id: number
    title: string
    description: string
    video_url: string
    thumbnail_url: string
    creator_address: string
    profiles: {
      handle: string
      display_name: string
      avatar_url?: string
    }
  }
}

type ViewMode = 'grid' | 'list'

export default function LicensedContentPage() {
  const router = useRouter()
  const { walletAddress } = useAuth()
  const [licensedVideos, setLicensedVideos] = useState<LicensedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('active')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    const fetchLicensedContent = async () => {
      if (!walletAddress) return

      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          purchaser: walletAddress,
          detailed: 'true',
          limit: '100'
        })

        if (statusFilter !== 'all') {
          params.append('status', statusFilter)
        }

        const response = await fetch(`/api/licenses?${params}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch licensed content: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch licensed content')
        }

        setLicensedVideos(data.licenses || [])

      } catch (err) {
        console.error('Failed to fetch licensed content:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch licensed content')
      } finally {
        setLoading(false)
      }
    }

    fetchLicensedContent()
  }, [walletAddress, statusFilter])

  const filteredVideos = licensedVideos.filter(video => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      video.platform_videos?.title?.toLowerCase().includes(query) ||
      video.platform_videos?.profiles?.handle?.toLowerCase().includes(query) ||
      video.platform_videos?.profiles?.display_name?.toLowerCase().includes(query) ||
      video.token_id.toString().includes(query)
    )
  })

  const handleVideoClick = (tokenId: number) => {
    router.push(`/video/${tokenId}`)
  }

  const handleDownload = async (video: LicensedVideo) => {
    if (!video.platform_videos?.video_url) {
      toast.error('Video file not available')
      return
    }

    try {
      toast.info('Starting download...')
      
      // Create a download link
      const link = document.createElement('a')
      link.href = video.platform_videos.video_url
      link.download = `${video.platform_videos.title.replace(/[^a-z0-9]/gi, '_')}_${video.token_id}.mp4`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download started')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download video')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCAMP = (amount: number | null | undefined) => {
    if (!amount || amount === 0) return "Free"
    return `${amount.toFixed(amount < 1 ? 2 : 1)} CAMP`
  }

  const getStatusCounts = () => {
    return {
      active: licensedVideos.filter(v => v.computed.status === 'active').length,
      expiring_soon: licensedVideos.filter(v => v.computed.status === 'expiring_soon').length,
      expired: licensedVideos.filter(v => v.computed.status === 'expired').length
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <FullyProtectedRoute
      authMessage="Connect your wallet to view your licensed content."
      profileMessage="Create your profile to access your licensed content."
    >
      <div className="min-h-screen bg-provn-bg">
        <Navigation />
        
        <div className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <ProvnButton
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </ProvnButton>
              </div>
              
              <h1 className="text-4xl font-bold font-headline text-provn-text mb-2">
                Licensed Content
              </h1>
              <p className="text-provn-muted">
                Content you have active licenses for - download, use, and manage your licensed videos
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-provn-surface border border-provn-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-provn-accent" />
                  <span className="text-sm font-medium text-provn-text font-headline">Total</span>
                </div>
                <p className="text-2xl font-bold text-provn-text font-headline">
                  {licensedVideos.length}
                </p>
              </div>
              
              <div className="p-4 bg-provn-surface border border-provn-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-sm font-medium text-provn-text font-headline">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400 font-headline">
                  {statusCounts.active}
                </p>
              </div>
              
              <div className="p-4 bg-provn-surface border border-provn-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="text-sm font-medium text-provn-text font-headline">Expiring</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400 font-headline">
                  {statusCounts.expiring_soon}
                </p>
              </div>
              
              <div className="p-4 bg-provn-surface border border-provn-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm font-medium text-provn-text font-headline">Expired</span>
                </div>
                <p className="text-2xl font-bold text-red-400 font-headline">
                  {statusCounts.expired}
                </p>
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-provn-muted" />
                <input
                  type="text"
                  placeholder="Search licensed content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-provn-border rounded-lg bg-provn-surface text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-provn-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-provn-border rounded-lg bg-provn-surface text-provn-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="expiring_soon">Expiring Soon</option>
                  <option value="expired">Expired</option>
                </select>
                
                <div className="flex items-center bg-provn-surface border border-provn-border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded ${viewMode === 'grid' ? 'bg-provn-accent text-white' : 'text-provn-muted hover:text-provn-text'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded ${viewMode === 'list' ? 'bg-provn-accent text-white' : 'text-provn-muted hover:text-provn-text'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-12">
                <ProvnBrandLoader size="lg" message="Loading your licensed content..." variant="brand" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                <p className="text-red-400 font-headline">{error}</p>
                <ProvnButton
                  variant="secondary"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Retry
                </ProvnButton>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredVideos.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-provn-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-provn-text mb-2 font-headline">
                  {searchQuery ? 'No matching content found' : 'No licensed content yet'}
                </h3>
                <p className="text-provn-muted mb-6">
                  {searchQuery ? 
                    'Try adjusting your search or filter criteria.' :
                    'Purchase licenses for content to access them here.'
                  }
                </p>
                {!searchQuery && (
                  <ProvnButton onClick={() => router.push('/explore')}>
                    Explore Content
                  </ProvnButton>
                )}
              </div>
            )}

            {/* Content Grid/List */}
            {!loading && !error && filteredVideos.length > 0 && (
              <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}`}>
                {filteredVideos.map((video, index) => (
                  <motion.div
                    key={`${video.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProvnCard className="overflow-hidden hover:shadow-lg transition-all cursor-pointer">
                      <ProvnCardContent className="p-0">
                        {viewMode === 'grid' ? (
                          // Grid View
                          <>
                            {/* Thumbnail */}
                            <div 
                              className="aspect-video bg-black relative group"
                              onClick={() => handleVideoClick(video.token_id)}
                            >
                              {video.platform_videos?.thumbnail_url ? (
                                <img
                                  src={video.platform_videos.thumbnail_url}
                                  alt={video.platform_videos.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-provn-surface-2 flex items-center justify-center">
                                  <Play className="w-12 h-12 text-provn-muted" />
                                </div>
                              )}
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-12 h-12 text-white" />
                              </div>
                              
                              {/* Status Badge */}
                              <div className="absolute top-2 right-2">
                                <LicenseStatusIndicator tokenId={video.token_id.toString()} />
                              </div>
                            </div>
                            
                            {/* Content Info */}
                            <div className="p-4">
                              <h3 className="font-semibold text-provn-text text-sm mb-1 truncate font-headline">
                                {video.platform_videos?.title || `Video #${video.token_id}`}
                              </h3>
                              
                              <div className="flex items-center gap-1 text-xs text-provn-muted mb-2">
                                <User className="w-3 h-3" />
                                <span>@{video.platform_videos?.profiles?.handle}</span>
                              </div>
                              
                              <div className="flex items-center justify-between mb-3">
                                <LicenseStatusBadge 
                                  tokenId={video.token_id.toString()} 
                                  variant="full"
                                />
                                <span className="text-xs text-provn-muted font-headline">
                                  {formatCAMP(video.price_paid)}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                <ProvnButton
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleVideoClick(video.token_id)
                                  }}
                                  className="flex-1"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </ProvnButton>
                                <ProvnButton
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownload(video)
                                  }}
                                  className="flex-1"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Use
                                </ProvnButton>
                              </div>
                            </div>
                          </>
                        ) : (
                          // List View
                          <div 
                            className="flex items-center gap-4 p-4 hover:bg-provn-surface-2/50 transition-colors"
                            onClick={() => handleVideoClick(video.token_id)}
                          >
                            {/* Thumbnail */}
                            <div className="w-24 h-16 rounded-lg overflow-hidden bg-provn-surface-2 flex-shrink-0">
                              {video.platform_videos?.thumbnail_url ? (
                                <img
                                  src={video.platform_videos.thumbnail_url}
                                  alt={video.platform_videos.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="w-6 h-6 text-provn-muted" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-provn-text text-sm mb-1 truncate font-headline">
                                {video.platform_videos?.title || `Video #${video.token_id}`}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-provn-muted mb-1">
                                <User className="w-3 h-3" />
                                <span>@{video.platform_videos?.profiles?.handle}</span>
                                <span>•</span>
                                <Calendar className="w-3 h-3" />
                                <span>Licensed {formatDate(video.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <LicenseStatusBadge 
                                  tokenId={video.token_id.toString()} 
                                  variant="compact"
                                />
                                <span className="text-xs text-provn-muted font-headline">
                                  {formatCAMP(video.price_paid)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <ProvnButton
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleVideoClick(video.token_id)
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </ProvnButton>
                              <ProvnButton
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownload(video)
                                }}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Use
                              </ProvnButton>
                            </div>
                          </div>
                        )}
                      </ProvnCardContent>
                    </ProvnCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </FullyProtectedRoute>
  )
}