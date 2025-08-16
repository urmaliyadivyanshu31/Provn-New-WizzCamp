"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ExploreVideo } from "@/types/explore"
import { X, Twitter, Instagram, Copy, ExternalLink } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  video: ExploreVideo
  onShare: (platform: 'twitter' | 'instagram') => void
}

export function ShareModal({ isOpen, onClose, video, onShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const videoUrl = `${window.location.origin}/video/${video.tokenId}`
  
  const shareText = `Check out this amazing video by @${video.creator.handle} on Provn! 🎥✨\n\n"${video.title}"\n\n#Provn #IPNFT #Web3Creator`

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(videoUrl)}`
    window.open(twitterUrl, '_blank')
    onShare('twitter')
  }

  const handleInstagramShare = () => {
    // Instagram doesn't have a direct web share API, so we copy the link and provide instructions
    copyToClipboard()
    toast.info('Link copied! Paste it in your Instagram story or bio')
    onShare('instagram')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-provn-surface border border-provn-border rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-provn-border">
              <h2 className="text-lg font-bold text-provn-text">Share Video</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-provn-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Video Preview */}
              <div className="flex gap-3 p-3 bg-provn-surface-2 rounded-lg">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-provn-accent/20 flex items-center justify-center">
                    <span className="text-provn-accent font-bold">#{video.tokenId}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-provn-text truncate">{video.title}</h3>
                  <p className="text-sm text-provn-muted">by @{video.creator.handle}</p>
                  <p className="text-xs text-provn-muted mt-1">
                    {video.metrics.views} views • {video.metrics.likes} likes
                  </p>
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                {/* Twitter */}
                <button
                  onClick={handleTwitterShare}
                  className="w-full flex items-center gap-3 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors group"
                >
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Twitter className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-provn-text">Share on Twitter</h4>
                    <p className="text-sm text-provn-muted">Post to your Twitter feed</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-provn-muted group-hover:text-provn-text transition-colors" />
                </button>

                {/* Instagram */}
                <button
                  onClick={handleInstagramShare}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 rounded-lg transition-colors group"
                >
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-provn-text">Share on Instagram</h4>
                    <p className="text-sm text-provn-muted">Copy link for your story</p>
                  </div>
                  <Copy className="w-4 h-4 text-provn-muted group-hover:text-provn-text transition-colors" />
                </button>

                {/* Copy Link */}
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 p-4 bg-provn-surface-2 hover:bg-provn-border/30 border border-provn-border rounded-lg transition-colors group"
                >
                  <div className="p-2 bg-provn-accent rounded-lg">
                    <Copy className="w-5 h-5 text-provn-bg" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-provn-text">Copy Link</h4>
                    <p className="text-sm text-provn-muted">Share anywhere you want</p>
                  </div>
                  {copied && (
                    <div className="text-green-500 text-sm font-medium">Copied!</div>
                  )}
                </button>
              </div>

              {/* Link Preview */}
              <div className="p-3 bg-provn-surface-2 rounded-lg">
                <p className="text-xs text-provn-muted mb-1">Video URL:</p>
                <p className="text-sm text-provn-text font-mono bg-provn-surface px-2 py-1 rounded break-all">
                  {videoUrl}
                </p>
              </div>

              {/* Share Stats */}
              <div className="text-center">
                <p className="text-sm text-provn-muted">
                  This video has been shared <span className="font-semibold text-provn-text">{video.metrics.shares}</span> times
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}