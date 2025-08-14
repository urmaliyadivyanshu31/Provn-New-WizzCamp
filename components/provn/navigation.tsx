"use client"

import { useState } from "react"
import { CampModal, useAuth } from '@campnetwork/origin/react'
import { ProvnButton } from "./button"

interface NavigationProps {
  currentPage?: "home" | "upload" | "dashboard" | "video" | "provs" | "profile"
}

export function Navigation({ currentPage = "home" }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { walletAddress, isAuthenticated } = useAuth()

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
              <a
                href="/upload"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg ${
                  currentPage === "upload"
                    ? "text-provn-accent bg-provn-accent-subtle"
                    : "text-provn-muted hover:text-provn-text hover:bg-provn-surface-2"
                }`}
                aria-current={currentPage === "upload" ? "page" : undefined}
              >
                Upload
              </a>
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
              <ProvnButton onClick={() => (window.location.href = "/simple-mint")}>
                Mint
              </ProvnButton>
              
              {/* Wallet Connection Section */}
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-provn-border">
                {isAuthenticated ? (
                  <a 
                    href={`/profile/${walletAddress}`}
                    className="flex items-center gap-2 hover:bg-provn-surface-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-provn-accent rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-provn-bg">
                        {walletAddress ? walletAddress.slice(2, 4).toUpperCase() : 'OR'}
                      </span>
                    </div>
                    <span className="text-sm text-provn-muted">
                      {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
                    </span>
                  </a>
                ) : (
                  <ProvnButton variant="secondary" size="sm">
                    <span className="w-4 h-4 mr-1">🔗</span>
                    Connect
                  </ProvnButton>
                )}
              </div>
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
                <a
                  href="/upload"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg ${
                    currentPage === "upload"
                      ? "text-provn-accent bg-provn-accent-subtle"
                      : "text-provn-muted hover:text-provn-text hover:bg-provn-surface-2"
                  }`}
                  aria-current={currentPage === "upload" ? "page" : undefined}
                >
                  Upload
                </a>
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
                    className="w-full mb-4"
                    onClick={() => (window.location.href = "/simple-mint")}
                  >
                    Mint
                  </ProvnButton>
                  
                  {/* Mobile Wallet Connection */}
                  <div className="pt-4 border-t border-provn-border">
                    {isAuthenticated ? (
                      <a 
                        href={`/profile/${walletAddress}`}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-provn-surface-2 transition-colors"
                      >
                        <div className="w-8 h-8 bg-provn-accent rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-provn-bg">
                            {walletAddress ? walletAddress.slice(2, 4).toUpperCase() : 'OR'}
                          </span>
                        </div>
                        <span className="text-sm text-provn-muted">
                          {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
                        </span>
                      </a>
                    ) : (
                      <ProvnButton variant="secondary" className="w-full">
                        <span className="w-4 h-4 mr-2">🔗</span>
                        Connect Wallet
                      </ProvnButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      <CampModal />
    </>
  )
}
