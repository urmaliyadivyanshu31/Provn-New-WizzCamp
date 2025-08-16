"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExploreVideo } from "@/types/explore"
import { 
  X, 
  ExternalLink, 
  Flag, 
  Users, 
  Calendar, 
  Shield, 
  Coins,
  Eye,
  Heart,
  Share2,
  DollarSign,
  Copy,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { useOriginLicensing } from "@/hooks/useOriginLicensing"
import { toast } from "sonner"

interface VideoDetailsModalProps {
  video: ExploreVideo
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
}

export function VideoDetailsModal({ video, isOpen, onClose, isAuthenticated }: VideoDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'creator' | 'ip' | 'licensing'>('creator')
  const [licensePeriods, setLicensePeriods] = useState(1)
  
  const { buyLicense, loading: licenseLoading } = useOriginLicensing()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleBuyLicense = async () => {
    if (!isAuthenticated) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      const success = await buyLicense(video.tokenId, licensePeriods)
      if (success) {
        toast.success('License purchased successfully!')
        onClose()
      }
    } catch (error) {
      console.error('Failed to buy license:', error)
    }
  }

  const totalLicenseCost = video.licensing.price * licensePeriods

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
            className="bg-provn-surface border border-provn-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-provn-border">
              <h2 className="text-xl font-bold text-provn-text">Video Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-provn-muted" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-provn-border">
              <button
                onClick={() => setActiveTab('creator')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'creator'
                    ? 'text-provn-accent border-b-2 border-provn-accent bg-provn-accent/5'
                    : 'text-provn-muted hover:text-provn-text'
                }`}
              >
                Creator
              </button>
              <button
                onClick={() => setActiveTab('ip')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'ip'
                    ? 'text-provn-accent border-b-2 border-provn-accent bg-provn-accent/5'
                    : 'text-provn-muted hover:text-provn-text'
                }`}
              >
                IP Information
              </button>
              <button
                onClick={() => setActiveTab('licensing')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'licensing'
                    ? 'text-provn-accent border-b-2 border-provn-accent bg-provn-accent/5'
                    : 'text-provn-muted hover:text-provn-text'
                }`}
              >
                Licensing
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Creator Tab */}
              {activeTab === 'creator' && (
                <div className="space-y-6">
                  {/* Creator Header */}
                  <div className="flex items-center gap-4">
                    {video.creator.avatarUrl ? (
                      <img
                        src={video.creator.avatarUrl}
                        alt={video.creator.handle}
                        className="w-16 h-16 rounded-full object-cover border-2 border-provn-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-provn-accent to-provn-accent/80 flex items-center justify-center border-2 border-provn-border">
                        <span className="text-white font-bold text-xl">
                          {video.creator.displayName?.[0]?.toUpperCase() || video.creator.handle[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-provn-text">
                          {video.creator.displayName || video.creator.handle}
                        </h3>
                        {video.ipInfo.status === 'verified' && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-provn-muted">@{video.creator.handle}</p>
                    </div>
                  </div>

                  {/* Creator Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-provn-surface-2 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-provn-muted" />
                        <span className="text-sm text-provn-muted">Followers</span>
                      </div>
                      <p className="text-xl font-bold text-provn-text">
                        {video.creator.followers.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-provn-surface-2 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-provn-muted" />
                        <span className="text-sm text-provn-muted">Joined</span>
                      </div>
                      <p className="text-xl font-bold text-provn-text">
                        {formatDate(video.creator.joinedDate)}
                      </p>
                    </div>
                  </div>

                  {/* Wallet Address */}
                  <div className="bg-provn-surface-2 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-provn-text mb-1">Wallet Address</h4>
                        <p className="text-provn-muted font-mono">
                          {formatAddress(video.creator.walletAddress)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(video.creator.walletAddress, 'Wallet address')}
                          className="p-2 hover:bg-provn-surface rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-provn-muted" />
                        </button>
                        <a
                          href={`https://basecamp.cloud.blockscout.com/address/${video.creator.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-provn-surface rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-provn-muted" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Video Description */}
                  <div>
                    <h4 className="font-semibold text-provn-text mb-2">Description</h4>
                    <p className="text-provn-muted leading-relaxed">{video.description}</p>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-semibold text-provn-text mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-provn-accent/10 text-provn-accent rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* IP Information Tab */}
              {activeTab === 'ip' && (
                <div className="space-y-6">
                  {/* IP Status */}
                  <div className="bg-provn-surface-2 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-provn-text mb-1">IpNFT ID</h4>
                        <p className="text-provn-muted font-mono">#{video.tokenId}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        video.ipInfo.status === 'verified'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {video.ipInfo.status === 'verified' ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Verified
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Pending
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-provn-surface-2 rounded-lg p-4">
                      <h4 className="font-semibold text-provn-text mb-1">Type</h4>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                        video.ipInfo.type === 'original'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-purple-500/10 text-purple-500'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {video.ipInfo.type === 'original' ? 'Original' : 'Derivative'}
                      </div>
                    </div>
                    <div className="bg-provn-surface-2 rounded-lg p-4">
                      <h4 className="font-semibold text-provn-text mb-1">Minted</h4>
                      <p className="text-provn-muted">{formatDate(video.ipInfo.mintDate)}</p>
                    </div>
                  </div>

                  {/* Parent Info (if derivative) */}
                  {video.ipInfo.parentId && (
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                      <h4 className="font-semibold text-provn-text mb-2">Parent IP-NFT</h4>
                      <p className="text-provn-muted">This is a derivative work based on IP-NFT #{video.ipInfo.parentId}</p>
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg mx-auto mb-2">
                        <Eye className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="font-bold text-provn-text">{video.metrics.views.toLocaleString()}</p>
                      <p className="text-sm text-provn-muted">Views</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-lg mx-auto mb-2">
                        <Heart className="w-6 h-6 text-red-500" />
                      </div>
                      <p className="font-bold text-provn-text">{video.metrics.likes.toLocaleString()}</p>
                      <p className="text-sm text-provn-muted">Likes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg mx-auto mb-2">
                        <Share2 className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="font-bold text-provn-text">{video.metrics.shares.toLocaleString()}</p>
                      <p className="text-sm text-provn-muted">Shares</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-yellow-500/10 rounded-lg mx-auto mb-2">
                        <DollarSign className="w-6 h-6 text-yellow-500" />
                      </div>
                      <p className="font-bold text-provn-text">{video.metrics.tips.toLocaleString()}</p>
                      <p className="text-sm text-provn-muted">Tips</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Licensing Tab */}
              {activeTab === 'licensing' && (
                <div className="space-y-6">
                  {/* License Info */}
                  <div className="bg-provn-surface-2 rounded-lg p-4">
                    <h4 className="font-semibold text-provn-text mb-4">Remix License</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-provn-muted">Price per period</p>
                        <p className="font-bold text-provn-text">{video.licensing.price} wCAMP</p>
                      </div>
                      <div>
                        <p className="text-sm text-provn-muted">Duration</p>
                        <p className="font-bold text-provn-text">{Math.floor(video.licensing.duration / 86400)} days</p>
                      </div>
                      <div>
                        <p className="text-sm text-provn-muted">Royalty</p>
                        <p className="font-bold text-provn-text">{video.licensing.royalty}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-provn-muted">Payment Token</p>
                        <p className="font-bold text-provn-text">wCAMP</p>
                      </div>
                    </div>
                  </div>

                  {/* License Purchase */}
                  {video.licensing.price > 0 && (
                    <div className="bg-gradient-to-br from-provn-accent/5 to-provn-success/5 border border-provn-accent/20 rounded-lg p-6">
                      <h4 className="font-semibold text-provn-text mb-4">Purchase License</h4>
                      <p className="text-provn-muted mb-4">
                        Purchase a license to create derivative works based on this content.
                      </p>
                      
                      {/* Period Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-provn-text mb-2">
                          License Periods
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={licensePeriods}
                            onChange={(e) => setLicensePeriods(parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                          />
                          <span className="text-provn-muted">
                            × {Math.floor(video.licensing.duration / 86400)} days each
                          </span>
                        </div>
                      </div>

                      {/* Total Cost */}
                      <div className="bg-provn-surface rounded-lg p-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Total Cost:</span>
                          <span className="font-bold text-provn-accent">{totalLicenseCost} wCAMP</span>
                        </div>
                      </div>

                      <ProvnButton
                        onClick={handleBuyLicense}
                        disabled={!isAuthenticated || licenseLoading}
                        className="w-full"
                      >
                        {licenseLoading ? (
                          'Processing...'
                        ) : (
                          <>
                            <Coins className="w-4 h-4 mr-2" />
                            Get License ({totalLicenseCost} wCAMP)
                          </>
                        )}
                      </ProvnButton>

                      {!isAuthenticated && (
                        <p className="text-sm text-provn-muted text-center mt-2">
                          Connect your wallet to purchase a license
                        </p>
                      )}
                    </div>
                  )}

                  {video.licensing.price === 0 && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-green-500">Free License</span>
                      </div>
                      <p className="text-provn-muted mt-1">
                        This content is available for free remixing and derivative works.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 p-6 border-t border-provn-border">
              <ProvnButton
                variant="secondary"
                onClick={() => window.open(`https://basecamp.cloud.blockscout.com/token/0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1/instance/${video.tokenId}`, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Blockscout
              </ProvnButton>
              
              <ProvnButton
                variant="secondary"
                onClick={() => {
                  // TODO: Implement report functionality
                  toast.info('Report functionality coming soon')
                }}
                className="px-6"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report
              </ProvnButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}