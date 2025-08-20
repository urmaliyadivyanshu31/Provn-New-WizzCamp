"use client"

import React from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { motion } from 'framer-motion'
import { Wallet, Sparkles } from 'lucide-react'
import { ProvnButton } from '@/components/provn/button'
import { ProvnCard, ProvnCardContent } from '@/components/provn/card'
import { CampModal, useModal } from '@campnetwork/origin/react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  message?: string
  title?: string
}

export function AuthGuard({ 
  children, 
  fallback,
  message = "Connect your wallet to access this feature and start creating amazing content on Provn.",
  title = "Connect Wallet Required"
}: AuthGuardProps) {
  const { isAuthenticated } = useAuth()
  const { openModal } = useModal()

  // Auto-trigger wallet connection modal immediately - hooks must be at top
  React.useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        openModal()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, openModal])

  if (isAuthenticated) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <>
      {/* Minimal backdrop while wallet modal loads */}
      <div className="fixed inset-0 z-40 bg-provn-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-xl flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6 text-provn-bg" />
          </div>
          
          <h2 className="font-headline text-xl font-semibold text-provn-text">
            Connect Wallet
          </h2>
          
          <ProvnButton
            onClick={openModal}
            className="px-6 py-2"
          >
            Connect Wallet
          </ProvnButton>
        </motion.div>
      </div>

      {/* CampModal for wallet connection */}
      <CampModal />
    </>
  )
}