"use client"
import React, { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { rafThrottle } from "@/lib/utils/performance"
import { fastTransition, normalTransition, slideUpFast, fadeInFast, optimizedViewport } from "@/lib/utils/animation-config"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { UserJourney } from "@/components/landing/UserJourney"
import { CreateProfileModal } from "@/components/provn/create-profile-modal"
import { 
  Upload, 
  Users, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Play,
  Wallet,
  Shield,
  Lock,
  Globe,
  FileText,
  Zap,
  TrendingUp,
  Award,
  Eye,
  Briefcase,
  X,
  Database
} from "lucide-react"

interface PlatformStats {
  totalCreators: number
  totalVideos: number
  lastUpdated: string
}

interface HomePageClientProps {
  platformStats: PlatformStats
}

// Platform Metrics Component with real server-side data
const LiveMetrics = ({ creatorsCount, videosCount }: { creatorsCount: number, videosCount: number }) => {
  const metrics = [
    { label: "Creators", value: creatorsCount.toString(), icon: Users },
    { label: "Provs Protected", value: videosCount.toString(), icon: CheckCircle },
    { label: "Blockchain Verified", value: "100%", icon: CheckCircle },
    { label: "Global Licensing", value: "∞", icon: Globe }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...fastTransition, delay: index * 0.03 }}
            viewport={optimizedViewport}
            className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center"
          >
            <Icon className="w-8 h-8 text-provn-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-provn-text font-headline">
              {metric.value}
            </div>
            <div className="text-sm text-provn-muted">
              {metric.label}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function HomePageClient({ platformStats }: HomePageClientProps) {
  const { scrollYProgress } = useScroll()
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true, margin: "0px 0px -100px 0px" })
  
  // Authentication state
  const [isConnected, setIsConnected] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  
  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const walletCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('wallet_address='))
      
      if (walletCookie) {
        const walletAddress = walletCookie.split('=')[1]
        setIsConnected(true)
        console.log('✅ User is connected:', walletAddress)
        
        try {
          const response = await fetch(`/api/profile/${walletAddress}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.profile) {
              setHasProfile(true)
              console.log('✅ User has profile:', data.profile.handle)
            } else {
              setHasProfile(false)
              console.log('⚠️ User needs to create profile')
            }
          } else {
            setHasProfile(false)
            console.log('⚠️ User needs to create profile (API error)')
          }
        } catch (error) {
          console.error('Error checking profile:', error)
          setHasProfile(false)
        }
      }
    }
    
    checkAuthStatus()
  }, [])

  // Helper function to handle protected navigation
  const handleProtectedNavigation = (href: string) => {
    if (!isConnected) {
      // Prompt wallet connection via the navigation component
      // Navigate to the page - the page itself will handle wallet connection
      window.location.href = href
    } else if (!hasProfile) {
      setShowCreateProfile(true)
    } else {
      window.location.href = href
    }
  }

  return (
    <div className="min-h-screen font-headline bg-provn-bg">
      <Navigation currentPage="home" />
      
      {/* Hero Section - Creator Focused */}
      <motion.section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-20 md:pt-16"
        style={{ opacity: headerOpacity }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-20 right-20 w-96 h-96 bg-provn-accent/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-4xl mx-auto z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={normalTransition}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ ...normalTransition, delay: 0.1 }}
              >
                {isConnected ? (
                  <ProvnBadge className="bg-green-500/10 text-green-500 border-green-500/20 mb-6">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Wallet Connected
                  </ProvnBadge>
                ) : (
                  <ProvnBadge className="bg-provn-success/10 text-provn-success border-provn-success/20 mb-6">
                    <Play className="w-4 h-4 mr-1" />
                    Video Content Protection
                  </ProvnBadge>
                )}
              </motion.div>
              
              <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-provn-text leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/80">
                  Co-Create The Value You Seek
                </span>
              </h1>
              
              <p className="text-xl font-headline md:text-2xl text-provn-muted leading-relaxed max-w-3xl mx-auto">
                Turn your short-form videos into protected IP. License to others, earn forever. Join <strong className="text-provn-text">
                  {platformStats.totalCreators}+ creators
                </strong> building passive income from their content.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full px-4 sm:px-0">
              <ProvnButton
                size="lg"
                onClick={() => handleProtectedNavigation("/upload")}
                className="w-full sm:w-auto px-6 sm:px-12 py-3 sm:py-4 text-base sm:text-xl font-semibold group"
              >
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:scale-110 transition-transform" />
                <span className="truncate">{isConnected && hasProfile ? "Upload & Protect" : "Start Creating"}</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </ProvnButton>
              <ProvnButton
                variant="secondary"
                size="lg"
                onClick={() => handleProtectedNavigation("/explore")}
                className="w-full sm:w-auto px-6 sm:px-12 py-3 sm:py-4 text-base sm:text-xl group"
              >
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:scale-110 transition-transform" />
                Explore Feed
              </ProvnButton>
            </div>

            {/* Hero Stats - Now with real server-side data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ ...normalTransition, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-12 pt-12 border-t border-provn-border/30"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-text font-headline">
                  {platformStats.totalCreators}+
                </div>
                <div className="text-sm text-provn-muted mt-1">Creators</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-text font-headline">
                  {platformStats.totalVideos}+
                </div>
                <div className="text-sm text-provn-muted mt-1">Provs Protected</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-accent font-headline">100%</div>
                <div className="text-sm text-provn-muted mt-1">True Ownership</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Platform Demo Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              scale: { duration: 12, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-40 -left-40 w-80 h-80 bg-provn-accent/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -bottom-40 -right-40 w-96 h-96 bg-provn-success/8 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={normalTransition}
            viewport={optimizedViewport}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={optimizedViewport}
            >
              <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20 mb-6">
                <Play className="w-4 h-4 mr-1" />
                Platform Walkthrough
              </ProvnBadge>
            </motion.div>
            
            <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6 leading-tight">
              Exploring the Provn Platform:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/80">
                A New Era
              </span>{" "}
              for Content Creators
            </h2>
            <p className="text-xl font-headline md:text-2xl text-provn-muted max-w-3xl mx-auto leading-relaxed">
              Watch how creators are revolutionizing their earnings with zero platform fees
            </p>
          </motion.div>

          {/* Video Container */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={optimizedViewport}
            className="relative"
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-provn-accent/20 to-provn-success/20 rounded-3xl blur-2xl transform rotate-1"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-provn-accent/10 to-transparent rounded-3xl blur-xl transform -rotate-1"></div>
            
            {/* Video wrapper with glassmorphism effect */}
            <div className="relative bg-gradient-to-br from-provn-surface/90 to-provn-surface/70 backdrop-blur-xl border border-provn-border/50 rounded-3xl p-8 shadow-2xl">
              <div className="relative">
                {/* Video container with rounded corners */}
                <div className="relative overflow-hidden rounded-2xl bg-provn-surface border border-provn-border/30">
                  {/* Video option with iframe */}
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe 
                      src="https://www.loom.com/embed/e228fc775d8645e2a4bb68922dea8104?sid=1293affb-0e46-4184-b566-979fded63daa" 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        border: 'none',
                        borderRadius: '1rem'
                      }}
                      allow="fullscreen"
                      title="Exploring the Provn Platform: A New Era for Content Creators"
                    />
                  </div>
                </div>

                {/* Floating stats overlay */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ ...normalTransition, delay: 0.3 }}
                  viewport={optimizedViewport}
                  className="absolute -top-4 -right-4 bg-gradient-to-br from-provn-success/90 to-provn-success/80 backdrop-blur-sm border border-provn-success/20 rounded-xl p-4 text-center shadow-lg"
                >
                  <div className="text-2xl font-bold text-white font-headline">100%</div>
                  <div className="text-xs text-white/80">Earnings Kept</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ ...normalTransition, delay: 0.4 }}
                  viewport={optimizedViewport}
                  className="absolute -bottom-4 -left-4 bg-gradient-to-br from-provn-accent/90 to-provn-accent/80 backdrop-blur-sm border border-provn-accent/20 rounded-xl p-4 text-center shadow-lg"
                >
                  <div className="text-2xl font-bold text-white font-headline">0%</div>
                  <div className="text-xs text-white/80">Platform Fees</div>
                </motion.div>
              </div>

              {/* Bottom action area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ ...normalTransition, delay: 0.5 }}
                viewport={optimizedViewport}
                className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full px-4 sm:px-0"
              >
                <ProvnButton
                  onClick={() => handleProtectedNavigation("/upload")}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg group"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Start Your Journey
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </ProvnButton>
                <ProvnButton
                  variant="secondary"
                  onClick={() => handleProtectedNavigation("/explore")}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg group"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Explore Platform
                </ProvnButton>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* User Journey Section */}
      <UserJourney onGetStarted={() => handleProtectedNavigation("/upload")} />

      {/* Live Platform Metrics */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={optimizedViewport}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6">
            Join the Creator Revolution
          </h2>
          <p className="text-xl text-provn-muted max-w-3xl mx-auto">
            Real-time metrics from creators building passive income empires
          </p>
        </motion.div>
        <LiveMetrics creatorsCount={platformStats.totalCreators} videosCount={platformStats.totalVideos} />
      </section>

      {/* Premium Footer */}
      <footer className="relative py-20 bg-gradient-to-b from-provn-bg to-provn-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={normalTransition}
            viewport={optimizedViewport}
            className="text-center space-y-12"
          >
            {/* Dominant Logo */}
            <div className="flex items-center justify-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-provn-accent via-provn-accent to-provn-accent/70 rounded-2xl flex items-center justify-center shadow-2xl shadow-provn-accent/30">
                  <div className="w-8 h-8 bg-provn-bg rounded-xl transform rotate-12"></div>
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-provn-accent/30 rounded-2xl blur-xl"></div>
              </div>
              <div className="font-headline font-bold">
                <span className="text-4xl md:text-5xl text-provn-text">Prov</span>
                <span className="text-4xl md:text-5xl text-provn-accent">n</span>
              </div>
            </div>

            {/* Bold Statement */}
            <div className="space-y-4">
              <h3 className="font-headline text-2xl md:text-3xl font-bold text-provn-text leading-tight">
                The future of content creation
              </h3>
              <p className="text-lg text-provn-muted max-w-2xl mx-auto">
                Protected videos. Automated licensing. Built for creators who own their empire.
              </p>
            </div>

            {/* Elegant Attribution */}
            <div className="pt-8 border-t border-provn-border/20 space-y-4">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 text-provn-muted">
                <div className="text-sm">
                  © 2024 Provn — All rights reserved
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Crafted for</span>
                  <a 
                    href="https://x.com/campnetworkxyz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-provn-accent font-semibold hover:text-provn-accent/80 transition-colors cursor-pointer"
                  >
                    Camp Network
                  </a>
                  <span>by</span>
                  <a 
                    href="https://x.com/divyanshueth" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-provn-accent font-semibold hover:text-provn-accent/80 transition-colors cursor-pointer"
                  >
                    Divyanshu Urmaliya
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* Create Profile Modal */}
      <CreateProfileModal 
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onSuccess={(handle) => {
          setHasProfile(true)
          setShowCreateProfile(false)
          console.log('✅ Profile created successfully:', handle)
        }}
      />
    </div>
  )
}