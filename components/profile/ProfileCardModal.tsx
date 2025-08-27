"use client"

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, Copy, Instagram } from 'lucide-react'
import { ProvnButton } from '@/components/provn/button'
import { ProfileCard } from './ProfileCard'
import { toast } from 'sonner'
import { Profile } from '@/lib/supabase'

interface ProfileCardModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  title?: string
  subtitle?: string
}

export function ProfileCardModal({ 
  isOpen, 
  onClose, 
  profile,
  title = "",
  subtitle = ""
}: ProfileCardModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const [isInteractive, setIsInteractive] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('🎯 ProfileCardModal: isOpen changed:', isOpen, 'profile:', profile?.handle, 'mounted:', mounted)
  }, [isOpen, profile?.handle, mounted])

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      
      const cardElement = document.getElementById('profile-card')
      if (!cardElement) {
        toast.error('Card not found')
        return
      }

      console.log('🎯 Starting profile card download...')

      // Create a hidden container for clean capture without affecting the original layout
      const captureContainer = document.createElement('div')
      captureContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 340px;
        height: 440px;
        background: #0d1117;
        z-index: -1;
        visibility: hidden;
        pointer-events: none;
        overflow: hidden;
        isolation: isolate;
      `
      document.body.appendChild(captureContainer)

      // Clone the profile card element with deep cloning
      const cardClone = cardElement.cloneNode(true) as HTMLElement
      cardClone.style.cssText = `
        transform: none !important;
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        width: 340px !important;
        height: 440px !important;
        display: block !important;
        visibility: visible !important;
      `
      
      // Ensure cloned element has unique ID and clean any transforms
      cardClone.id = 'profile-card-clone'
      
      // Remove any motion/animation classes and reset transforms that might interfere
      const cleanElementForCapture = (element: Element) => {
        if (element instanceof HTMLElement) {
          // Remove animation/motion classes
          element.classList.remove('transform', 'transition-all', 'hover:scale-105')
          
          // Reset any inline transforms that might be applied by motion libraries
          element.style.transform = 'none'
          element.style.transition = 'none'
        }
        
        // Clean all child elements recursively
        element.querySelectorAll('*').forEach(child => {
          if (child instanceof HTMLElement) {
            child.classList.remove('transform', 'transition-all', 'hover:scale-105')
            child.style.transform = 'none'
            child.style.transition = 'none'
          }
        })
      }
      cleanElementForCapture(cardClone)
      
      captureContainer.appendChild(cardClone)

      // Wait for clone to be ready and styles to apply
      await new Promise(resolve => setTimeout(resolve, 200))

      // Capture the cloned card without affecting the original
      const canvas = await html2canvas(cardClone, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 340,
        height: 440,
        windowWidth: 340,
        windowHeight: 440,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        foreignObjectRendering: true,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Ensure clean styling in the cloned document
          const clonedElement = clonedDoc.getElementById('profile-card-clone')
          if (clonedElement) {
            clonedElement.style.transform = 'none'
            clonedElement.style.filter = 'none'
            clonedElement.style.boxShadow = clonedElement.style.boxShadow // Keep original shadows
          }
        },
        ignoreElements: (element) => {
          // Only capture our specific cloned card
          if (element.id === 'profile-card-clone' || cardClone.contains(element)) {
            return false
          }
          return !captureContainer.contains(element)
        }
      })

      // Clean up the hidden container
      document.body.removeChild(captureContainer)

      // Add some padding around the card for better presentation
      const paddedCanvas = document.createElement('canvas')
      const paddedCtx = paddedCanvas.getContext('2d')!
      const padding = 40
      
      paddedCanvas.width = canvas.width + (padding * 2)
      paddedCanvas.height = canvas.height + (padding * 2)
      
      // Fill with a nice gradient background
      const gradient = paddedCtx.createLinearGradient(0, 0, 0, paddedCanvas.height)
      gradient.addColorStop(0, '#0d1117')
      gradient.addColorStop(0.5, '#161b22')  
      gradient.addColorStop(1, '#0d1117')
      
      paddedCtx.fillStyle = gradient
      paddedCtx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height)
      
      // Draw the card centered with padding
      paddedCtx.drawImage(canvas, padding, padding)

      // Create download link
      const link = document.createElement('a')
      link.download = `${profile.handle}-profile-card.png`
      link.href = paddedCanvas.toDataURL('image/png', 1.0)
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('✅ Profile card downloaded successfully!')
      toast.success('Profile card downloaded successfully!')
    } catch (error) {
      console.error('❌ Download error:', error)
      
      // Ensure cleanup happens even if there's an error
      const leftoverContainer = document.querySelector('#profile-card-clone')?.parentElement
      if (leftoverContainer && document.body.contains(leftoverContainer)) {
        document.body.removeChild(leftoverContainer)
      }
      
      toast.error('Failed to download profile card. Please try again.')
    } finally {
      setIsDownloading(false)
      
      // Final safety cleanup
      const leftoverContainer = document.querySelector('#profile-card-clone')?.parentElement
      if (leftoverContainer && document.body.contains(leftoverContainer)) {
        try {
          document.body.removeChild(leftoverContainer)
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError)
        }
      }
    }
  }

  // Mouse tracking for 3D effect - only within card area
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    // Prevent immediate close from the opening click by delaying backdrop interactivity
    if (isOpen) {
      setIsInteractive(false)
      const timer = setTimeout(() => setIsInteractive(true), 150)
      return () => clearTimeout(timer)
    } else {
      setIsInteractive(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const cardRect = cardRef.current.getBoundingClientRect()
        
        // Only track mouse if it's within the card bounds
        if (e.clientX >= cardRect.left && e.clientX <= cardRect.right &&
            e.clientY >= cardRect.top && e.clientY <= cardRect.bottom) {
          
          const centerX = cardRect.left + cardRect.width / 2
          const centerY = cardRect.top + cardRect.height / 2
          const x = (e.clientX - centerX) / (cardRect.width / 2)
          const y = (e.clientY - centerY) / (cardRect.height / 2)
          
          // Limit the effect strength
          const clampedX = Math.max(-1, Math.min(1, x)) * 0.5
          const clampedY = Math.max(-1, Math.min(1, y)) * 0.5
          
          setMousePosition({ x: clampedX, y: clampedY })
        } else {
          // Reset position when mouse leaves card area
          setMousePosition({ x: 0, y: 0 })
        }
      }
    }

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isOpen])

  const handleShareToX = () => {
    const text = `Check out @${profile.handle}'s profile on Provn - the decentralized content platform! 🚀`
    const url = window.location.origin + `/u/${profile.handle}`
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    setShowShareMenu(false)
  }

  const handleShareToInstagram = () => {
    // Instagram doesn't have direct sharing, so copy text for user to paste
    const text = `Check out @${profile.handle}'s profile on Provn - the decentralized content platform! 🚀 ${window.location.origin}/u/${profile.handle}`
    navigator.clipboard.writeText(text)
    toast.success('Text copied! Paste it on Instagram')
    setShowShareMenu(false)
  }

  const handleCopyLink = async () => {
    try {
      const profileUrl = window.location.origin + `/u/${profile.handle}`
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Profile link copied!')
      setShowShareMenu(false)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={() => { if (isInteractive) onClose() }} />
          
          {/* Welcome Text */}
          <div className="mb-6 text-center relative z-10">
            <h1 className="font-headline text-2xl font-bold text-white tracking-wide uppercase">
              WELCOME, PROVER {(profile.display_name || profile.handle).toUpperCase()}
            </h1>
          </div>

          {/* Profile Card */}
          <div className="flex justify-center mb-8 relative z-10">
            <motion.div
              ref={cardRef}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                rotateX: mousePosition.y * -8,
                rotateY: mousePosition.x * 8,
                scale: 1 + (Math.abs(mousePosition.x) + Math.abs(mousePosition.y)) * 0.05
              }}
              transition={{ 
                duration: 0.1,
                ease: "easeOut"
              }}
              style={{ 
                perspective: '1000px',
                transformStyle: 'preserve-3d'
              }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <ProfileCard profile={profile} className="relative z-10 transform" />
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center bg-black/20 backdrop-blur-sm rounded-2xl p-4 relative z-10" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-8 py-4 bg-gradient-to-r from-provn-accent via-orange-500 to-red-500 text-white rounded-xl font-headline font-bold text-base flex items-center gap-3 shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            >
              <Download className="w-5 h-5" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="px-8 py-4 bg-white/10 border-2 border-white/30 text-white rounded-xl font-headline font-bold text-base flex items-center gap-3 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>

              {/* Share Menu */}
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-provn-surface border border-provn-border rounded-lg shadow-lg py-2 min-w-[140px] z-20"
                  >
                    <button
                      onClick={handleShareToX}
                      className="w-full px-4 py-2 text-left hover:bg-provn-border/30 transition-colors flex items-center gap-2 text-sm text-provn-text font-headline"
                    >
                      <div className="w-4 h-4 text-white bg-black rounded-sm flex items-center justify-center text-xs font-bold">𝕏</div>
                      X
                    </button>
                    <button
                      onClick={handleShareToInstagram}
                      className="w-full px-4 py-2 text-left hover:bg-provn-border/30 transition-colors flex items-center gap-2 text-sm text-provn-text font-headline"
                    >
                      <Instagram className="w-4 h-4 text-pink-400" />
                      Instagram
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-4 py-2 text-left hover:bg-provn-border/30 transition-colors flex items-center gap-2 text-sm text-provn-text font-headline"
                    >
                      <Copy className="w-4 h-4 text-provn-muted" />
                      Copy Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}