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
    
    // Declare variables outside try block for proper cleanup scope
    let originalTransform = ''
    let originalTransition = ''
    let originalChildStyles: Array<{element: HTMLElement, transform: string, transition: string}> = []
    let cardElement: HTMLElement | null = null
    
    try {
      // Wait a bit for modal animation to complete and DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 500))
      
      cardElement = document.getElementById('profile-card')
      if (!cardElement) {
        console.error('❌ Profile card element not found in DOM')
        toast.error('Profile card not ready. Please wait a moment and try again.')
        return
      }

      // Ensure the element is visible and has dimensions
      const rect = cardElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        console.error('❌ Profile card element has no dimensions:', rect)
        toast.error('Profile card not properly loaded. Please try again.')
        return
      }

      console.log('🎯 Starting profile card download...', { width: rect.width, height: rect.height })

      // Create a temporary fixed container to ensure consistent rendering
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 340px;
        height: 440px;
        z-index: 999999;
        background: transparent;
        pointer-events: none;
      `
      document.body.appendChild(tempContainer)

      // Clone the profile card element
      const cardClone = cardElement.cloneNode(true) as HTMLElement
      cardClone.id = 'profile-card-capture'
      cardClone.style.cssText = `
        width: 340px !important;
        height: 440px !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        transition: none !important;
        animation: none !important;
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
        border-radius: 24px !important;
        background: linear-gradient(135deg, #161b22 0%, #0d1117 50%, #161b22 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 0 60px rgba(255, 109, 1, 0.1) !important;
        overflow: hidden !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      `

      // Fix all child elements to ensure proper styling
      const allElements = cardClone.querySelectorAll('*')
      allElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.transform = 'none'
          el.style.transition = 'none'
          el.style.animation = 'none'
          el.style.visibility = 'visible'
          el.style.opacity = '1'
        }
      })

      tempContainer.appendChild(cardClone)

      // Wait for the clone to render
      await new Promise(resolve => setTimeout(resolve, 300))

      // Use dom-to-image-more to capture the cloned element
      const domtoimage = (await import('dom-to-image-more')).default
      const dataUrl = await domtoimage.toPng(cardClone, {
        quality: 1.0,
        pixelRatio: 2,
        width: 340,
        height: 440,
        bgcolor: '#0d1117'
      })

      // Remove the temporary container
      document.body.removeChild(tempContainer)

      console.log('✅ Profile card captured successfully!')

      // Create an image from the data URL to add padding
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load captured image'))
        img.src = dataUrl
      })

      // Create a canvas to add padding around the captured image
      const paddedCanvas = document.createElement('canvas')
      const paddedCtx = paddedCanvas.getContext('2d')!
      const padding = 40
      
      paddedCanvas.width = img.width + (padding * 2)
      paddedCanvas.height = img.height + (padding * 2)
      
      // Fill with a nice gradient background
      const gradient = paddedCtx.createLinearGradient(0, 0, 0, paddedCanvas.height)
      gradient.addColorStop(0, '#0d1117')
      gradient.addColorStop(0.5, '#161b22')  
      gradient.addColorStop(1, '#0d1117')
      
      paddedCtx.fillStyle = gradient
      paddedCtx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height)
      
      // Draw the captured image centered with padding
      paddedCtx.drawImage(img, padding, padding)

      // Create download link
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      link.download = `${profile.handle}-profile-card-${timestamp}.png`
      
      // Convert to blob for better browser compatibility
      await new Promise<void>((resolve, reject) => {
        paddedCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            link.href = url
            
            // Trigger download
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // Clean up the blob URL
            setTimeout(() => URL.revokeObjectURL(url), 100)
            
            console.log('✅ Profile card downloaded successfully!')
            toast.success('Profile card downloaded successfully!')
            resolve()
          } else {
            reject(new Error('Failed to create download blob'))
          }
        }, 'image/png', 1.0)
      })
    } catch (error) {
      console.error('❌ Download error:', error)
      
      // Clean up any leftover temporary containers
      const leftoverContainer = document.getElementById('profile-card-capture')?.parentElement
      if (leftoverContainer && document.body.contains(leftoverContainer)) {
        try {
          document.body.removeChild(leftoverContainer)
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError)
        }
      }
      
      toast.error('Failed to download profile card. Please try again.')
    } finally {
      setIsDownloading(false)
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