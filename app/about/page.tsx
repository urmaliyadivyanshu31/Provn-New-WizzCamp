"use client"

import React from "react"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { BookOpenIcon, StarIcon, ArrowRightIcon, ExternalLinkIcon } from "@/components/icons"
import Link from "next/link"

export default function AboutPage() {
  // Provn Logo Component
  const ProvnLogo = () => (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-provn-bg rounded-sm transform rotate-12"></div>
        </div>
        <div className="absolute inset-0 w-8 h-8 bg-provn-accent/20 rounded-lg blur-sm"></div>
      </div>
      <div className="font-headline font-bold">
        <span className="text-2xl text-provn-text">Prov</span>
        <span className="text-2xl text-provn-accent">n</span>
      </div>
    </div>
  );

  const features = [
    {
      title: "Creator Ownership",
      description: "Full control over your content and audience relationships"
    },
    {
      title: "Transparent Monetization",
      description: "Direct creator-to-fan value exchange without hidden fees"
    },
    {
      title: "Community Governance",
      description: "Platform decisions made by the community, for the community"
    },
    {
      title: "Cross-Platform Integration",
      description: "Seamlessly connect with existing social media platforms"
    },
    {
      title: "Privacy First",
      description: "Your data stays yours, with full transparency and control"
    },
    {
      title: "Censorship Resistant",
      description: "Built on decentralized infrastructure for true freedom of expression"
    }
  ];

  const roadmapItems = [
    {
      phase: "Q3 2025",
      title: "Beta Launch",
      description: "Limited access for select creators and early adopters",
      status: "current"
    },
    {
      phase: "Q4 2025",
      title: "Creator Tools",
      description: "Advanced content creation and monetization features",
      status: "upcoming"
    },
    {
      phase: "Q1 2026",
      title: "Mobile App",
      description: "Native iOS and Android applications",
      status: "upcoming"
    },
    {
      phase: "Q2 2026",
      title: "Global Launch",
      description: "Full public access and ecosystem expansion",
      status: "future"
    }
  ];

  return (
    <div className="min-h-screen bg-provn-bg">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/5 via-transparent to-orange-100/5"></div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #ff6d01 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-40 left-10 w-96 h-96 bg-gradient-radial from-orange-400/3 via-orange-400/1 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-gradient-radial from-amber-400/2 via-amber-400/0.5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="w-full p-6 border-b border-provn-border/50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/whitelist">
              <ProvnLogo />
            </Link>
            <Link 
              href="/whitelist" 
              className="text-provn-muted hover:text-provn-text transition-colors text-sm flex items-center space-x-2"
            >
              <span>← Back to Whitelist</span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <BookOpenIcon className="w-10 h-10 text-provn-accent" />
              <h1 className="font-headline text-5xl font-bold text-provn-text">
                Understanding Provn
              </h1>
            </div>
            <p className="text-xl text-provn-muted max-w-3xl mx-auto leading-relaxed">
              The future of content creation is decentralized. Provn empowers creators with true ownership, 
              transparent monetization, and direct community connections in a censorship-resistant environment.
            </p>
          </div>

          {/* Vision Section */}
          <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl mb-12">
            <ProvnCardContent className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="font-headline text-3xl font-bold text-provn-text mb-4">
                    Our Vision
                  </h2>
                  <p className="text-provn-muted leading-relaxed mb-6">
                    We envision a world where creators have complete autonomy over their content, audience, 
                    and revenue streams. Provn is building the infrastructure for a new era of digital content 
                    creation that puts power back in the hands of creators and their communities.
                  </p>
                  <p className="text-provn-muted leading-relaxed">
                    By leveraging blockchain technology and decentralized protocols, we're creating a platform 
                    that's truly owned by its users, governed by its community, and resistant to censorship.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-provn-accent/10 to-provn-accent/5 rounded-2xl p-8 border border-provn-accent/20">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-provn-accent mb-2">Web3</div>
                    <div className="text-provn-text font-medium mb-4">Content Platform</div>
                    <div className="text-sm text-provn-muted">
                      Built on Camp Network for maximum performance and scalability
                    </div>
                  </div>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="font-headline text-3xl font-bold text-provn-text mb-8 text-center">
              Platform Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <ProvnCard 
                  key={index} 
                  className="bg-provn-surface/90 backdrop-blur-sm border border-provn-border/50 hover:border-provn-accent/30 transition-all duration-300"
                >
                  <ProvnCardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <StarIcon className="w-6 h-6 text-provn-accent" filled />
                      </div>
                      <div>
                        <h3 className="font-semibold text-provn-text mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-provn-muted text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </ProvnCardContent>
                </ProvnCard>
              ))}
            </div>
          </div>

          {/* Roadmap Section */}
          <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl mb-12">
            <ProvnCardContent className="p-8 lg:p-12">
              <h2 className="font-headline text-3xl font-bold text-provn-text mb-8 text-center">
                Development Roadmap
              </h2>
              <div className="space-y-8">
                {roadmapItems.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        item.status === 'current' 
                          ? 'bg-provn-accent border-provn-accent' 
                          : item.status === 'upcoming'
                          ? 'bg-provn-accent/50 border-provn-accent'
                          : 'bg-transparent border-provn-muted'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-provn-accent">
                          {item.phase}
                        </span>
                        {item.status === 'current' && (
                          <span className="px-2 py-1 text-xs bg-provn-accent/20 text-provn-accent rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-provn-text mb-1">
                        {item.title}
                      </h3>
                      <p className="text-provn-muted text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Technology Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl">
              <ProvnCardContent className="p-8">
                <h3 className="font-headline text-2xl font-bold text-provn-text mb-4">
                  Built on Camp Network
                </h3>
                <p className="text-provn-muted leading-relaxed mb-4">
                  Provn leverages the Camp Network infrastructure to deliver high-performance, 
                  scalable Web3 experiences. This partnership ensures optimal speed, reliability, 
                  and seamless user interactions.
                </p>
                <a 
                  href="https://www.campnetwork.xyz/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-provn-accent hover:text-provn-accent/80 transition-colors"
                >
                  Learn more about Camp Network
                  <ExternalLinkIcon className="w-4 h-4 ml-1" />
                </a>
              </ProvnCardContent>
            </ProvnCard>

            <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl">
              <ProvnCardContent className="p-8">
                <h3 className="font-headline text-2xl font-bold text-provn-text mb-4">
                  Open Source Future
                </h3>
                <p className="text-provn-muted leading-relaxed mb-4">
                  We believe in transparency and community contribution. Key components of Provn 
                  will be open-sourced to enable community auditing, contributions, and the 
                  building of complementary tools and services.
                </p>
                <div className="text-provn-muted text-sm">
                  Open source components coming Q4 2025
                </div>
              </ProvnCardContent>
            </ProvnCard>
          </div>

          {/* Community Section */}
          <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl mb-12">
            <ProvnCardContent className="p-8 lg:p-12">
              <div className="text-center">
                <h2 className="font-headline text-3xl font-bold text-provn-text mb-4">
                  Join Our Community
                </h2>
                <p className="text-provn-muted leading-relaxed mb-8 max-w-2xl mx-auto">
                  Be part of shaping the future of content creation. Follow our development journey, 
                  participate in discussions, and get early access to new features.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <a
                    href="https://x.com/provndotfun"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-6 py-3 bg-provn-accent text-provn-bg rounded-lg font-medium hover:bg-provn-accent/90 transition-colors"
                  >
                    <span>Follow @provndotfun</span>
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                  <Link
                    href="/whitelist"
                    className="flex items-center space-x-2 px-6 py-3 border border-provn-border text-provn-text rounded-lg font-medium hover:border-provn-accent/50 hover:text-provn-accent transition-colors"
                  >
                    <span>Join Beta Waitlist</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Footer */}
          <div className="text-center border-t border-provn-border/50 pt-8">
            <p className="text-provn-muted text-sm mb-4">
              Provn is currently in beta development. Features and timelines are subject to change.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-provn-muted">
              <Link href="/privacy" className="hover:text-provn-text transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <a 
                href="https://x.com/provndotfun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-provn-text transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}