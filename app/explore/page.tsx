"use client"

import React, { useState, useEffect, Suspense } from "react"
import { Navigation } from "@/components/provn/navigation"
import { VideoFeed } from "@/components/explore/VideoFeed"
import { VideoDetailsModal } from "@/components/explore/VideoDetailsModal"
import { FullyProtectedRoute } from "@/components/guards/ProtectedRoute"
import { useAuth } from "@campnetwork/origin/react"
import { ExploreVideo } from "@/types/explore"
import { ExploreErrorBoundary } from "@/components/common/ErrorBoundary"
import { VideoFeedSkeleton } from "@/components/common/LoadingStates"
import "@/styles/explore.css"

export default function ExplorePage() {
  const [selectedVideo, setSelectedVideo] = useState<ExploreVideo | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
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
        e.stopPropagation()
        // The VideoFeed component will handle the actual navigation
        const event = new CustomEvent('keyboardNavigation', {
          detail: { direction: e.key === 'ArrowUp' ? 'up' : 'down' }
        })
        window.dispatchEvent(event)
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        e.stopPropagation()
        // Dispatch spacebar event for video play/pause
        const event = new CustomEvent('videoTogglePlayPause')
        window.dispatchEvent(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailsModalOpen])

  return (
    <FullyProtectedRoute
      authMessage="Connect your wallet to explore amazing videos and interact with creators on Provn."
      profileMessage="Create your profile to explore videos, like content, and build your creator presence."
    >
      <Navigation currentPage="explore" />
      
      {/* Full screen video feed with error boundary */}
      <div className="fixed inset-x-0 top-16 bottom-0 bg-black video-container">
        <ExploreErrorBoundary>
          <Suspense fallback={<VideoFeedSkeleton />}>
            <VideoFeed 
              onVideoDetails={handleVideoDetails}
              isAuthenticated={isAuthenticated}
            />
          </Suspense>
        </ExploreErrorBoundary>
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
    </FullyProtectedRoute>
  )
}