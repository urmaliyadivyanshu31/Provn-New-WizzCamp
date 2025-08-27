"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ExploreVideo } from "@/types/explore"
import { X, Instagram, Copy, ExternalLink, Share2, Eye, Heart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ProvnButton } from "@/components/provn/button"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  video: ExploreVideo
  onShare: (platform: 'x' | 'instagram') => void
}

export function ShareModal({ isOpen, onClose, video, onShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const videoUrl = `${window.location.origin}/video/${video.tokenId}`
  
  const shareText = `Check out this amazing prov by @${video.creator.handle} on Provn! 🎥✨\n\n"${video.title}"\n\n#Provn #IPNFT #Web3Creator`

  const handleXShare = () => {
    // Create an X card-like experience by including thumbnail
    const xText = `Check out this amazing prov by @${video.creator.handle} on Provn! 🎥✨\n\n"${video.title}"\n\n${videoUrl}\n\n#Provn #IPNFT #Web3Creator`
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(xText)}`
    window.open(xUrl, '_blank')
    onShare('x')
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
      toast.success('Prov link copied successfully')
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
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-provn-surface border border-provn-border rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-provn-border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-provn-accent/20 rounded-lg">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-provn-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-provn-text font-headline">Share Prov</h2>
                  <p className="text-xs sm:text-sm text-provn-muted font-headline">Share with your audience</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-provn-surface-2 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-provn-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Video Preview Card */}
              <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 bg-provn-surface-2 rounded-lg">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-provn-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-provn-accent font-bold text-xs sm:text-sm">#{video.tokenId.slice(-4)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-provn-text truncate font-headline">{video.title}</h3>
                  <p className="text-xs sm:text-sm text-provn-muted font-headline">by @{video.creator.handle}</p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-provn-muted font-headline">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">{video.metrics.views.toLocaleString()}</span>
                      <span className="sm:hidden">{video.metrics.views > 1000 ? `${Math.floor(video.metrics.views / 1000)}k` : video.metrics.views}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span className="hidden sm:inline">{video.metrics.likes.toLocaleString()}</span>
                      <span className="sm:hidden">{video.metrics.likes > 1000 ? `${Math.floor(video.metrics.likes / 1000)}k` : video.metrics.likes}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Options - Better aligned and consistent */}
              <div className="space-y-2 sm:space-y-3">
                {/* X - Clean and professional */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleXShare}
                  className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-provn-surface-2 hover:bg-provn-surface border border-provn-border hover:border-provn-accent/30 rounded-lg sm:rounded-xl transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg sm:rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-black/25 transition-all duration-200">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-provn-text font-headline group-hover:text-provn-accent transition-colors">X</h4>
                    <p className="text-xs sm:text-sm text-provn-muted font-headline">Share with preview card</p>
                  </div>
                  <div className="flex-shrink-0 w-5 flex justify-center">
                    <ExternalLink className="w-5 h-5 text-provn-muted group-hover:text-provn-accent transition-colors" />
                  </div>
                </motion.button>

                {/* Instagram - Elegant gradient approach */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstagramShare}
                  className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-provn-surface-2 hover:bg-provn-surface border border-provn-border hover:border-provn-accent/30 rounded-lg sm:rounded-xl transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#E4405F] via-[#F56040] to-[#FFDC80] rounded-lg sm:rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#E4405F]/25 transition-all duration-200">
                    <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-provn-text font-headline group-hover:text-provn-accent transition-colors">Instagram</h4>
                    <p className="text-xs sm:text-sm text-provn-muted font-headline">Copy link for stories</p>
                  </div>
                  <div className="flex-shrink-0 w-5 flex justify-center">
                    <Copy className="w-5 h-5 text-provn-muted group-hover:text-provn-accent transition-colors" />
                  </div>
                </motion.button>

                {/* Copy Link - Premium feel with provn brand colors */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-provn-surface-2 hover:bg-provn-surface border border-provn-border hover:border-provn-accent/30 rounded-lg sm:rounded-xl transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-provn-accent rounded-lg sm:rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-provn-accent/25 transition-all duration-200">
                    <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-provn-bg" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-provn-text font-headline group-hover:text-provn-accent transition-colors">Copy Link</h4>
                    <p className="text-xs sm:text-sm text-provn-muted font-headline">Direct URL to prov</p>
                  </div>
                  <div className="flex-shrink-0 w-5 flex justify-center">
                    {copied ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 text-provn-accent text-sm font-medium font-headline"
                      >
                        <div className="w-2 h-2 bg-provn-accent rounded-full"></div>
                        <span className="text-xs">Copied</span>
                      </motion.div>
                    ) : (
                      <div className="w-5 h-5"></div>
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Share Stats - Elegant and minimal */}
              <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-provn-surface-2 rounded-lg sm:rounded-xl border border-provn-border">
                <div className="w-2 h-2 bg-provn-accent rounded-full animate-pulse"></div>
                <p className="text-xs sm:text-sm text-provn-muted font-headline">
                  <span className="font-bold text-provn-text">{video.metrics.shares.toLocaleString()}</span> shares on Provn
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}