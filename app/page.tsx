"use client"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="font-headline text-6xl md:text-8xl font-bold text-provn-text">
            Own Your Content,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/60">
              Own Your Future
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-provn-muted max-w-2xl mx-auto">
            The first short-form video platform with on-chain IP protection on Camp Network
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ProvnButton
              size="lg"
              onClick={() => (window.location.href = "/simple-mint")}
              className="px-8 py-4 text-lg"
            >
              Start Minting
            </ProvnButton>
            <ProvnButton
              variant="secondary"
              size="lg"
              onClick={() => (window.location.href = "/upload")}
              className="px-8 py-4 text-lg"
            >
              Upload Video
            </ProvnButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-headline text-4xl md:text-5xl font-bold text-center text-provn-text mb-16">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📁",
              title: "Upload",
              description: "Upload any image, video, or audio file up to 10MB",
            },
            {
              icon: "🔒",
              title: "Protect",
              description: "Register your IP on-chain with Camp Network's Origin Framework",
            },
            {
              icon: "💰",
              title: "Own",
              description: "Own your content forever with verifiable on-chain provenance",
            },
          ].map((step, index) => (
            <ProvnCard key={index} className="text-center p-8">
              <ProvnCardContent>
                <div className="w-16 h-16 bg-provn-accent/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <h3 className="font-headline text-xl font-semibold text-provn-text mb-4">{step.title}</h3>
                <p className="text-provn-muted">{step.description}</p>
              </ProvnCardContent>
            </ProvnCard>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8 px-4">
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-provn-text">
            Ready to Mint Your First IP-NFT?
          </h2>
          <p className="text-xl text-provn-muted">
            Start protecting and owning your content on-chain today
          </p>
          <ProvnButton
            size="lg"
            onClick={() => (window.location.href = "/simple-mint")}
            className="px-12 py-4 text-xl"
          >
            Get Started
          </ProvnButton>
        </div>
      </section>
    </div>
  )
}
