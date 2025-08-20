"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Copy, Star, Sparkles, Crown, Award } from 'lucide-react'
import { ProvnBadge } from '@/components/provn/badge'
import { toast } from 'sonner'
import { Profile } from '@/lib/supabase'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

interface ProfileCardProps {
  profile: Profile
  className?: string
  showDownloadButton?: boolean
}

export function ProfileCard({ profile, className = "" }: ProfileCardProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Profile Card */}
      <div 
        id="profile-card" 
        className="relative w-[340px] h-[440px] bg-gradient-to-br from-provn-surface via-provn-surface to-provn-surface/80 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-500 ease-out hover:shadow-provn-accent/20"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 0 0 1px rgba(255, 109, 1, 0.2),
            0 4px 20px rgba(0, 0, 0, 0.4),
            0 8px 32px rgba(255, 109, 1, 0.08),
            0 0 60px rgba(255, 109, 1, 0.05)
          `
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-provn-accent/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-provn-accent/5 to-transparent rounded-full blur-2xl"></div>
        </div>

        {/* Card Content */}
        <div className="relative h-full p-6 flex flex-col">
          {/* Header with Large Profile Picture */}
          <div className="flex flex-col items-center text-center space-y-4 mb-6">
            {/* Large Profile Picture */}
            <div className="relative w-32 h-32">
              {profile.avatar_url ? (
                <OptimizedImage
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.handle}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-3xl object-cover border-2 border-provn-accent/30 shadow-2xl"
                  loading="eager"
                />
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-provn-accent to-provn-accent/80 flex items-center justify-center border-2 border-provn-accent/30 shadow-2xl">
                  <span className="text-4xl font-headline font-bold text-provn-bg">
                    {(profile.display_name || profile.handle).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Online status */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-provn-surface flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Name and Handle */}
            <div className="space-y-1">
              <h1 className="font-headline text-xl font-bold text-provn-text">
                {profile.display_name || profile.handle}
              </h1>
              {profile.display_name && (
                <p className="font-headline text-provn-muted text-sm">@{profile.handle}</p>
              )}
            </div>
          </div>

          {/* Industry-Standard Achievement System */}
          <div className="flex justify-center gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <div className="relative overflow-hidden">
                <div className="px-4 py-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-200 text-xs font-headline font-medium tracking-wider uppercase">Rising Star</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <div className="relative overflow-hidden">
                <div className="px-4 py-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-200 text-xs font-headline font-medium tracking-wider uppercase">Creator</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </motion.div>
          </div>



          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Wallet Address */}
          <div className="mb-6">
            <div 
              className="flex items-center justify-center gap-2 px-3 py-2 bg-provn-surface-2 rounded-xl border border-provn-border/50 cursor-pointer hover:bg-provn-border/30 transition-colors group"
              onClick={() => copyToClipboard(profile.wallet_address, 'Wallet address')}
            >
              <span className="font-headline text-provn-muted text-xs">
                {truncateAddress(profile.wallet_address)}
              </span>
              <Copy className="w-3 h-3 text-provn-muted group-hover:text-provn-accent transition-colors" />
            </div>
          </div>

          {/* Member Since */}
          <div className="text-center mb-4">
            <p className="font-headline text-provn-muted text-xs">
              Member since {formatDate(profile.created_at)}
            </p>
          </div>

          {/* Bottom Section with Provn Logo */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              {/* Provn Logo */}
              <div className="relative">
                <div className="w-6 h-6 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-provn-bg rounded-sm transform rotate-12"></div>
                </div>
              </div>
              
              <div className="font-headline font-bold text-sm">
                <span className="text-provn-text">Prov</span>
                <span className="text-provn-accent">n</span>
              </div>
            </div>

            {/* QR-like pattern decoration */}
            <div className="grid grid-cols-3 gap-0.5 opacity-30">
              {Array.from({ length: 9 }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-1 h-1 rounded-sm ${
                    [0, 2, 4, 5, 7, 8].includes(i) ? 'bg-provn-accent' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Subtle Premium Border */}
        <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
      </div>
    </div>
  )
}