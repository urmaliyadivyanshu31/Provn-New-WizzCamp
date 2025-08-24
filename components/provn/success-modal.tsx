"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ProvnButton } from "./button"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'email' | 'wallet' | 'x'
  username?: string
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  username 
}) => {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      // Auto-hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const getSuccessMessage = () => {
    switch (type) {
      case 'x':
        return {
          title: "Successfully Submitted!",
          subtitle: `Twitter account ${username ? `@${username}` : ''} verified and submitted for review!`,
          description: "We're excited to have you join the Provn community. You'll be notified when access is approved."
        }
      case 'email':
        return {
          title: "Successfully Submitted!",
          subtitle: "Your email has been added to our beta waitlist",
          description: "We're excited to have you join the Provn community. You'll be notified when access is approved."
        }
      case 'wallet':
        return {
          title: "Access Granted!",
          subtitle: "Welcome to Provn - redirecting to platform...",
          description: "Your wallet is verified and you have full access to all features."
        }
      default:
        return {
          title: "Success!",
          subtitle: "Your request has been submitted",
          description: "Thank you for your interest in Provn."
        }
    }
  }

  const message = getSuccessMessage()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-provn-accent rounded-full"
                  initial={{
                    x: "50vw",
                    y: "50vh",
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100}vw`,
                    y: `${Math.random() * 100}vh`,
                    scale: [0, 1, 0],
                    rotate: [0, 360, 720],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    ease: "easeOut",
                    delay: Math.random() * 0.5,
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ 
              duration: 0.4,
              type: "spring",
              bounce: 0.3
            }}
            className="relative bg-provn-surface border border-provn-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon with Animation */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2,
                  duration: 0.5,
                  type: "spring",
                  bounce: 0.6
                }}
                className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h2 className="font-headline text-2xl font-bold text-provn-text mb-2">
                {message.title}
              </h2>
              <p className="text-provn-accent font-medium mb-3">
                {message.subtitle}
              </p>
              <p className="text-provn-muted text-sm leading-relaxed">
                {message.description}
              </p>
            </motion.div>

            {/* Follow CTA - only show for non-wallet success */}
            {type !== 'wallet' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <div className="bg-provn-surface-2 border border-provn-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-provn-text font-medium text-sm">
                          Follow for updates
                        </p>
                        <p className="text-provn-muted text-xs">
                          @provndotfun
                        </p>
                      </div>
                    </div>
                    <ProvnButton
                      onClick={() => window.open('https://x.com/provndotfun', '_blank')}
                      className="py-2 px-4 text-sm"
                    >
                      Follow
                    </ProvnButton>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {type === 'wallet' ? (
                <ProvnButton
                  onClick={onClose}
                  className="w-full py-3"
                >
                  Continue to Platform
                </ProvnButton>
              ) : (
                <>
                  <ProvnButton
                    onClick={onClose}
                    className="w-full py-3"
                  >
                    Got it, thanks!
                  </ProvnButton>
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-provn-muted text-sm hover:text-provn-text transition-colors"
                  >
                    Close
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SuccessModal