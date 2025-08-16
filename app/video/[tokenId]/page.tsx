"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnBadge } from "@/components/provn/badge"
import { ArrowLeft, ExternalLink, Play } from "lucide-react"
import { getReliableIPFSUrl, createIPFSErrorHandler } from "@/lib/ipfs"

interface VideoData {
  id: string
  type: 'platform' | 'blockchain'
  tokenId: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl?: string
  creator: {
    wallet: string
    handle?: string
  }
  blockchain?: {
    transactionHash?: string
    contractAddress?: string
  }
}


export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const tokenId = params?.tokenId as string
  
  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoErrorHandler, setVideoErrorHandler] = useState<((element: HTMLVideoElement) => void) | null>(null)

  useEffect(() => {
    if (!tokenId) return

    const fetchVideo = async () => {
      try {
        setLoading(true)
        
        // Try to fetch video details from the platform
        const response = await fetch(`/api/video/${tokenId}`)
        const data = await response.json()
        
        if (data.success && data.video) {
          setVideo(data.video)
          // Create error handler for IPFS video URLs
          if (data.video.videoUrl) {
            setVideoErrorHandler(() => createIPFSErrorHandler(data.video.videoUrl))
          }
        } else {
          setError('Video not found')
        }
      } catch (err) {
        console.error('Failed to fetch video:', err)
        setError('Failed to load video')
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [tokenId])

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-provn-bg flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-provn-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-provn-muted">Loading video...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !video) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-provn-bg flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-provn-surface rounded-full flex items-center justify-center mx-auto">
              <Play className="w-8 h-8 text-provn-muted" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-provn-text mb-2">Video Not Found</h1>
              <p className="text-provn-muted mb-4">{error || 'The requested video could not be found.'}</p>
              <ProvnButton onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </ProvnButton>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-provn-bg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <ProvnButton variant="secondary" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </ProvnButton>
          </div>

          {/* Video Player */}
          <div className="bg-provn-surface rounded-lg overflow-hidden mb-6">
            <div className="aspect-video bg-black">
              <video 
                src={getReliableIPFSUrl(video.videoUrl)} 
                controls 
                className="w-full h-full"
                poster={video.thumbnailUrl}
                crossOrigin="anonymous"
                preload="metadata"
                onError={(e) => {
                  console.error('Video load error:', e)
                  const target = e.target as HTMLVideoElement
                  if (videoErrorHandler) {
                    videoErrorHandler(target)
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-provn-text">{video.title}</h1>
                <ProvnBadge variant={video.type === 'platform' ? 'default' : 'warning'}>
                  {video.type === 'platform' ? 'Platform' : 'IP-NFT'}
                </ProvnBadge>
              </div>
              {video.description && (
                <p className="text-provn-muted">{video.description}</p>
              )}
            </div>

            {/* Creator Info */}
            <div className="bg-provn-surface rounded-lg p-4">
              <h3 className="text-lg font-semibold text-provn-text mb-3">Creator</h3>
              <div className="flex items-center justify-between">
                <div>
                  {video.creator.handle ? (
                    <p className="text-provn-text font-medium">@{video.creator.handle}</p>
                  ) : (
                    <p className="text-provn-muted text-sm">Anonymous Creator</p>
                  )}
                  <p className="text-provn-muted text-sm font-mono">
                    {video.creator.wallet.slice(0, 6)}...{video.creator.wallet.slice(-4)}
                  </p>
                </div>
                {video.creator.handle && (
                  <ProvnButton 
                    variant="secondary"
                    onClick={() => router.push(`/u/${video.creator.handle}`)}
                  >
                    View Profile
                  </ProvnButton>
                )}
              </div>
            </div>

            {/* Blockchain Info */}
            {video.blockchain && (
              <div className="bg-provn-surface rounded-lg p-4">
                <h3 className="text-lg font-semibold text-provn-text mb-3">Blockchain Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-provn-muted">Token ID:</span>
                    <span className="text-provn-text font-mono">#{video.tokenId}</span>
                  </div>
                  {video.blockchain.transactionHash && (
                    <div className="flex justify-between items-center">
                      <span className="text-provn-muted">Transaction:</span>
                      <a
                        href={`https://basecamp.cloud.blockscout.com/tx/${video.blockchain.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-provn-accent hover:text-provn-accent-press"
                      >
                        <span className="font-mono">
                          {video.blockchain.transactionHash.slice(0, 6)}...{video.blockchain.transactionHash.slice(-4)}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}