"use client"
import React, { useRef } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { 
  Upload, 
  Users, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Play
} from "lucide-react"


// Creator Success Story Component
const CreatorStory = ({ 
  name, 
  avatar, 
  platform, 
  oldEarnings, 
  newEarnings, 
  timeframe,
  quote 
}: {
  name: string
  avatar: string  
  platform: string
  oldEarnings: string
  newEarnings: string
  timeframe: string
  quote: string
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-provn-surface border border-provn-border rounded-2xl p-6 h-full"
    >
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-provn-accent rounded-full flex items-center justify-center mr-3">
          <span className="text-provn-bg font-bold text-lg">{avatar}</span>
        </div>
        <div>
          <h4 className="font-semibold text-provn-text">{name}</h4>
          <p className="text-sm text-provn-muted">Former {platform} Creator</p>
        </div>
      </div>
      
      <blockquote className="text-provn-text mb-4 italic">
        "{quote}"
      </blockquote>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-provn-muted">{platform} ({timeframe}):</span>
          <span className="text-red-400">{oldEarnings}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-provn-muted">Provn ({timeframe}):</span>
          <span className="text-provn-success font-bold">{newEarnings}</span>
        </div>
        <div className="pt-2 border-t border-provn-border">
          <div className="text-provn-accent font-bold text-right">
            +{Math.round(((parseFloat(newEarnings.replace('$', '').replace('K', '000')) - parseFloat(oldEarnings.replace('$', '').replace('K', '000'))) / parseFloat(oldEarnings.replace('$', '').replace('K', '000'))) * 100)}% increase
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Platform Metrics Component  
const LiveMetrics = () => {
  const metrics = [
    { label: "Active Creators", value: "2,847", icon: Users },
    { label: "Total Earnings", value: "$2.3M", icon: DollarSign },
    { label: "Videos Protected", value: "47.2K", icon: CheckCircle },
    { label: "Zero Platform Fees", value: "100%", icon: CheckCircle }
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
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
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

export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })

  return (
    <div className="min-h-screen font-headline bg-provn-bg">
      <Navigation currentPage="home" />
      
      {/* Hero Section - Creator Focused */}
      <motion.section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
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
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <ProvnBadge className="bg-provn-success/10 text-provn-success border-provn-success/20 mb-6">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Zero Platform Fees
                </ProvnBadge>
              </motion.div>
              
              <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-provn-text leading-tight">
                Keep{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/80">
                  100%
                </span>{" "}
                of Your Earnings
              </h1>
              
              <p className="text-xl font-headline md:text-2xl text-provn-muted leading-relaxed max-w-3xl mx-auto">
                Join <strong className="text-provn-text">2,847 creators</strong> who've escaped platform fees and built true content ownership on Provn.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ProvnButton
                size="lg"
                onClick={() => (window.location.href = "/upload")}
                className="px-12 py-4 text-xl font-semibold group"
              >
                <Upload className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                Start Earning More
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </ProvnButton>
              <ProvnButton
                variant="secondary"
                size="lg"
                onClick={() => document.getElementById('creator-stories')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-12 py-4 text-xl group"
              >
                <Play className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                See Success Stories
              </ProvnButton>
            </div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-12 pt-12 border-t border-provn-border/30"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-success font-headline">$2.3M+</div>
                <div className="text-sm text-provn-muted mt-1">Earned by Creators</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-accent font-headline">0%</div>
                <div className="text-sm text-provn-muted mt-1">Platform Fees</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-provn-text font-headline">47.2K+</div>
                <div className="text-sm text-provn-muted mt-1">Videos Protected</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Revenue Revolution */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-provn-surface/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
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
              viewport={{ once: true }}
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
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
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
                          <span className="text-red-400 font-bold text-sm">YT</span>
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
                          <span className="text-purple-400 font-bold text-sm">TT</span>
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
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
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

      {/* Creator Success Stories */}
      <section id="creator-stories" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6">
            Real Creators, Real Results
          </h2>
          <p className="text-xl text-provn-muted max-w-3xl mx-auto">
            See how creators are earning 40-80% more by switching to Provn's zero-fee platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CreatorStory
            name="Sarah Chen"
            avatar="SC"
            platform="YouTube"
            oldEarnings="$2.1K"
            newEarnings="$3.8K"
            timeframe="monthly"
            quote="I was losing almost half my revenue to YouTube's cut. Provn let me keep everything and actually grow my audience faster."
          />
          <CreatorStory
            name="Marcus Rivera"
            avatar="MR"
            platform="TikTok"
            oldEarnings="$850"
            newEarnings="$1.5K"
            timeframe="monthly"
            quote="The creator fund was a joke. On Provn, I make real money from day one, and I own my content forever."
          />
          <CreatorStory
            name="Elena Vasquez"
            avatar="EV"
            platform="Instagram"
            oldEarnings="$1.2K"
            newEarnings="$2.3K"
            timeframe="monthly"
            quote="No algorithm games, no shadow bans. Just pure creator economics. Provn gave me my independence back."
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <ProvnButton
            onClick={() => (window.location.href = "/upload")}
            className="px-8 py-3 text-lg"
          >
            Join These Successful Creators
            <ArrowRight className="w-5 h-5 ml-2" />
          </ProvnButton>
        </motion.div>
      </section>

      {/* Platform Comparison */}
      <section className="py-24 bg-provn-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
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
            viewport={{ once: true }}
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
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
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
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6">
            Join the Creator Revolution
          </h2>
          <p className="text-xl text-provn-muted max-w-3xl mx-auto">
            Real-time metrics from creators building financial independence
          </p>
        </motion.div>

        <LiveMetrics />
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center bg-gradient-to-r from-provn-accent/5 via-provn-accent/10 to-provn-accent/5">
        <div className="max-w-4xl mx-auto space-y-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
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
                onClick={() => (window.location.href = "/upload")}
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
            viewport={{ once: true }}
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
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
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
                  <span className="text-provn-accent font-semibold">Camp Network</span>
                  <span>by</span>
                  <span className="text-provn-accent font-semibold">Divyanshu Urmaliya</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}