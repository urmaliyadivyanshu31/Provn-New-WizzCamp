"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExploreVideo } from "@/types/explore"
import { X, DollarSign, Heart, Loader2 } from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { useOriginTipping } from "@/hooks/useOriginTipping"

interface TipModalProps {
  isOpen: boolean
  onClose: () => void
  video: ExploreVideo
  isAuthenticated: boolean
}

const PRESET_AMOUNTS = [1, 5, 10, 25, 50, 100]

export function TipModal({ isOpen, onClose, video, isAuthenticated }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(5)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isCustom, setIsCustom] = useState(false)
  const [message, setMessage] = useState("")
  
  const { sendTip, loading, error } = useOriginTipping()

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setIsCustom(false)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setIsCustom(true)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(numValue)
    }
  }

  const handleSendTip = async () => {
    if (!isAuthenticated) return
    
    const amount = isCustom ? parseFloat(customAmount) : selectedAmount
    if (amount <= 0) return

    try {
      const success = await sendTip(video.creator.walletAddress, amount, message)
      if (success) {
        onClose()
        // Reset form
        setSelectedAmount(5)
        setCustomAmount("")
        setMessage("")
        setIsCustom(false)
      }
    } catch (error) {
      console.error('Failed to send tip:', error)
    }
  }

  const finalAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount

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
            className="bg-provn-surface border border-provn-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-provn-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-provn-text">Send Tip</h2>
                  <p className="text-sm text-provn-muted">Support @{video.creator.handle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-provn-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Creator Info */}
              <div className="flex items-center gap-3 p-4 bg-provn-surface-2 rounded-lg">
                {video.creator.avatarUrl ? (
                  <img
                    src={video.creator.avatarUrl}
                    alt={video.creator.handle}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-provn-accent to-provn-accent/80 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {video.creator.displayName?.[0]?.toUpperCase() || video.creator.handle[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-provn-text">
                    {video.creator.displayName || video.creator.handle}
                  </h3>
                  <p className="text-sm text-provn-muted">@{video.creator.handle}</p>
                </div>
              </div>

              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-provn-text mb-3">
                  Tip Amount (wCAMP)
                </label>
                
                {/* Preset Amounts */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {PRESET_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountSelect(amount)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedAmount === amount && !isCustom
                          ? 'border-provn-accent bg-provn-accent/10 text-provn-accent'
                          : 'border-provn-border hover:border-provn-accent/50 text-provn-text'
                      }`}
                    >
                      {amount} wCAMP
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-provn-surface-2 border-2 rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:border-provn-accent transition-colors ${
                      isCustom ? 'border-provn-accent' : 'border-provn-border'
                    }`}
                    min="0.1"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-provn-muted text-sm">
                    wCAMP
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-provn-text mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message for the creator..."
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-provn-muted text-right mt-1">
                  {message.length}/200
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Summary */}
              {finalAmount > 0 && (
                <div className="p-4 bg-provn-accent/10 border border-provn-accent/20 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-provn-text">Total Amount:</span>
                    <span className="font-bold text-provn-accent">{finalAmount} wCAMP</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-provn-border">
              <ProvnButton
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </ProvnButton>
              <ProvnButton
                onClick={handleSendTip}
                disabled={!isAuthenticated || finalAmount <= 0 || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Send Tip
                  </>
                )}
              </ProvnButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}