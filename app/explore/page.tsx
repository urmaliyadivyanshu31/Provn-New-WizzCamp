"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { VideoFeed } from "@/components/explore/VideoFeed"
import { VideoDetailsModal } from "@/components/explore/VideoDetailsModal"
import { useAuth } from "@campnetwork/origin/react"
import { ExploreVideo } from "@/types/explore"
import "@/styles/explore.css"

export default function ExplorePage() {
  const [selectedVideo, setSelectedVideo] = useState<ExploreVideo | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [dataSource, setDataSource] = useState<'platform' | 'blockchain' | 'hybrid' | 'mock'>('platform')
  const { isAuthenticated, walletAddress } = useAuth()

  const handleVideoDetails = (video: ExploreVideo) => {
    setSelectedVideo(video)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false)
    setSelectedVideo(null)
  }

  // Store wallet address in localStorage for API calls
  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem('userWallet', walletAddress)
    } else {
      localStorage.removeItem('userWallet')
    }
  }, [walletAddress])

  // Prevent body scroll when in explore mode
  useEffect(() => {
    document.body.classList.add('explore-mode')
    return () => {
      document.body.classList.remove('explore-mode')
    }
  }, [])

  // Handle keyboard navigation and video controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDetailsModalOpen) return
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        // The VideoFeed component will handle the actual navigation
        const event = new CustomEvent('keyboardNavigation', {
          detail: { direction: e.key === 'ArrowUp' ? 'up' : 'down' }
        })
        window.dispatchEvent(event)
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        // Dispatch spacebar event for video play/pause
        const event = new CustomEvent('videoTogglePlayPause')
        window.dispatchEvent(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailsModalOpen])

  return (
    <>
      <Navigation currentPage="explore" />
      
      {/* Full screen video feed */}
      <div className="fixed inset-0 bg-black video-container">
        <VideoFeed 
          onVideoDetails={handleVideoDetails}
          isAuthenticated={isAuthenticated}
          useBlockchainData={dataSource === 'blockchain'}
        />
      </div>

      {/* Data Source Toggle */}
      <div className="fixed top-20 left-4 z-40 flex flex-col gap-2">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-white/60 mb-2">Video Source</div>
          <div className="flex flex-col gap-1">
            {[
              { key: 'platform', label: '🏢 Platform', desc: 'Provn videos' },
              { key: 'blockchain', label: '🔗 Blockchain', desc: 'External IP-NFTs' },
              { key: 'hybrid', label: '🔄 Hybrid', desc: 'Mixed feed' },
              { key: 'mock', label: '📝 Mock', desc: 'Demo data' }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setDataSource(option.key as any)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 text-left ${
                  dataSource === option.key
                    ? 'bg-provn-accent/20 text-provn-accent border border-provn-accent/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                }`}
              >
                <div>{option.label}</div>
                <div className="text-xs opacity-60">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Details Modal */}
      {selectedVideo && (
        <VideoDetailsModal
          video={selectedVideo}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  )
}