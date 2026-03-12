"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useOriginLicensing } from "@/hooks/useOriginLicensing"
import { toast } from "sonner"
import { Video, RefreshCw, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"

interface CreatorVideo {
  id: string
  token_id: string
  title: string
  description: string
  thumbnail_url: string
  video_url: string
  license_synced: boolean
  license_synced_at: string | null
  price_per_period: number
  license_duration: number
  views_count: number
  licenses_sold: number
  total_revenue: number
  is_derivative: boolean
  parent_token_id: string | null
  derivative_count: number
  uploaded_at: string
}

interface CreatorVideosProps {
  userAddress?: string
}

export function CreatorVideos({ userAddress }: CreatorVideosProps) {
  const [videos, setVideos] = useState<CreatorVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingTokenId, setSyncingTokenId] = useState<string | null>(null)
  const { syncLicenseTerms } = useOriginLicensing()

  // Fetch creator's videos
  useEffect(() => {
    const fetchVideos = async () => {
      if (!userAddress) return

      setLoading(true)
      try {
        const response = await fetch(`/api/creator/videos?wallet=${userAddress}`)
        const data = await response.json()

        if (data.success) {
          setVideos(data.videos)
        } else {
          toast.error('Failed to load your videos')
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error)
        toast.error('Failed to load your videos')
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [userAddress])

  const handleSyncLicense = async (tokenId: string) => {
    setSyncingTokenId(tokenId)
    toast.info('Syncing license terms to marketplace...')

    try {
      const success = await syncLicenseTerms(tokenId)

      if (success) {
        toast.success('License terms synced successfully!')

        // Update the video in local state
        setVideos(prev => prev.map(v =>
          v.token_id === tokenId
            ? { ...v, license_synced: true, license_synced_at: new Date().toISOString() }
            : v
        ))
      } else {
        toast.error('Failed to sync license terms. Please try again.')
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Failed to sync license terms. Please try again.')
    } finally {
      setSyncingTokenId(null)
    }
  }

  const formatPROVN = (amount: number | null | undefined) => {
    if (!amount || amount === 0) return "Free"
    return `${amount.toFixed(2)} PROVN`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const unsyncedVideos = videos.filter(v => !v.license_synced)
  const syncedVideos = videos.filter(v => v.license_synced)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-provn-accent" />
        <span className="ml-3 text-provn-muted">Loading your videos...</span>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <ProvnCard>
        <ProvnCardContent className="p-8 text-center">
          <Video className="w-12 h-12 text-provn-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-provn-text mb-2">No videos yet</h3>
          <p className="text-provn-muted mb-6">
            Upload your first video to start earning from licensing
          </p>
          <Link href="/upload">
            <ProvnButton>
              Upload Video
            </ProvnButton>
          </Link>
        </ProvnCardContent>
      </ProvnCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ProvnCard>
          <ProvnCardContent className="p-4">
            <div className="text-sm text-provn-muted mb-1">Total Videos</div>
            <div className="text-2xl font-bold text-provn-text">{videos.length}</div>
          </ProvnCardContent>
        </ProvnCard>
        <ProvnCard>
          <ProvnCardContent className="p-4">
            <div className="text-sm text-provn-muted mb-1">Licenses Sold</div>
            <div className="text-2xl font-bold text-provn-text">
              {videos.reduce((sum, v) => sum + v.licenses_sold, 0)}
            </div>
          </ProvnCardContent>
        </ProvnCard>
        <ProvnCard>
          <ProvnCardContent className="p-4">
            <div className="text-sm text-provn-muted mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-provn-accent">
              {formatPROVN(videos.reduce((sum, v) => sum + (v.total_revenue || 0), 0))}
            </div>
          </ProvnCardContent>
        </ProvnCard>
        <ProvnCard>
          <ProvnCardContent className="p-4">
            <div className="text-sm text-provn-muted mb-1">Total Views</div>
            <div className="text-2xl font-bold text-provn-text">
              {videos.reduce((sum, v) => sum + v.views_count, 0).toLocaleString()}
            </div>
          </ProvnCardContent>
        </ProvnCard>
      </div>

      {/* Unsynced Videos - Priority Section */}
      {unsyncedVideos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-provn-text">
              Needs License Sync ({unsyncedVideos.length})
            </h2>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-200">
              These videos need their license terms synced to the marketplace before they can be purchased.
              Click "Sync License" to enable licensing.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {unsyncedVideos.map((video) => (
              <ProvnCard key={video.id}>
                <ProvnCardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      <img
                        src={video.thumbnail_url || '/placeholder-video.png'}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-provn-text truncate">
                            {video.title}
                          </h3>
                          <p className="text-sm text-provn-muted mt-1">
                            Token #{video.token_id}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-provn-muted">
                            <span>{formatPROVN(video.price_per_period)} / {Math.floor((video.license_duration || 0) / 86400)} days</span>
                            <span>•</span>
                            <span>{video.views_count} views</span>
                            {video.is_derivative && (
                              <>
                                <span>•</span>
                                <ProvnBadge variant="default">Derivative</ProvnBadge>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Sync Button */}
                        <ProvnButton
                          onClick={() => handleSyncLicense(video.token_id)}
                          disabled={syncingTokenId === video.token_id}
                          size="sm"
                          className="flex-shrink-0"
                        >
                          {syncingTokenId === video.token_id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Sync License
                            </>
                          )}
                        </ProvnButton>
                      </div>
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            ))}
          </div>
        </div>
      )}

      {/* Synced Videos */}
      {syncedVideos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-bold text-provn-text">
              Ready for Licensing ({syncedVideos.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {syncedVideos.map((video) => (
              <ProvnCard key={video.id}>
                <ProvnCardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      <img
                        src={video.thumbnail_url || '/placeholder-video.png'}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-provn-text truncate">
                            {video.title}
                          </h3>
                          <p className="text-sm text-provn-muted mt-1">
                            Token #{video.token_id}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-provn-muted">
                            <span>{formatPROVN(video.price_per_period)} / {Math.floor((video.license_duration || 0) / 86400)} days</span>
                            <span>•</span>
                            <span>{video.licenses_sold} licenses sold</span>
                            <span>•</span>
                            <span>{formatPROVN(video.total_revenue)} earned</span>
                            {video.derivative_count > 0 && (
                              <>
                                <span>•</span>
                                <span>{video.derivative_count} derivatives</span>
                              </>
                            )}
                          </div>
                          {video.license_synced_at && (
                            <p className="text-xs text-green-400 mt-1">
                              ✓ Synced {formatDate(video.license_synced_at)}
                            </p>
                          )}
                        </div>

                        {/* View on Explorer */}
                        <a
                          href={`https://basecamp.cloud.blockscout.com/token/0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1/instance/${video.token_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-provn-muted hover:text-provn-accent transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
