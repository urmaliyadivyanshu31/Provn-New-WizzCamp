"use client"

import { useState } from "react"
import { ExploreVideo, ShareOptions } from "@/types/explore"
import { Heart, Share2, DollarSign, Info, Eye, MessageCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { TipModal } from "./TipModal"
import { ShareModal } from "./ShareModal"

interface VideoOverlayProps {
  video: ExploreVideo
  isAuthenticated: boolean
  onLike: () => void
  onShare: (video: ExploreVideo, platform: 'twitter' | 'instagram') => void
  onDetails: () => void
}

export function VideoOverlay({ 
  video, 
  isAuthenticated, 
  onLike, 
  onShare, 
  onDetails 
}: VideoOverlayProps) {
  const [showTipModal, setShowTipModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const handleShareClick = () => {
    setShowShareModal(true)
  }

  const handleShareSelect = (platform: 'twitter' | 'instagram') => {
    onShare(video, platform)
    setShowShareModal(false)
  }

  return (
    <>
      <div className="video-overlay absolute inset-0 pointer-events-none">
        {/* Left Side - Creator Info and Description */}
        <div className="absolute bottom-20 left-4 max-w-[65%] pointer-events-auto">
          {/* Creator Info */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              {/* Creator Avatar */}
              <div className="relative">
                {video.creator.avatarUrl ? (
                  <img
                    src={video.creator.avatarUrl}
                    alt={video.creator.handle}
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-provn-accent to-provn-accent/80 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {video.creator.displayName?.[0]?.toUpperCase() || video.creator.handle[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Verification Badge */}
                {video.ipInfo.status === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>

              {/* Creator Name and Handle */}
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">
                  {video.creator.displayName || video.creator.handle}
                </h3>
                <p className="text-white/80 text-sm">@{video.creator.handle}</p>
              </div>
            </div>

            {/* Video Title */}
            <h2 className="text-white font-semibold text-lg mb-2 leading-tight">
              {video.title}
            </h2>

            {/* Description */}
            <p className="text-white/90 text-sm leading-relaxed mb-2 line-clamp-3">
              {video.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {video.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-white/80 text-sm bg-black/30 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {video.tags.length > 3 && (
                <span className="text-white/60 text-sm">
                  +{video.tags.length - 3} more
                </span>
              )}
            </div>

            {/* View Count */}
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{formatCount(video.metrics.views)} views</span>
              </div>
              
              {video.ipInfo.type === 'original' && (
                <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                  Original
                </div>
              )}
              
              {video.ipInfo.type === 'derivative' && (
                <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                  Remix
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-4 pointer-events-auto">
          {/* Like Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onLike}
            disabled={!isAuthenticated}
            className={`flex flex-col items-center gap-1 ${
              !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
              video.isLiked 
                ? 'bg-red-500/20 border-2 border-red-500' 
                : 'bg-black/30 border-2 border-white/30 hover:bg-black/50'
            }`}>
              <Heart 
                className={`w-6 h-6 transition-colors ${
                  video.isLiked ? 'text-red-500 fill-red-500' : 'text-white'
                }`} 
              />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(video.metrics.likes)}
            </span>
          </motion.button>

          {/* Share Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShareClick}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/30 hover:bg-black/50 transition-colors">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(video.metrics.shares)}
            </span>
          </motion.button>

          {/* Tip Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowTipModal(true)}
            disabled={!isAuthenticated}
            className={`flex flex-col items-center gap-1 ${
              !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-2 border-yellow-500/50 hover:from-yellow-500/30 hover:to-orange-500/30 transition-colors">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(video.metrics.tips)}
            </span>
          </motion.button>

          {/* Details Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDetails}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/30 hover:bg-black/50 transition-colors">
              <Info className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Details</span>
          </motion.button>
        </div>

        {/* License Info Badge */}
        {video.licensing.price > 0 && (
          <div className="absolute top-20 right-4 pointer-events-auto">
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-lg px-3 py-2">
              <div className="text-green-400 text-xs font-medium text-center">
                <div>Remix License</div>
                <div className="font-bold">{video.licensing.price} wCAMP</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        video={video}
        isAuthenticated={isAuthenticated}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        video={video}
        onShare={handleShareSelect}
      />
    </>
  )
}