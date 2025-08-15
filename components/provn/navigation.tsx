"use client"

import { useState, useEffect } from "react"
import { useAuth, useModal } from '@campnetwork/origin/react'
import { Menu, X, Wallet, User } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { CreateProfileModal } from "./create-profile-modal"
import { useProfile } from "@/hooks/useProfile"

interface NavigationProps {
  currentPage?: "home" | "upload" | "dashboard" | "video" | "provs" | "profile"
}

// Custom Provn Logo Component
const ProvnLogo = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <motion.div
      className="flex items-center space-x-2"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        {/* Logo Icon */}
        <div className="w-8 h-8 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-provn-bg rounded-sm transform rotate-12"></div>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 w-8 h-8 bg-provn-accent/20 rounded-lg blur-sm"></div>
      </div>
      
      {/* Logo Text */}
      <div className="font-headline font-bold">
        <span className="text-2xl text-provn-text">Prov</span>
        <span className="text-2xl text-provn-accent">n</span>
        <div className={`h-0.5 bg-gradient-to-r from-provn-accent to-transparent transition-all duration-300 ${isScrolled ? 'w-8' : 'w-12'}`}></div>
      </div>
    </motion.div>
  )
}

export function Navigation({ currentPage }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const { scrollY } = useScroll()
  const { isAuthenticated, walletAddress } = useAuth()
  const { openModal } = useModal()
  const { profile } = useProfile(walletAddress || undefined)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navOpacity = useTransform(scrollY, [0, 100], [1, 0.95])

  return (
    <>
      <motion.nav 
        style={{ opacity: navOpacity }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-provn-bg/80 backdrop-blur-xl border-b border-provn-border/50 shadow-lg shadow-provn-bg/20' 
            : 'bg-transparent'
        }`}
        role="navigation" 
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <a
                href="/"
                className="focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg rounded-lg p-1"
                aria-label="Provn - Go to homepage"
              >
                <ProvnLogo isScrolled={isScrolled} />
              </a>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div 
              className="hidden md:flex items-center gap-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <NavLink href="/provs" currentPage={currentPage} page="provs">
                Explore
              </NavLink>
              <NavLink href="/upload" currentPage={currentPage} page="upload">
                Create
              </NavLink>
              <NavLink href="/dashboard" currentPage={currentPage} page="dashboard">
                Dashboard
              </NavLink>
              
              {/* Profile and Connect Wallet */}
              {isAuthenticated ? (
                <>
                  <motion.button
                    onClick={() => {
                      if (profile) {
                        // Profile exists, navigate to it
                        window.location.href = `/u/${profile.handle}`
                      } else {
                        // No profile, show create profile modal
                        setShowCreateProfile(true)
                      }
                    }}
                    className="relative px-4 py-2 rounded-lg font-medium transition-all duration-200 text-provn-muted hover:text-provn-text hover:bg-provn-surface/30 flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User className="w-4 h-4" />
                    {profile ? 'View Profile' : 'Create Profile'}
                  </motion.button>
                  <motion.button
                    onClick={openModal}
                    className="relative px-4 py-2 rounded-lg font-medium transition-all duration-200 text-provn-muted hover:text-provn-text hover:bg-provn-surface/30 flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Wallet className="w-4 h-4" />
                    {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Wallet'}
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={openModal}
                  className="relative px-4 py-2 rounded-lg font-medium transition-all duration-200 text-provn-muted hover:text-provn-text hover:bg-provn-surface/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </motion.button>
              )}
            </motion.div>

            {/* Mobile menu button */}
            <motion.div 
              className="md:hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-xl text-provn-muted hover:text-provn-text hover:bg-provn-surface/50 focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg transition-all duration-200 ${
                  isScrolled ? 'bg-provn-surface/30' : ''
                }`}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={isMenuOpen ? "open" : "closed"}
          variants={{
            open: {
              opacity: 1,
              height: "auto",
              y: 0,
            },
            closed: {
              opacity: 0,
              height: 0,
              y: -10,
            }
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden bg-provn-bg/95 backdrop-blur-xl border-t border-provn-border/50"
          id="mobile-menu"
        >
          <div className="px-4 py-6 space-y-4">
            <MobileNavLink href="/provs" onClick={() => setIsMenuOpen(false)}>
              Explore Provs
            </MobileNavLink>
            <MobileNavLink href="/upload" onClick={() => setIsMenuOpen(false)}>
              Create Content
            </MobileNavLink>
            <MobileNavLink href="/dashboard" onClick={() => setIsMenuOpen(false)}>
              Dashboard
            </MobileNavLink>

            {/* Mobile Wallet Connection */}
            <div className="pt-4 border-t border-provn-border/30">
              {isAuthenticated ? (
                <motion.button
                  onClick={() => {
                    if (profile) {
                      // Profile exists, navigate to it
                      window.location.href = `/u/${profile.handle}`
                    } else {
                      // No profile, show create profile modal
                      setShowCreateProfile(true)
                    }
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-provn-surface/50 border border-provn-border/50 w-full text-left"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 bg-provn-accent rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-provn-bg" />
                  </div>
                  <div>
                    <div className="font-medium text-provn-text">
                      {profile ? 'View Profile' : 'Create Profile'}
                    </div>
                    <div className="text-sm text-provn-muted">
                      {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Wallet'}
                    </div>
                  </div>
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => {
                    openModal()
                    setIsMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-provn-surface/50 border border-provn-border/50 text-provn-text hover:bg-provn-surface hover:border-provn-border transition-all duration-200 cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onSuccess={(handle) => {
          setShowCreateProfile(false)
          // Navigate to the new profile
          window.location.href = `/u/${handle}`
        }}
      />
    </>
  )
}

// Desktop Navigation Link Component
const NavLink = ({ 
  href, 
  children, 
  currentPage, 
  page 
}: { 
  href: string
  children: React.ReactNode
  currentPage?: string
  page: string 
}) => {
  const isActive = currentPage === page

  return (
    <motion.a
      href={href}
      className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        isActive
          ? 'text-provn-accent bg-provn-accent/10'
          : 'text-provn-muted hover:text-provn-text hover:bg-provn-surface/30'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
      {isActive && (
        <motion.div
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-provn-accent rounded-full"
          layoutId="activeNavIndicator"
        />
      )}
    </motion.a>
  )
}

// Mobile Navigation Link Component  
const MobileNavLink = ({ 
  href, 
  children, 
  onClick 
}: { 
  href: string
  children: React.ReactNode
  onClick: () => void
}) => {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-provn-text hover:text-provn-accent hover:bg-provn-surface/30 rounded-lg transition-all duration-200 font-medium"
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.a>
  )
}