"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ProvnCard, ProvnCardContent } from "./card"
import { ProvnBadge } from "./badge"

const features = [
  {
    id: 1,
    title: "IP Protection",
    description: "Register your content on-chain with immutable proof of creation",
    icon: "🔒",
    color: "from-blue-500/20 to-blue-600/20",
    details: "Every video gets a unique IpNFT with timestamp and creator verification",
  },
  {
    id: 2,
    title: "Remix Licensing",
    description: "Monetize derivative works with automatic royalty distribution",
    icon: "🎵",
    color: "from-purple-500/20 to-purple-600/20",
    details: "Set licensing terms and earn from every remix of your content",
  },
  {
    id: 3,
    title: "Creator Economy",
    description: "Keep 90% of earnings with transparent blockchain payments",
    icon: "💰",
    color: "from-green-500/20 to-green-600/20",
    details: "Direct payments, tips, and licensing fees with minimal platform fees",
  },
]

export function FeatureShowcase() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-provn-text mb-6">Revolutionary Features</h2>
          <p className="text-xl text-provn-muted max-w-2xl mx-auto">
            Built for creators who want to own their digital future
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              onHoverStart={() => setHoveredFeature(feature.id)}
              onHoverEnd={() => setHoveredFeature(null)}
              className="magnetic-hover"
            >
              <ProvnCard className="h-full relative overflow-hidden group cursor-pointer">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <ProvnCardContent className="relative z-10 p-8 text-center space-y-6">
                  <motion.div
                    className="w-20 h-20 bg-provn-accent/20 rounded-2xl flex items-center justify-center mx-auto"
                    animate={
                      hoveredFeature === feature.id
                        ? {
                            scale: 1.1,
                            rotate: [0, -5, 5, 0],
                            transition: { duration: 0.5 },
                          }
                        : {}
                    }
                  >
                    <span className="text-4xl" role="img">
                      {feature.icon}
                    </span>
                  </motion.div>

                  <div className="space-y-4">
                    <h3 className="font-headline text-2xl font-semibold text-provn-text">{feature.title}</h3>
                    <p className="text-provn-muted leading-relaxed">{feature.description}</p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={
                      hoveredFeature === feature.id
                        ? {
                            opacity: 1,
                            height: "auto",
                          }
                        : {
                            opacity: 0,
                            height: 0,
                          }
                    }
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-provn-border">
                      <ProvnBadge variant="verified" className="mb-3">
                        Learn More
                      </ProvnBadge>
                      <p className="text-sm text-provn-muted">{feature.details}</p>
                    </div>
                  </motion.div>
                </ProvnCardContent>

                {/* Particle effects on hover */}
                {hoveredFeature === feature.id && (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-provn-accent rounded-full"
                        initial={{
                          x: "50%",
                          y: "50%",
                          opacity: 0,
                        }}
                        animate={{
                          x: `${50 + (Math.random() - 0.5) * 100}%`,
                          y: `${50 + (Math.random() - 0.5) * 100}%`,
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.1,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                    ))}
                  </div>
                )}
              </ProvnCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
