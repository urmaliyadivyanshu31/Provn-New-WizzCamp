"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { 
  Eye, 
  Wallet, 
  Upload, 
  Coins, 
  Rocket, 
  Lock,
  ArrowRight,
  Play
} from 'lucide-react'
import { ProvnButton } from '@/components/provn/button'
import { ProvnBadge } from '@/components/provn/badge'
import { fastTransition, normalTransition, optimizedViewport } from '@/lib/utils/animation-config'

// Journey steps with distinct, meaningful icons
const journeySteps = [
  {
    id: 1,
    title: "Discover",
    description: "Realize you're losing 50% to platform fees",
    icon: Eye,
    stat: "50%",
    statLabel: "Revenue Lost",
    color: "text-red-400"
  },
  {
    id: 2,
    title: "Connect", 
    description: "30-second wallet setup, instant profile",
    icon: Wallet,
    stat: "30s",
    statLabel: "Setup Time",
    color: "text-blue-400"
  },
  {
    id: 3,
    title: "Create",
    description: "Upload & mint content as IP-NFTs instantly",
    icon: Upload,
    stat: "100%",
    statLabel: "IP Protection",
    color: "text-purple-400"
  },
  {
    id: 4,
    title: "Earn",
    description: "Keep everything you make from day one",
    icon: Coins,
    stat: "0%",
    statLabel: "Platform Fees",
    color: "text-provn-success"
  },
  {
    id: 5,
    title: "Scale",
    description: "Build authentic community, no algorithms",
    icon: Rocket,
    stat: "∞",
    statLabel: "Growth Potential", 
    color: "text-green-400"
  },
  {
    id: 6,
    title: "Own",
    description: "License, monetize, control forever",
    icon: Lock,
    stat: "100%",
    statLabel: "Ownership",
    color: "text-provn-accent"
  }
]

interface UserJourneyProps {
  onGetStarted?: () => void
}

export function UserJourney({ onGetStarted }: UserJourneyProps) {
  const [activeStep, setActiveStep] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "0px 0px -100px 0px" })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  const activeStepData = journeySteps.find(step => step.id === activeStep)

  return (
    <section className="py-32 relative overflow-hidden" ref={containerRef}>
      {/* Background matching your existing sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-provn-surface/5 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header - matching your typography pattern */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={normalTransition}
          viewport={optimizedViewport}
          className="text-center mb-20"
        >

          
          <h2 className="font-headline text-5xl md:text-7xl font-bold text-provn-text mb-8 leading-tight">
            From{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600">
              Platform Fees
            </span>{" "}
            to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/80">
              True Freedom
            </span>
          </h2>
          <p className="text-xl font-headline md:text-2xl text-provn-muted max-w-3xl mx-auto leading-relaxed">
            The 6-step journey thousands of creators have taken to financial independence
          </p>
        </motion.div>

        {/* Steps Grid - matching your feature card pattern */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={optimizedViewport}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {journeySteps.map((step, index) => {
            const Icon = step.icon
            const isActive = activeStep === step.id
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ ...fastTransition, delay: 0.3 + (index * 0.1) }}
                viewport={optimizedViewport}
                className={`group cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'bg-provn-surface border-2 border-provn-accent/50' 
                    : 'bg-provn-surface/50 backdrop-blur-sm border border-provn-border/30 hover:bg-provn-surface/70'
                } rounded-xl p-6`}
                onClick={() => setActiveStep(step.id)}
                whileHover={{ y: -2 }}
              >
                {/* Step number indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-provn-accent text-provn-bg' : 'bg-provn-surface-2 text-provn-muted'
                  }`}>
                    {step.id}
                  </div>
                  <Icon className={`w-6 h-6 transition-colors duration-300 ${
                    isActive ? 'text-provn-accent' : 'text-provn-muted group-hover:text-provn-text'
                  }`} />
                </div>

                <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                  isActive ? 'text-provn-accent' : 'text-provn-text'
                }`}>
                  {step.title}
                </h3>
                
                <p className="text-sm text-provn-muted mb-4 leading-relaxed">
                  {step.description}
                </p>

                {/* Stat display matching your hero stats */}
                <div className="pt-3 border-t border-provn-border/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-provn-muted">{step.statLabel}</span>
                    <span className={`text-lg font-bold font-headline ${step.color}`}>
                      {step.stat}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>



        {/* CTA Section - matching your button patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.2 }}
          viewport={optimizedViewport}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ProvnButton
              size="lg"
              onClick={onGetStarted}
              className="px-12 py-4 text-xl font-semibold group"
            >
              <Play className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
              Start Your Evolution
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </ProvnButton>
            
            <ProvnButton
              variant="secondary"
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-12 py-4 text-xl group"
            >
              <ArrowRight className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
              Learn More
            </ProvnButton>
          </div>
        </motion.div>
      </div>
    </section>
  )
}