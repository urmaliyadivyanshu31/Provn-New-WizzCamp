"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { motion } from 'framer-motion'
import { User, Sparkles, ArrowRight } from 'lucide-react'
import { ProvnButton } from '@/components/provn/button'
import { ProvnCard, ProvnCardContent } from '@/components/provn/card'
import { CreateProfileModal } from '@/components/provn/create-profile-modal'
import { useProfile } from '@/hooks/useProfile'
import { ProvnBrandLoader } from '@/components/common/LoadingStates'

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
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  
  // DEMO DAY: Demo wallet functionality
  const [demoWallet, setDemoWallet] = useState<string | undefined>();
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL for demo wallet parameter
      const urlParams = new URLSearchParams(window.location.search);
      const demoWalletParam = urlParams.get('demo_wallet');
      if (demoWalletParam && demoWalletParam.match(/^0x[a-fA-F0-9]{40}$/)) {
        setDemoWallet(demoWalletParam);
        setIsDemoMode(true);
        // Store in localStorage for persistence
        localStorage.setItem('demo_wallet_address', demoWalletParam);
        console.log("👤 DEMO: ProfileGuard demo wallet from URL:", demoWalletParam);
        return;
      }
      
      // Check cookie for demo wallet (set by middleware)
      const cookies = document.cookie.split(';');
      const demoWalletCookie = cookies.find(cookie => cookie.trim().startsWith('demo_wallet_address='));
      if (demoWalletCookie) {
        const cookieValue = demoWalletCookie.split('=')[1];
        if (cookieValue && cookieValue.match(/^0x[a-fA-F0-9]{40}$/)) {
          setDemoWallet(cookieValue);
          setIsDemoMode(true);
          // Store in localStorage for persistence
          localStorage.setItem('demo_wallet_address', cookieValue);
          console.log("👤 DEMO: ProfileGuard demo wallet from cookie:", cookieValue);
          return;
        }
      }
      
      // Check localStorage for demo wallet
      const storedDemoWallet = localStorage.getItem('demo_wallet_address');
      if (storedDemoWallet && storedDemoWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
        setDemoWallet(storedDemoWallet);
        setIsDemoMode(true);
        console.log("👤 DEMO: ProfileGuard demo wallet from storage:", storedDemoWallet);
      }
    }
  }, []);
  
  // Use demo wallet in demo mode, otherwise use real wallet
  const currentWallet = isDemoMode ? demoWallet : walletAddress;
  const { profile, loading } = useProfile(currentWallet || undefined)

  // If still loading profile, show premium loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-provn-bg">
        <ProvnBrandLoader size="lg" message="Loading profile" variant="brand" minDisplayTime={600} />
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