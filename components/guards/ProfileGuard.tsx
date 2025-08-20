"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { motion } from 'framer-motion'
import { User, Sparkles, ArrowRight } from 'lucide-react'
import { ProvnButton } from '@/components/provn/button'
import { ProvnCard, ProvnCardContent } from '@/components/provn/card'
import { CreateProfileModal } from '@/components/provn/create-profile-modal'
import { useProfile } from '@/hooks/useProfile'

interface ProfileGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  message?: string
  title?: string
}

export function ProfileGuard({ 
  children, 
  fallback,
  message = "Create your profile to unlock all features and start building your creator presence on Provn.",
  title = "Profile Required"
}: ProfileGuardProps) {
  const { walletAddress } = useAuth()
  const { profile, loading } = useProfile(walletAddress || undefined)
  const [showCreateProfile, setShowCreateProfile] = useState(false)

  // If still loading profile, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-provn-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-provn-accent mx-auto"></div>
          <p className="text-provn-muted">Loading profile...</p>
        </div>
      </div>
    )
  }

  // If profile exists, render children
  if (profile) {
    return <>{children}</>
  }

  // If custom fallback is provided
  if (fallback) {
    return <>{fallback}</>
  }

  // Show profile creation modal directly
  return (
    <CreateProfileModal
      isOpen={true}
      onClose={() => {}} // Cannot close without creating profile
      onSuccess={(handle) => {
        // Profile will be refetched automatically by the useProfile hook
        // No need to manually redirect - the guard will re-render with profile
      }}
    />
  )
}