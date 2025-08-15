import React, { useEffect, useState } from "react"
import Sidebar from "../grants/sidebar"
import TopNav from "../grants/top-nav"
import Hyperspeed from '@/components/ui/hyperspeed';
import ProfileCard from './profile-card'
import { useUserProfile } from "@/hooks/useUserProfile"


function Layout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className={`flex h-screen`}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 dark:border-[#1F1F23] flex-shrink-0">
          <TopNav />
        </header>
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#0F0F12]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function Journey() {
  const { profile, getDisplayName } = useUserProfile()
  const [showHyperspeed, setShowHyperspeed] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [showProfileCard, setShowProfileCard] = useState(false)

  useEffect(() => {
    console.log('Journey component mounted')
    
    // Start the animation immediately when component mounts
    const timer = setTimeout(() => {
      console.log('Starting hyperspeed animation')
      setIsVisible(true)
    }, 100)

    // Hide after 10 seconds and show ProfileCard
    const hideTimer = setTimeout(() => {
      console.log('Hiding hyperspeed animation')
      setIsVisible(false)
      // Remove from DOM after animation completes and show ProfileCard
      setTimeout(() => {
        setShowHyperspeed(false)
        setShowProfileCard(true)
        console.log('Hyperspeed animation removed, showing ProfileCard')
      }, 500) // Wait for fade out animation
    }, 10100) // 10 seconds + initial delay

    return () => {
      clearTimeout(timer)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <Layout>
      <div className="w-full h-full relative">
        {/* Hyperspeed overlay - slides up from bottom */}
        {showHyperspeed && (
          <div 
            className={`absolute inset-0 z-50 transition-all duration-500 ease-in-out ${
              isVisible 
                ? 'transform translate-y-0 opacity-100' 
                : 'transform translate-y-full opacity-0'
            }`}
          >
            <Hyperspeed
              effectOptions={{
                onSpeedUp: () => { },
                onSlowDown: () => { },
                distortion: 'turbulentDistortion',
                length: 400,
                roadWidth: 10,
                islandWidth: 2,
                lanesPerRoad: 4,
                fov: 90,
                fovSpeedUp: 150,
                speedUp: 2,
                carLightsFade: 0.4,
                totalSideLightSticks: 20,
                lightPairsPerRoadWay: 40,
                shoulderLinesWidthPercentage: 0.05,
                brokenLinesWidthPercentage: 0.1,
                brokenLinesLengthPercentage: 0.5,
                lightStickWidth: [0.12, 0.5],
                lightStickHeight: [1.3, 1.7],
                movingAwaySpeed: [60, 80],
                movingCloserSpeed: [-120, -160],
                carLightsLength: [400 * 0.03, 400 * 0.2],
                carLightsRadius: [0.05, 0.14],
                carWidthPercentage: [0.3, 0.5],
                carShiftX: [-0.8, 0.8],
                carFloorSeparation: [0, 5],
                colors: {
                  roadColor: 0x080808,
                  islandColor: 0x0a0a0a,
                  background: 0x000000,
                  shoulderLines: 0xFFFFFF,
                  brokenLines: 0xFFFFFF,
                  leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
                  rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
                  sticks: 0x03B3C3,
                }
              }}
            />
          </div>
        )}

        {/* ProfileCard appears after hyperspeed animation */}
        {showProfileCard && (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#0F0F12] animate-fade-in">
            <div className="max-w-md">
              <ProfileCard
                name={getDisplayName()}
                title={profile?.bio || "Traveler"}
                handle={profile?.username || "explorer"}
                status="Online"
                contactText="Contact"
                avatarUrl={profile?.avatar || "https://api.dicebear.com/7.x/avatars/svg?seed=user"}
                showUserInfo={true}
                enableTilt={true}
                onContactClick={() => console.log('Contact clicked')}
              />
            </div>
          </div>
        )}

        {/* Default state when nothing is showing */}
        {!showHyperspeed && !showProfileCard && (
          <div className="w-full h-full bg-gray-50 dark:bg-[#0F0F12] flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Your Journey
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Experience the adventure ahead
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}