"use client"

import React, { useState, useEffect } from 'react'
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
        console.log("🛡️ DEMO: AuthGuard demo wallet from URL:", demoWalletParam);
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
          console.log("🛡️ DEMO: AuthGuard demo wallet from cookie:", cookieValue);
          return;
        }
      }
      
      // Check localStorage for demo wallet
      const storedDemoWallet = localStorage.getItem('demo_wallet_address');
      if (storedDemoWallet && storedDemoWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
        setDemoWallet(storedDemoWallet);
        setIsDemoMode(true);
        console.log("🛡️ DEMO: AuthGuard demo wallet from storage:", storedDemoWallet);
      }
    }
  }, []);
  
  // Use demo mode or real authentication
  const currentIsAuthenticated = isDemoMode ? !!demoWallet : isAuthenticated;

  // Auto-trigger wallet connection modal immediately - hooks must be at top (but only for real auth, not demo)
  React.useEffect(() => {
    if (!currentIsAuthenticated && !isDemoMode) {
      const timer = setTimeout(() => {
        openModal()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentIsAuthenticated, isDemoMode, openModal])

  if (currentIsAuthenticated) {
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