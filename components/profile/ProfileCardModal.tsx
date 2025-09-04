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
    
    let captureContainer: HTMLDivElement | null = null
    let clonedCardElement: HTMLDivElement | null = null
    
    try {
      // Wait for modal animation to complete and DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const originalCardElement = document.getElementById('profile-card')
      if (!originalCardElement) {
        console.error('❌ Profile card element not found in DOM')
        toast.error('Profile card not ready. Please wait a moment and try again.')
        return
      }

      console.log('🎯 Starting professional profile card capture...')

      // Create completely clean HTML structure with zero CSS classes - only inline styles
      captureContainer = document.createElement('div')
      captureContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 340px;
        height: 440px;
        z-index: -1;
        background: transparent;
        padding: 0;
        margin: 0;
        border: none;
        outline: none;
      `
      document.body.appendChild(captureContainer)

      // Create completely fresh card HTML with zero borders/lines
      captureContainer.innerHTML = `
        <div style="
          width: 340px;
          height: 440px;
          background: linear-gradient(135deg, #161b22 0%, #0d1117 50%, #161b22 100%);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          margin: 0;
          padding: 0;
          border: none;
          outline: none;
          box-shadow: none;
        ">
          <!-- Background patterns -->
          <div style="position: absolute; top: 0; right: 0; width: 128px; height: 128px; background: linear-gradient(135deg, rgba(255, 109, 1, 0.1), transparent); border-radius: 50%; filter: blur(48px);"></div>
          <div style="position: absolute; bottom: 0; left: 0; width: 96px; height: 96px; background: linear-gradient(45deg, rgba(255, 109, 1, 0.05), transparent); border-radius: 50%; filter: blur(32px);"></div>
          
          <!-- Card Content -->
          <div style="position: relative; height: 100%; padding: 24px; display: flex; flex-direction: column; margin: 0; border: none; outline: none;">
            <!-- Header with Profile Picture -->
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 24px; border: none; outline: none;">
              <!-- Profile Picture -->
              <div style="position: relative; width: 128px; height: 128px; margin-bottom: 16px; border: none; outline: none;">
                <img src="${profile.avatar_url || '/placeholder-user.jpg'}" 
                     style="width: 128px; height: 128px; border-radius: 24px; object-fit: cover; border: 2px solid rgba(255, 109, 1, 0.3); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); outline: none;" />
                <!-- Online status -->
                <div style="position: absolute; top: -8px; right: -8px; width: 32px; height: 32px; background: #22c55e; border-radius: 50%; border: 4px solid #161b22; display: flex; align-items: center; justify-content: center; outline: none;">
                  <div style="width: 12px; height: 12px; background: white; border-radius: 50%; border: none; outline: none;"></div>
                </div>
              </div>
              
              <!-- Name and Handle -->
              <div style="border: none; outline: none; margin: 0; padding: 0;">
                <h1 style="font-family: 'Space Grotesk', -apple-system, sans-serif; font-size: 20px; font-weight: 700; color: #f0f6fc; margin: 0 0 4px 0; border: none; outline: none;">
                  ${profile.display_name || profile.handle}
                </h1>
                ${profile.display_name ? `<p style="font-family: 'Space Grotesk', -apple-system, sans-serif; color: #7d8590; font-size: 14px; margin: 0; border: none; outline: none;">@${profile.handle}</p>` : ''}
              </div>
            </div>

            <!-- Badges -->
            <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; border: none; outline: none;">
              <div style="padding: 8px 16px; background: linear-gradient(to right, #1f2937, #111827, #1f2937); border: 1px solid rgba(107, 114, 128, 0.5); border-radius: 8px; backdrop-filter: blur(4px); outline: none;">
                <div style="display: flex; align-items: center; gap: 8px; border: none; outline: none;">
                  <div style="width: 8px; height: 8px; background: linear-gradient(to right, #fbbf24, #f59e0b); border-radius: 50%; border: none; outline: none;"></div>
                  <span style="color: #e5e7eb; font-size: 12px; font-family: 'Space Grotesk', -apple-system, sans-serif; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; border: none; outline: none;">Rising Star</span>
                </div>
              </div>
              
              <div style="padding: 8px 16px; background: linear-gradient(to right, #1f2937, #111827, #1f2937); border: 1px solid rgba(107, 114, 128, 0.5); border-radius: 8px; backdrop-filter: blur(4px); outline: none;">
                <div style="display: flex; align-items: center; gap: 8px; border: none; outline: none;">
                  <div style="width: 8px; height: 8px; background: linear-gradient(to right, #60a5fa, #a855f7); border-radius: 50%; border: none; outline: none;"></div>
                  <span style="color: #e5e7eb; font-size: 12px; font-family: 'Space Grotesk', -apple-system, sans-serif; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; border: none; outline: none;">Creator</span>
                </div>
              </div>
            </div>

            <!-- Spacer -->
            <div style="flex: 1; border: none; outline: none;"></div>

            <!-- Wallet Address -->
            <div style="margin-bottom: 24px; border: none; outline: none;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: #21262d; border-radius: 12px; border: 1px solid rgba(48, 54, 61, 0.5); outline: none;">
                <span style="font-family: 'Space Grotesk', -apple-system, sans-serif; color: #7d8590; font-size: 12px; border: none; outline: none;">
                  ${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}
                </span>
              </div>
            </div>

            <!-- Member Since -->
            <div style="text-align: center; margin-bottom: 16px; border: none; outline: none;">
              <p style="font-family: 'Space Grotesk', -apple-system, sans-serif; color: #7d8590; font-size: 12px; margin: 0; border: none; outline: none;">
                Member since ${new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <!-- Bottom Section -->
            <div style="display: flex; align-items: end; justify-content: space-between; border: none; outline: none;">
              <div style="display: flex; align-items: center; gap: 8px; border: none; outline: none;">
                <!-- Provn Logo (matching navbar exactly) -->
                <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #ffa501, rgba(255, 165, 1, 0.8)); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: none; outline: none;">
                  <div style="width: 12px; height: 12px; background: #111111; border-radius: 2px; transform: rotate(12deg); border: none; outline: none;"></div>
                </div>
                
                <div style="font-family: 'Space Grotesk', -apple-system, sans-serif; font-weight: 700; font-size: 14px; border: none; outline: none;">
                  <span style="color: #e0e0e0; border: none; outline: none;">Prov</span><span style="color: #ffa501; border: none; outline: none;">n</span>
                </div>
              </div>

              <!-- QR Pattern -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; opacity: 0.3; border: none; outline: none;">
                <div style="width: 4px; height: 4px; background: #ffa501; border-radius: 1px; border: none; outline: none;"></div>
                <div style="width: 4px; height: 4px; background: transparent; border: none; outline: none;"></div>
                <div style="width: 4px; height: 4px; background: #ffa501; border-radius: 1px; border: none; outline: none;"></div>
                <div style="width: 4px; height: 4px; background: transparent; border: none; outline: none;"></div>
                <div style="width: 4px; height: 4px; background: #ffa501; border-radius: 1px; border: none; outline: none;"></div>
                <div style="width: 4px; height: 4px; background: #ffa501; border-radius: 1px; border: none; outline: none;"></div>
                <div style="width: 4px; height: 4px; background: transparent; border: none; outline: none;"></div>
                <div style="width: 4px; height: 4px; background: #ffa501; border-radius: 1px; border: none; outline: none;"></div>
                <div style="width: 4px; height: 4px; background: #ffa501; border-radius: 1px; border: none; outline: none;"></div>
              </div>
            </div>
          </div>
        </div>
      `
      
      clonedCardElement = captureContainer.firstElementChild as HTMLDivElement

      // Ensure all images are loaded before capture
      const images = captureContainer.querySelectorAll('img')
      const imageLoadPromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve()
        
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn('⏰ Image load timeout, proceeding anyway')
            resolve()
          }, 5000)
          
          img.onload = () => {
            clearTimeout(timeout)
            resolve()
          }
          img.onerror = () => {
            clearTimeout(timeout)
            console.warn('❌ Image failed to load, using placeholder')
            resolve() // Continue anyway
          }
        })
      })

      await Promise.all(imageLoadPromises)
      
      // Wait for fonts and styles to fully load
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('📸 Capturing profile card with professional quality...')

      // Use dom-to-image-more for high-quality capture with professional settings
      const domtoimage = (await import('dom-to-image-more')).default
      
      const dataUrl = await domtoimage.toPng(clonedCardElement, {
        quality: 1.0,
        pixelRatio: 2,
        width: 340,
        height: 440,
        bgcolor: 'transparent',
        cacheBust: true,
        style: {
          margin: '0',
          padding: '0',
          border: 'none',
          outline: 'none',
          boxShadow: 'none'
        } as any
      })

      console.log('✅ Profile card captured successfully!')

      // Create professional download with proper file naming
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD format
      const profileName = (profile.display_name || profile.handle).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      link.download = `provn-profile-${profileName}-${timestamp}.png`
      
      // Convert to high-quality blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      link.href = url
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      console.log('✅ Professional profile card downloaded successfully!')
      toast.success('Profile card downloaded in ultra-high quality!', {
        description: `Saved as: ${link.download}`
      })

    } catch (error) {
      console.error('❌ Professional capture failed:', error)
      
      // Fallback error message with technical details
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error('Failed to capture profile card', {
        description: `Error: ${errorMessage}. Please try again.`
      })
      
    } finally {
      // Clean up temporary elements
      if (captureContainer && document.body.contains(captureContainer)) {
        try {
          document.body.removeChild(captureContainer)
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError)
        }
      }
      
      // Clean up any other leftover containers
      const leftoverContainers = document.querySelectorAll('[style*="top: -9999px"]')
      leftoverContainers.forEach(container => {
        if (document.body.contains(container)) {
          try {
            document.body.removeChild(container)
          } catch (cleanupError) {
            console.warn('Multiple cleanup warning:', cleanupError)
          }
        }
      })
      
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