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
  Wallet
} from "lucide-react"



// Platform Metrics Component  
const LiveMetrics = ({ creatorsCount, videosCount }: { creatorsCount: number | null, videosCount: number | null }) => {
  const metrics = [
    { label: "Active Creators", value: creatorsCount === null ? "13" : creatorsCount.toString(), icon: Users, loading: creatorsCount === null },
    { label: "Creator Ownership", value: "100%", icon: CheckCircle, loading: false },
    { label: "PROVN Protected", value: videosCount === null ? "10" : videosCount.toString(), icon: CheckCircle, loading: videosCount === null },
    { label: "Zero Platform Fees", value: "0%", icon: DollarSign, loading: false }
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
              {metric.loading ? (
                <span className="inline-block animate-pulse bg-provn-accent/20 text-transparent rounded">{metric.value}</span>
              ) : (
                metric.value
              )}
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

export default function HomePage() {
  const { scrollYProgress } = useScroll()
  // Optimize scroll-based transforms to reduce repaints
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true, margin: "0px 0px -100px 0px" })
  
  
  // Real platform data with loading state
  const [platformData, setPlatformData] = useState<{
    creatorsCount: number | null;
    videosCount: number | null;
    loading: boolean;
  }>({
    creatorsCount: null, // Start with null to indicate loading
    videosCount: null,   // Start with null to indicate loading
    loading: true
  })
  
  // Add authentication state
  const [isConnected, setIsConnected] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  
  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check if wallet cookie exists (means user is connected and whitelisted)
      const walletCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('wallet_address='))
      
      if (walletCookie) {
        const walletAddress = walletCookie.split('=')[1]
        setIsConnected(true)
        console.log('✅ User is connected and whitelisted:', walletAddress)
        
        // Check if user has profile
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
      // Redirect to whitelist for authentication
      window.location.href = '/whitelist'
    } else if (!hasProfile) {
      // Show profile creation modal
      setShowCreateProfile(true)
    } else {
      // User is fully authenticated with profile
      window.location.href = href
    }
  }

  // Fetch real platform data
  useEffect(() => {
    const fetchPlatformData = async () => {
      try {
        console.log('🔄 Fetching platform data...')
        
        const [creatorsResponse] = await Promise.all([
          fetch('/api/leaderboard?limit=1000') // Get all creators with their video counts
        ])
        
        // Handle creators data
        if (creatorsResponse.ok) {
          const creatorsData = await creatorsResponse.json()
          if (creatorsData.success && creatorsData.data?.stats?.total_creators) {
            console.log('✅ Creators count:', creatorsData.data.stats.total_creators)
            setPlatformData(prev => ({
              ...prev,
              creatorsCount: creatorsData.data.stats.total_creators
            }))
            
            // Calculate total videos created by these creators
            const totalVideosCreated = creatorsData.data?.leaderboard?.reduce((total: number, creator: any) => {
              return total + (creator.videos_count || 0)
            }, 0) || 0
            
            console.log('✅ Videos created by creators:', totalVideosCreated)
            setPlatformData(prev => ({
              ...prev,
              videosCount: totalVideosCreated
            }))
          } else {
            console.warn('❌ Invalid creators data:', creatorsData)
            console.log('Raw creators response:', creatorsData)
          }
        } else {
          console.error('❌ Creators API failed:', creatorsResponse.status)
        }
        
      } catch (error) {
        console.error('❌ Failed to fetch platform data:', error)
        // Set fallback values for when API fails
        setPlatformData(prev => ({
          ...prev,
          creatorsCount: prev.creatorsCount || 13, // Use known count as fallback
          videosCount: prev.videosCount || 10 // Use known count as fallback
        }))
      } finally {
        setPlatformData(prev => ({ ...prev, loading: false }))
      }
    }
    
    fetchPlatformData()
  }, [])

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
          {/* Hero Message - Full Width */}
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
                    Connected & Whitelisted
                  </ProvnBadge>
                ) : (
                  <ProvnBadge className="bg-provn-success/10 text-provn-success border-provn-success/20 mb-6">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Zero Platform Fees
                  </ProvnBadge>
                )}
              </motion.div>
              
              <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-provn-text leading-tight">
                Keep{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/80">
                  100%
                </span>{" "}
                of Your Earnings
              </h1>
              
              <p className="text-xl font-headline md:text-2xl text-provn-muted leading-relaxed max-w-3xl mx-auto">
                Join <strong className="text-provn-text">
                  {platformData.loading || platformData.creatorsCount === null ? (
                    <span className="inline-block animate-pulse bg-provn-accent/20 text-transparent rounded">13+</span>
                  ) : (
                    `${platformData.creatorsCount}+`
                  )} Elite Creators
                </strong> who've escaped platform fees and built true content ownership on Provn.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isConnected ? (
                <>
                  <ProvnButton
                    size="lg"
                    onClick={() => handleProtectedNavigation("/upload")}
                    className="px-12 py-4 text-xl font-semibold group"
                  >
                    <Upload className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                    {hasProfile ? "Upload Content" : "Complete Setup & Upload"}
                    <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                  </ProvnButton>
                  <ProvnButton
                    variant="secondary"
                    size="lg"
                    onClick={() => handleProtectedNavigation("/explore")}
                    className="px-12 py-4 text-xl group"
                  >
                    <Play className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                    Explore Platform
                  </ProvnButton>
                </>
              ) : (
                <>
                  <ProvnButton
                    size="lg"
                    onClick={() => handleProtectedNavigation("/whitelist")}
                    className="px-12 py-4 text-xl font-semibold group"
                  >
                    <Wallet className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                    Connect Wallet to Start
                    <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                  </ProvnButton>
                  <ProvnButton
                    variant="secondary"
                    size="lg"
                    onClick={() => handleProtectedNavigation("/dashboard")}
                    className="px-12 py-4 text-xl group"
                  >
                    <Play className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                    See Success Stories
                  </ProvnButton>
                </>
              )}
            </div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ ...normalTransition, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-12 pt-12 border-t border-provn-border/30"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-text font-headline">
                  {platformData.loading || platformData.creatorsCount === null ? (
                    <span className="inline-block animate-pulse bg-provn-accent/20 text-transparent rounded">13+</span>
                  ) : (
                    `${platformData.creatorsCount}+`
                  )}
                </div>
                <div className="text-sm text-provn-muted mt-1">Active Creators</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-accent font-headline">0%</div>
                <div className="text-sm text-provn-muted mt-1">Platform Fees</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-text font-headline">
                  {platformData.loading || platformData.videosCount === null ? (
                    <span className="inline-block animate-pulse bg-provn-accent/20 text-transparent rounded">10+</span>
                  ) : (
                    `${platformData.videosCount}+`
                  )}
                </div>
                <div className="text-sm text-provn-muted mt-1">Provs Protected</div>
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

                  {/* Alternative: Thumbnail GIF (uncomment to use instead of iframe) */}
                  {/* 
                  <div className="relative group cursor-pointer" onClick={() => window.open('https://www.loom.com/share/e228fc775d8645e2a4bb68922dea8104', '_blank')}>
                    <img 
                      src="https://cdn.loom.com/sessions/thumbnails/e228fc775d8645e2a4bb68922dea8104-d62552280dee495c-full-play.gif"
                      alt="Exploring the Provn Platform: A New Era for Content Creators - Watch Video"
                      className="w-full rounded-2xl transition-all duration-300 group-hover:scale-105"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-provn-accent/90 rounded-full p-4">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  */}
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
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <ProvnButton
                  onClick={() => handleProtectedNavigation("/upload")}
                  className="px-8 py-3 text-lg group"
                >
                  <Upload className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </ProvnButton>
                <ProvnButton
                  variant="secondary"
                  onClick={() => handleProtectedNavigation("/explore")}
                  className="px-8 py-3 text-lg group"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Explore Platform
                </ProvnButton>
              </motion.div>
            </div>
          </motion.div>

          {/* Features highlight */}
        </div>
      </section>

      {/* Revenue Revolution */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-provn-surface/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={normalTransition}
            viewport={optimizedViewport}
            className="text-center mb-20"
          >
            <h2 className="font-headline text-5xl md:text-7xl font-bold text-provn-text mb-8 leading-tight">
              The{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600">
                $450
              </span>{" "}
              Problem
            </h2>
            <p className="text-xl font-headline md:text-2xl text-provn-muted max-w-3xl mx-auto leading-relaxed">
              Every month, creators lose <strong className="text-red-400">billions</strong> to platform fees. 
              We're changing that forever.
            </p>
          </motion.div>

          {/* Interactive Revenue Visualization */}
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={optimizedViewport}
              className="relative bg-gradient-to-br from-provn-surface/80 to-provn-surface/40 backdrop-blur-2xl border border-provn-border/30 rounded-3xl p-12 shadow-2xl"
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-baseline gap-2 mb-4">
                  <span className="text-6xl md:text-8xl font-bold text-provn-text font-headline">$1,000</span>
                  <span className="text-xl text-provn-muted">/month</span>
                </div>
                <div className="text-provn-muted">Your content generates</div>
              </div>

              {/* Revenue Split Visualization */}
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left: The Loss */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ ...normalTransition, delay: 0.2 }}
                  viewport={optimizedViewport}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-red-400 mb-6">Traditional Platforms</h3>
                  </div>
                  
                  {/* Platform Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-red-400" viewBox="0 0 16 16">
                            <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"/>
                          </svg>
                        </div>
                        <span className="text-red-400 font-medium">YouTube</span>
                      </div>
                      <div className="text-right">
                        <div className="text-red-400 font-bold">45% fee</div>
                        <div className="text-xs text-red-400/70">-$450</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-purple-400" viewBox="0 0 16 16">
                            <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                          </svg>
                        </div>
                        <span className="text-purple-400 font-medium">TikTok</span>
                      </div>
                      <div className="text-right">
                        <div className="text-purple-400 font-bold">50% fee</div>
                        <div className="text-xs text-purple-400/70">-$500</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center pt-6 border-t border-red-500/20">
                    <div className="text-4xl font-bold text-red-400 mb-2">~$500</div>
                    <div className="text-red-400/80">What you actually keep</div>
                  </div>
                </motion.div>

                {/* Right: The Solution */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ ...normalTransition, delay: 0.3 }}
                  viewport={optimizedViewport}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-provn-accent/20 to-provn-success/20 rounded-2xl blur-2xl"></div>
                  <div className="relative bg-gradient-to-br from-provn-surface to-provn-surface-2 border-2 border-provn-accent/50 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-xl flex items-center justify-center shadow-lg">
                          <div className="w-6 h-6 bg-provn-bg rounded-lg transform rotate-12"></div>
                        </div>
                        <h3 className="text-3xl font-bold text-provn-accent">Provn</h3>
                      </div>
                      <div className="text-provn-success font-semibold">Zero Platform Fees</div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-provn-muted">Platform Fee</span>
                        <span className="text-provn-success font-bold text-xl">$0</span>
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-provn-accent/30 to-transparent"></div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-provn-text font-semibold">You Keep</span>
                        <span className="text-provn-accent font-bold text-4xl">$1,000</span>
                      </div>
                      
                      <div className="bg-gradient-to-r from-provn-success/20 to-provn-success/10 border border-provn-success/30 rounded-xl p-4 text-center">
                        <div className="text-provn-success font-bold text-lg">+$500 more per month</div>
                        <div className="text-xs text-provn-muted">vs traditional platforms</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
          
        </div>
      </section>

      {/* User Journey Section */}
      <UserJourney onGetStarted={() => handleProtectedNavigation("/upload")} />

      {/* Platform Comparison */}
      <section className="py-24 bg-provn-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={normalTransition}
            viewport={optimizedViewport}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6">
              Stop Losing Money to Platform Fees
            </h2>
            <p className="text-xl text-provn-muted max-w-3xl mx-auto">
              See exactly how much more you could be earning
            </p>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={optimizedViewport}
            className="bg-provn-surface border border-provn-border rounded-2xl overflow-hidden max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-4 bg-provn-surface-2 p-4">
              <div className="font-headline font-bold text-provn-text">Platform</div>
              <div className="font-headline font-bold text-provn-text text-center">Platform Cut</div>
              <div className="font-headline font-bold text-provn-text text-center">Creator Gets</div>
              <div className="font-headline font-bold text-provn-text text-center">$1000 Revenue</div>
            </div>
            
            {[
              { platform: "YouTube", cut: "45%", creator: "55%", amount: "$550", color: "red" },
              { platform: "TikTok", cut: "50%", creator: "50%", amount: "$500", color: "purple" },
              { platform: "Instagram", cut: "35%", creator: "65%", amount: "$650", color: "pink" },
              { platform: "Provn", cut: "0%", creator: "100%", amount: "$1000", color: "accent", highlight: true }
            ].map((row) => (
              <div key={row.platform} className={`grid grid-cols-4 p-4 border-t border-provn-border ${row.highlight ? 'bg-provn-accent/5' : ''}`}>
                <div className={`font-semibold ${row.highlight ? 'text-provn-accent' : 'text-provn-text'}`}>
                  {row.platform}
                </div>
                <div className={`text-center ${row.color === 'accent' ? 'text-provn-success font-bold' : 'text-red-400'}`}>
                  {row.cut}
                </div>
                <div className={`text-center ${row.color === 'accent' ? 'text-provn-success font-bold' : 'text-provn-muted'}`}>
                  {row.creator}
                </div>
                <div className={`text-center font-bold ${row.color === 'accent' ? 'text-provn-accent text-lg' : 'text-provn-text'}`}>
                  {row.amount}
                </div>
              </div>
            ))}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...fastTransition, delay: 0.3 }}
            viewport={optimizedViewport}
            className="text-center mt-8"
          >
            <div className="text-2xl font-bold text-provn-success mb-2">
              Keep up to 82% more of your revenue on Provn
            </div>
            <p className="text-provn-muted">Based on $1000 monthly revenue comparison</p>
          </motion.div>
        </div>
      </section>

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
            Real-time metrics from creators building financial independence
          </p>
        </motion.div>

        <LiveMetrics creatorsCount={platformData.creatorsCount} videosCount={platformData.videosCount} />
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center bg-gradient-to-r from-provn-accent/5 via-provn-accent/10 to-provn-accent/5">
        <div className="max-w-4xl mx-auto space-y-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={normalTransition}
            viewport={optimizedViewport}
          >
            <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6">
              Ready to Keep 100% of Your Earnings?
            </h2>
            <p className="text-xl text-provn-muted mb-8 max-w-2xl mx-auto">
              Join thousands of creators who've taken control of their content and are earning more than ever before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ProvnButton
                size="lg"
                onClick={() => handleProtectedNavigation("/upload")}
                className="px-12 py-4 text-xl font-semibold group"
              >
                <Upload className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                Start Earning More Today
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </ProvnButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={optimizedViewport}
            className="flex flex-wrap justify-center gap-4 pt-8"
          >
            <ProvnBadge variant="success" className="text-sm px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-1" />
              Zero Setup Fees
            </ProvnBadge>
            <ProvnBadge variant="success" className="text-sm px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-1" />
              Instant Uploads
            </ProvnBadge>
            <ProvnBadge variant="success" className="text-sm px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-1" />
              Lifetime Ownership
            </ProvnBadge>
          </motion.div>
        </div>
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
                The future of creator economics
              </h3>
              <p className="text-lg text-provn-muted max-w-2xl mx-auto">
                Zero fees. True ownership. Built for creators who demand more.
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

      {/* Profile Creation Modal */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onSuccess={(handle) => {
          setShowCreateProfile(false)
          setHasProfile(true)
          console.log('✅ Profile created successfully:', handle)
          // Optionally redirect to explore or stay on landing with updated state
        }}
      />

    </div>
  )
}