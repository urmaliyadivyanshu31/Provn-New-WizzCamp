"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { FullyProtectedRoute } from "@/components/guards/ProtectedRoute"
import { useAuth } from '@campnetwork/origin/react'
import { AchievementsPanel } from "@/components/gamification/AchievementsPanel"
import { PremiumLeaderboard } from "@/components/leaderboard/PremiumLeaderboard"
import { LicenseManager } from "@/components/licenses/LicenseManager"
import { Trophy, Award, Package } from "lucide-react"


export default function DashboardPage() {
  const { walletAddress } = useAuth()
  const [activeTab, setActiveTab] = useState<'leaderboards' | 'achievements' | 'licenses'>('leaderboards')

  const tabs = [
    { id: 'leaderboards', name: 'Leaderboards', icon: Trophy },
    { id: 'achievements', name: 'Achievements', icon: Award },
    { id: 'licenses', name: 'My Licenses', icon: Package }
  ]

  return (
    <FullyProtectedRoute
      authMessage="Connect your wallet to view leaderboards and unlock achievements."
      profileMessage="Create your profile to compete for top positions and unlock achievements."
      >
        <div className="min-h-screen bg-provn-bg">
          <Navigation currentPage="dashboard" />
          
          <div className="pt-20 pb-8 px-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold font-headline text-provn-text mb-2">
                  Creator Dashboard
                </h1>
                <p className="text-provn-muted">
                  Track your progress, compete with other creators, and unlock achievements
                </p>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-provn-border mb-8">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                          activeTab === tab.id
                            ? 'border-provn-accent text-provn-accent'
                            : 'border-transparent text-provn-muted hover:text-provn-text hover:border-provn-border'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-[600px]">
                {activeTab === 'leaderboards' && (
                  <PremiumLeaderboard userAddress={walletAddress || undefined} />
                )}
                
                {activeTab === 'achievements' && (
                  <AchievementsPanel userAddress={walletAddress || undefined} />
                )}
                
                {activeTab === 'licenses' && (
                  <LicenseManager userAddress={walletAddress || undefined} />
                )}
                
              </div>
            </div>
          </div>
        </div>
      </FullyProtectedRoute>
    )
  }