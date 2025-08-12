"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { ProvnVideoPlayer } from "@/components/provn/video-player"
import { Navigation } from "@/components/provn/navigation"

interface VideoData {
  id: string
  title: string
  creator: string
  ipnftId: string
  description: string
  tags: string[]
  createdAt: string
  tips: number
  licenses: number
  parentId?: string
  derivatives?: string[]
}

// Mock data - in real app this would come from API
const mockVideoData: VideoData = {
  id: "1",
  title: "Creative Dance Routine",
  creator: "0x1234567890abcdef1234567890abcdef12345678",
  ipnftId: "#123",
  description: "An original dance routine showcasing contemporary moves with urban influences.",
  tags: ["dance", "creative", "original", "urban"],
  createdAt: "2024-01-15",
  tips: 25,
  licenses: 3,
  derivatives: ["2", "3"], // Mock derivative IDs
}

export default function VideoAssetPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "provenance" | "activity">("overview")
  const [showTipModal, setShowTipModal] = useState(false)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [hasLicense, setHasLicense] = useState(false) // Track if user has purchased license
  const [isProcessingLicense, setIsProcessingLicense] = useState(false)

  const videoData = mockVideoData // In real app, fetch based on params.id

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handlePurchaseLicense = async () => {
    setIsProcessingLicense(true)

    // Simulate license purchase
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setHasLicense(true)
    setIsProcessingLicense(false)
    setShowLicenseModal(false)

    // Show success toast
    const toast = document.createElement("div")
    toast.className = "fixed top-4 right-4 p-4 rounded-lg text-white z-50 bg-green-600"
    toast.textContent = "License purchased successfully! You can now create derivatives."
    document.body.appendChild(toast)
    setTimeout(() => document.body.removeChild(toast), 5000)
  }

  const handleCreateDerivative = () => {
    router.push(`/upload/derivative?parent=${videoData.id}`)
  }

  const handleReport = () => {
    router.push(`/disputes/new?target=${videoData.id}`)
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="video" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Video Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-headline text-3xl font-bold text-provn-text mb-2">{videoData.title}</h1>
              {videoData.parentId && (
                <div className="flex items-center gap-2 text-provn-muted">
                  <span>Derivative of</span>
                  <a href={`/video/${videoData.parentId}`} className="text-provn-accent hover:underline">
                    Video #{videoData.parentId}
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ProvnBadge variant="verified">On‑chain • Verified Prov</ProvnBadge>
              {/* Added report button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 text-provn-muted hover:text-provn-text transition-colors"
                title="Report content"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <ProvnVideoPlayer
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            poster="/short-form-video.png"
            className="aspect-video"
          />

          {/* Action Buttons */}
          <div className="flex gap-4">
            <ProvnButton onClick={() => setShowTipModal(true)}>Send Tip</ProvnButton>
            {!hasLicense ? (
              <ProvnButton variant="secondary" onClick={() => setShowLicenseModal(true)}>
                Get Remix License — 10 wCAMP
              </ProvnButton>
            ) : (
              <ProvnButton variant="accent" onClick={handleCreateDerivative}>
                Create Derivative
              </ProvnButton>
            )}
          </div>

          {/* Creator Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-provn-muted">
              <span>CREATOR: {formatAddress(videoData.creator)}</span>
              <span>IpNFT ID: {videoData.ipnftId}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-provn-border">
            <nav className="flex gap-8">
              {[
                { id: "overview", label: "Overview" },
                { id: "provenance", label: "Provenance" },
                { id: "activity", label: "Activity" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-headline font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-provn-accent text-provn-accent"
                      : "border-transparent text-provn-muted hover:text-provn-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-headline text-lg font-semibold text-provn-text mb-3">Description</h3>
                  <p className="text-provn-muted leading-relaxed">{videoData.description}</p>
                </div>

                <div>
                  <h3 className="font-headline text-lg font-semibold text-provn-text mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {videoData.tags.map((tag) => (
                      <ProvnBadge key={tag} className="bg-provn-surface-2 text-provn-text">
                        #{tag}
                      </ProvnBadge>
                    ))}
                  </div>
                </div>

                {videoData.derivatives && videoData.derivatives.length > 0 && (
                  <div>
                    <h3 className="font-headline text-lg font-semibold text-provn-text mb-3">Derivatives</h3>
                    <div className="grid gap-3">
                      {videoData.derivatives.map((derivativeId) => (
                        <ProvnCard key={derivativeId}>
                          <ProvnCardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-provn-surface-2 rounded-lg"></div>
                                <div>
                                  <div className="text-provn-text font-medium">Derivative #{derivativeId}</div>
                                  <div className="text-provn-muted text-sm">Created 2 days ago</div>
                                </div>
                              </div>
                              <ProvnButton
                                size="sm"
                                variant="secondary"
                                onClick={() => router.push(`/video/${derivativeId}`)}
                              >
                                View
                              </ProvnButton>
                            </div>
                          </ProvnCardContent>
                        </ProvnCard>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
                  <p className="text-provn-muted text-center">Created with Camp Network's Origin Framework</p>
                </div>
              </div>
            )}

            {activeTab === "provenance" && (
              <div className="space-y-6">
                {videoData.parentId ? (
                  <div className="space-y-6">
                    <div className="text-center py-4">
                      <h3 className="font-headline text-xl font-semibold text-provn-text mb-4">Content Lineage</h3>
                    </div>

                    {/* Lineage Graph */}
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-provn-surface-2 rounded-xl flex items-center justify-center mb-2">
                          <span className="text-2xl">🎬</span>
                        </div>
                        <div className="text-provn-text text-sm font-medium">Original</div>
                        <div className="text-provn-muted text-xs">#{videoData.parentId}</div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-8 h-0.5 bg-provn-accent"></div>
                        <div className="w-3 h-3 bg-provn-accent rounded-full ml-1"></div>
                      </div>

                      <div className="text-center">
                        <div className="w-16 h-16 bg-provn-accent/20 rounded-xl flex items-center justify-center mb-2">
                          <span className="text-2xl">🎭</span>
                        </div>
                        <div className="text-provn-text text-sm font-medium">Derivative</div>
                        <div className="text-provn-muted text-xs">#{videoData.id}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-provn-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔗</span>
                    </div>
                    <h3 className="font-headline text-xl font-semibold text-provn-text mb-2">Original Work</h3>
                    <p className="text-provn-muted">This is an original creation with verified on-chain provenance.</p>
                  </div>
                )}

                <ProvnCard>
                  <ProvnCardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-provn-muted">Minted</span>
                        <span className="text-provn-text">{videoData.createdAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-provn-muted">Network</span>
                        <span className="text-provn-text">BaseCAMP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-provn-muted">Contract</span>
                        <span className="text-provn-text font-mono text-sm">0xabcd...ef12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-provn-muted">Token ID</span>
                        <span className="text-provn-text">{videoData.ipnftId}</span>
                      </div>
                      {videoData.parentId && (
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Parent Token</span>
                          <span className="text-provn-text">#{videoData.parentId}</span>
                        </div>
                      )}
                    </div>
                  </ProvnCardContent>
                </ProvnCard>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <ProvnCard>
                    <ProvnCardContent className="p-6 text-center">
                      <div className="text-2xl font-headline font-bold text-provn-text">{videoData.tips}</div>
                      <div className="text-provn-muted">Tips Received</div>
                    </ProvnCardContent>
                  </ProvnCard>
                  <ProvnCard>
                    <ProvnCardContent className="p-6 text-center">
                      <div className="text-2xl font-headline font-bold text-provn-text">{videoData.licenses}</div>
                      <div className="text-provn-muted">Licenses Sold</div>
                    </ProvnCardContent>
                  </ProvnCard>
                </div>

                <div className="space-y-3">
                  {[
                    { type: "tip", amount: "5 wCAMP", from: "0x9876...5432", time: "2 hours ago" },
                    { type: "license", amount: "10 wCAMP", from: "0x5678...9012", time: "1 day ago" },
                    { type: "derivative", amount: "Created", from: "0x3456...7890", time: "3 days ago" },
                    { type: "tip", amount: "2 wCAMP", from: "0x3456...7890", time: "3 days ago" },
                  ].map((activity, index) => (
                    <ProvnCard key={index}>
                      <ProvnCardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                activity.type === "tip"
                                  ? "bg-provn-success"
                                  : activity.type === "derivative"
                                    ? "bg-purple-500"
                                    : "bg-provn-accent"
                              }`}
                            />
                            <span className="text-provn-text capitalize">{activity.type}</span>
                            <span className="text-provn-muted">
                              {activity.type === "derivative" ? "by" : "from"} {formatAddress(activity.from)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-provn-text font-medium">{activity.amount}</div>
                            <div className="text-provn-muted text-sm">{activity.time}</div>
                          </div>
                        </div>
                      </ProvnCardContent>
                    </ProvnCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* License Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <ProvnCard className="w-full max-w-md">
            <ProvnCardContent className="p-6">
              <h3 className="font-headline text-xl font-semibold text-provn-text mb-4">Get Remix License</h3>
              <div className="space-y-4">
                <div className="bg-provn-surface-2 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-provn-text">License Price</span>
                    <span className="text-provn-text font-semibold">10 wCAMP</span>
                  </div>
                  <div className="text-provn-muted text-sm">70% goes to creator, 30% to platform</div>
                </div>
                <div className="text-provn-muted text-sm">
                  This license allows you to create derivative works based on this content. After purchase, you'll be
                  able to upload your own derivative version.
                </div>
                <div className="flex gap-3">
                  <ProvnButton
                    variant="secondary"
                    onClick={() => setShowLicenseModal(false)}
                    disabled={isProcessingLicense}
                  >
                    Cancel
                  </ProvnButton>
                  <ProvnButton onClick={handlePurchaseLicense} disabled={isProcessingLicense}>
                    {isProcessingLicense ? "Processing..." : "Purchase License"}
                  </ProvnButton>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <ProvnCard className="w-full max-w-md">
            <ProvnCardContent className="p-6">
              <h3 className="font-headline text-xl font-semibold text-provn-text mb-4">Send Tip</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-provn-text font-medium mb-2">Amount (wCAMP)</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[1, 5, 10].map((amount) => (
                      <button
                        key={amount}
                        className="px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text hover:bg-provn-accent hover:text-white transition-colors"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Custom amount"
                    className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <ProvnButton variant="secondary" onClick={() => setShowTipModal(false)}>
                    Cancel
                  </ProvnButton>
                  <ProvnButton onClick={() => setShowTipModal(false)}>Send Tip</ProvnButton>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>
        </div>
      )}

      {/* Added report confirmation modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <ProvnCard className="w-full max-w-md">
            <ProvnCardContent className="p-6">
              <h3 className="font-headline text-xl font-semibold text-provn-text mb-4">Report Content</h3>
              <div className="space-y-4">
                <p className="text-provn-muted">
                  You're about to report this content for violating community guidelines or your rights. This will be
                  reviewed by our moderation team.
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">
                    False reports may result in account restrictions. Only report content that genuinely violates our
                    policies.
                  </p>
                </div>
                <div className="flex gap-3">
                  <ProvnButton variant="secondary" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </ProvnButton>
                  <ProvnButton onClick={handleReport}>Continue to Report</ProvnButton>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>
        </div>
      )}
    </div>
  )
}
