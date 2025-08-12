"use client"

import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="home" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="font-headline text-5xl md:text-6xl font-bold text-provn-text leading-tight">
              Own Your Content
              <br />
              Own Your Future
            </h1>
            <p className="text-xl text-provn-muted max-w-2xl mx-auto">
              First short-form video platform with on-chain IP protection on Camp Network
            </p>
          </div>

          <div className="flex justify-center">
            <ProvnButton size="lg" className="text-lg px-8 py-4" onClick={() => (window.location.href = "/upload")}>
              Start Creating
            </ProvnButton>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="mt-24" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="font-headline text-3xl font-bold text-center text-provn-text mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <ProvnCard>
              <ProvnCardContent className="text-center space-y-4">
                <div className="w-16 h-16 bg-provn-accent/20 rounded-xl flex items-center justify-center mx-auto">
                  <span className="text-2xl" role="img" aria-label="Video camera">
                    📹
                  </span>
                </div>
                <h3 className="font-headline text-xl font-semibold text-provn-text">Upload</h3>
                <p className="text-provn-muted">
                  Upload your short-form videos with metadata and licensing preferences
                </p>
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard>
              <ProvnCardContent className="text-center space-y-4">
                <div className="w-16 h-16 bg-provn-accent/20 rounded-xl flex items-center justify-center mx-auto">
                  <span className="text-2xl" role="img" aria-label="Lock">
                    🔒
                  </span>
                </div>
                <h3 className="font-headline text-xl font-semibold text-provn-text">Protect</h3>
                <p className="text-provn-muted">Register your IP on-chain with Camp Network's Origin Framework</p>
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard>
              <ProvnCardContent className="text-center space-y-4">
                <div className="w-16 h-16 bg-provn-accent/20 rounded-xl flex items-center justify-center mx-auto">
                  <span className="text-2xl" role="img" aria-label="Money">
                    💰
                  </span>
                </div>
                <h3 className="font-headline text-xl font-semibold text-provn-text">Earn</h3>
                <p className="text-provn-muted">Earn from tips, licensing fees, and derivative work royalties</p>
              </ProvnCardContent>
            </ProvnCard>
          </div>
        </section>

        {/* Featured Videos Section */}
        <section className="mt-24" aria-labelledby="featured-videos">
          <div className="flex justify-between items-center mb-8">
            <h2 id="featured-videos" className="font-headline text-3xl font-bold text-provn-text">
              Featured Videos
            </h2>
            <ProvnBadge variant="verified">On-chain • Verified Provenance</ProvnBadge>
          </div>

          <div className="grid md:grid-cols-4 gap-6" role="list">
            {[1, 2, 3, 4].map((i) => (
              <ProvnCard
                key={i}
                className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg"
                onClick={() => (window.location.href = `/video/${i}`)}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    window.location.href = `/video/${i}`
                  }
                }}
              >
                <div className="aspect-[9/16] bg-provn-surface-2 relative">
                  <img
                    src={`/short-form-video.png?height=400&width=225&query=short form video ${i}`}
                    alt={`Featured video ${i} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2">
                    <ProvnBadge variant="verified" className="text-xs">
                      Verified
                    </ProvnBadge>
                  </div>
                </div>
                <ProvnCardContent className="p-4">
                  <h3 className="font-medium text-provn-text mb-1">Creative Video #{i}</h3>
                  <p className="text-sm text-provn-muted">by 0x1234...5678</p>
                </ProvnCardContent>
              </ProvnCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
