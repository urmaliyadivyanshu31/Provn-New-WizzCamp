"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  User, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Video,
  Trophy,
  Heart
} from 'lucide-react'
import { ProvnButton } from '@/components/provn/button'
import { ProvnCard, ProvnCardContent } from '@/components/provn/card'
import { CreateProfileModal } from '@/components/provn/create-profile-modal'
import { useProfile } from '@/hooks/useProfile'
import { CampModal, useModal } from '@campnetwork/origin/react'
import { ProvnBrandLoader } from '@/components/common/LoadingStates'

interface OnboardingFlowProps {
  onComplete: () => void
  showSteps?: boolean
}

export function OnboardingFlow({ onComplete, showSteps = true }: OnboardingFlowProps) {
  const { isAuthenticated, walletAddress } = useAuth()
  const { profile, loading } = useProfile(walletAddress || undefined)
  const { openModal } = useModal()
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Update current step based on auth and profile state
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentStep(1)
    } else if (isAuthenticated && !profile && !loading) {
      setCurrentStep(2)
    } else if (isAuthenticated && profile) {
      onComplete()
    }
  }, [isAuthenticated, profile, loading, onComplete])

  const steps = [
    {
      number: 1,
      title: "Connect Wallet",
      description: "Link your Web3 wallet to get started",
      completed: isAuthenticated,
      icon: Wallet,
      action: () => openModal()
    },
    {
      number: 2,
      title: "Create Profile",
      description: "Set up your creator profile and start building",
      completed: !!profile,
      icon: User,
      action: () => setShowCreateProfile(true)
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-provn-bg flex items-center justify-center">
        <ProvnBrandLoader size="lg" message="Setting up your experience..." variant="brand" />
      </div>
    )
  }

  return (
    <>
      {/* Modal Overlay - Fixed positioning */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Minimal Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-headline text-3xl font-bold text-provn-text mb-2">
              Get Started
            </h1>
            <p className="text-provn-muted">
              Complete these steps to access all features
            </p>
          </motion.div>

          {/* Steps Progress */}
          {showSteps && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto mb-16"
            >
              <div className="flex items-center justify-center space-x-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    {/* Step circle */}
                    <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all ${
                      step.completed 
                        ? 'bg-provn-accent border-provn-accent' 
                        : currentStep === step.number 
                          ? 'border-provn-accent bg-provn-accent/10' 
                          : 'border-provn-border bg-provn-surface'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-8 h-8 text-provn-bg" />
                      ) : (
                        <step.icon className={`w-8 h-8 ${
                          currentStep === step.number ? 'text-provn-accent' : 'text-provn-muted'
                        }`} />
                      )}
                      
                      {/* Step number badge */}
                      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : currentStep === step.number 
                            ? 'bg-provn-accent text-provn-bg' 
                            : 'bg-provn-muted text-provn-bg'
                      }`}>
                        {step.number}
                      </div>
                    </div>

                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className={`w-24 h-0.5 mx-4 ${
                        steps[index + 1].completed || currentStep > step.number 
                          ? 'bg-provn-accent' 
                          : 'bg-provn-border'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step labels */}
              <div className="flex justify-center space-x-32 mt-4">
                {steps.map((step) => (
                  <div key={step.number} className="text-center">
                    <div className={`font-medium ${
                      step.completed ? 'text-green-500' : 
                      currentStep === step.number ? 'text-provn-accent' : 'text-provn-muted'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-sm text-provn-muted mt-1">
                      {step.description}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Current Step Content - Minimal and Clean */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-sm mx-auto"
              >
                <ProvnCard>
                  <ProvnCardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-xl flex items-center justify-center mx-auto">
                      <Wallet className="w-6 h-6 text-provn-bg" />
                    </div>

                    <h2 className="font-headline text-xl font-bold text-provn-text">
                      Connect Wallet
                    </h2>

                    <ProvnButton
                      onClick={openModal}
                      className="w-full font-semibold"
                    >
                      Connect Wallet
                    </ProvnButton>
                  </ProvnCardContent>
                </ProvnCard>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-sm mx-auto"
              >
                <ProvnCard>
                  <ProvnCardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-xl flex items-center justify-center mx-auto">
                      <User className="w-6 h-6 text-provn-bg" />
                    </div>

                    <h2 className="font-headline text-xl font-bold text-provn-text">
                      Create Profile
                    </h2>

                    <ProvnButton
                      onClick={() => setShowCreateProfile(true)}
                      className="w-full font-semibold"
                    >
                      Create Profile
                    </ProvnButton>
                  </ProvnCardContent>
                </ProvnCard>
              </motion.div>
            )}
          </AnimatePresence>

          </div>
        </div>

      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onSuccess={(handle) => {
          setShowCreateProfile(false)
          // The useEffect will detect the new profile and call onComplete
        }}
      />

      {/* Hidden CampModal for wallet connection */}
      <div className="hidden">
        <CampModal />
      </div>
    </>
  )
}