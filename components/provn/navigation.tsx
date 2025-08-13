"use client"

import { useState } from "react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { ProvnButton } from "./button"

interface NavigationProps {
  currentPage?: "home" | "upload" | "dashboard" | "video" | "provs"
}

export function Navigation({ currentPage = "home" }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address,
  })

  // Show onboarding for first-time users when wallet connects
  const handleWalletConnect = () => {
    const isFirstTime = !localStorage.getItem("provn_onboarded")
    if (isFirstTime && isConnected) {
      setShowOnboarding(true)
    }
  }

  const showToast = (message: string, type: "success" | "warning" | "error") => {
    try {
      const toast = document.createElement("div")
      toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 transition-opacity ${
        type === "success" ? "bg-green-600" : type === "warning" ? "bg-yellow-600" : "bg-red-600"
      }`
      toast.textContent = message
      document.body.appendChild(toast)

      const cleanup = () => {
        try {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        } catch (e) {
          console.warn("Toast cleanup failed:", e)
        }
      }

      setTimeout(cleanup, 5000)
    } catch (error) {
      console.error("Toast display failed:", error)
    }
  }

  const completeOnboarding = () => {
    localStorage.setItem("provn_onboarded", "true")
    setShowOnboarding(false)
    showToast("Uploads are registered on‑chain as IpNFTs. Remix license = 10 wCAMP. Tips go 100% to creator", "success")
  }


  return (
    <>
      <nav className="border-b border-provn-border bg-provn-bg" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a
                href="/"
                className="font-headline text-xl font-bold text-provn-text hover:text-provn-accent transition-colors focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg rounded-sm"
                aria-label="Provn - Go to homepage"
              >
                Provn
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {isConnected && (
                <>
                  <a
                    href="/provs"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg ${
                      currentPage === "provs"
                        ? "text-provn-accent bg-provn-accent-subtle"
                        : "text-provn-muted hover:text-provn-text hover:bg-provn-surface-2"
                    }`}
                    aria-current={currentPage === "provs" ? "page" : undefined}
                  >
                    Provs
                  </a>
                  <a
                    href="/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg ${
                      currentPage === "dashboard"
                        ? "text-provn-accent bg-provn-accent-subtle"
                        : "text-provn-muted hover:text-provn-text hover:bg-provn-surface-2"
                    }`}
                    aria-current={currentPage === "dashboard" ? "page" : undefined}
                  >
                    Dashboard
                  </a>
                  <ProvnButton variant="secondary" onClick={() => (window.location.href = "/upload")}>
                    Upload
                  </ProvnButton>
                </>
              )}

              <ConnectButton />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-provn-muted hover:text-provn-text hover:bg-provn-surface-2 focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg transition-colors"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isMenuOpen ? "M6 18L18 6M6 6l12 12M6 18h12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-provn-border" id="mobile-menu">
              <div className="space-y-2">
                {isConnected && (
                  <>
                    <a
                      href="/provs"
                      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg ${
                        currentPage === "provs"
                          ? "text-provn-accent bg-provn-accent-subtle"
                          : "text-provn-muted hover:text-provn-text hover:bg-provn-surface-2"
                      }`}
                      aria-current={currentPage === "provs" ? "page" : undefined}
                    >
                      Provs
                    </a>
                    <a
                      href="/dashboard"
                      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg ${
                        currentPage === "dashboard"
                          ? "text-provn-accent bg-provn-accent-subtle"
                          : "text-provn-muted hover:text-provn-text hover:bg-provn-surface-2"
                      }`}
                      aria-current={currentPage === "dashboard" ? "page" : undefined}
                    >
                      Dashboard
                    </a>
                    <div className="px-3 py-2">
                      <ProvnButton
                        variant="secondary"
                        className="w-full"
                        onClick={() => (window.location.href = "/upload")}
                      >
                        Upload
                      </ProvnButton>
                    </div>
                  </>
                )}
                <div className="px-3 py-2">
                  <ConnectButton />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {showOnboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-provn-surface max-w-md w-full rounded-xl p-6 border border-provn-border">
            <div className="text-center">
              <h2 className="font-headline text-xl font-bold text-provn-text mb-4">Welcome to Provn!</h2>

              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <p className="text-provn-muted">
                    Create and protect your short-form video content on the blockchain.
                  </p>
                  <div className="space-y-2 text-sm text-provn-muted text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-provn-accent rounded-full"></div>
                      <span>Uploads are registered as IpNFTs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-provn-accent rounded-full"></div>
                      <span>Remix licenses cost 10 wCAMP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-provn-accent rounded-full"></div>
                      <span>Tips go 100% to creators</span>
                    </div>
                  </div>
                  <ProvnButton onClick={() => setOnboardingStep(2)} className="w-full">
                    Continue
                  </ProvnButton>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <p className="text-provn-muted">
                    By using Provn, you agree to our content guidelines and terms of service.
                  </p>
                  <div className="text-xs text-provn-muted text-left space-y-1">
                    <p>• No copyrighted content without permission</p>
                    <p>• No harmful or offensive material</p>
                    <p>• Respect intellectual property rights</p>
                  </div>
                  <div className="flex gap-2">
                    <ProvnButton variant="secondary" onClick={() => setOnboardingStep(1)} className="flex-1">
                      Back
                    </ProvnButton>
                    <ProvnButton onClick={completeOnboarding} className="flex-1">
                      I Agree
                    </ProvnButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
