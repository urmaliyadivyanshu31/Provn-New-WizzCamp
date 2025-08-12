"use client"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { Hero3D } from "@/components/provn/hero-3d"
import { AnimatedCounter } from "@/components/provn/animated-counter"
import { FeatureShowcase } from "@/components/provn/feature-showcase"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="home" />

      <Hero3D />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.section
          className="py-24"
          aria-labelledby="how-it-works"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            id="how-it-works"
            className="font-headline text-4xl md:text-5xl font-bold text-center text-provn-text mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📹",
                title: "Upload",
                description: "Upload your short-form videos with metadata and licensing preferences",
                delay: 0,
              },
              {
                icon: "🔒",
                title: "Protect",
                description: "Register your IP on-chain with Camp Network's Origin Framework",
                delay: 0.2,
              },
              {
                icon: "💰",
                title: "Earn",
                description: "Earn from tips, licensing fees, and derivative work royalties",
                delay: 0.4,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: step.delay }}
                whileHover={{ y: -10 }}
              >
                <ProvnCard className="h-full group hover:shadow-2xl transition-all duration-300">
                  <ProvnCardContent className="text-center space-y-6 p-8">
                    <motion.div
                      className="w-20 h-20 bg-provn-accent/20 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-provn-accent/30 transition-colors duration-300"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <span className="text-4xl" role="img" aria-label={step.title}>
                        {step.icon}
                      </span>
                    </motion.div>
                    <h3 className="font-headline text-2xl font-semibold text-provn-text">{step.title}</h3>
                    <p className="text-provn-muted leading-relaxed">{step.description}</p>
                  </ProvnCardContent>
                </ProvnCard>
              </motion.div>
            ))}
          </div>

          <div className="hidden md:block relative mt-8">
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <motion.path
                d="M 25% 50% Q 50% 30% 75% 50%"
                stroke="var(--provn-accent)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.5 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.8 }}
              />
            </svg>
          </div>
        </motion.section>

        <motion.section
          className="py-24 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="font-headline text-4xl md:text-5xl font-bold text-provn-text mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Trusted by Creators Worldwide
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <AnimatedCounter
                end={10000}
                suffix="+"
                className="font-headline text-5xl md:text-6xl font-bold text-provn-accent block mb-2"
              />
              <p className="text-xl text-provn-muted">Videos Protected</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <AnimatedCounter
                end={500000}
                prefix="$"
                suffix="+"
                className="font-headline text-5xl md:text-6xl font-bold text-provn-accent block mb-2"
              />
              <p className="text-xl text-provn-muted">Creator Earnings</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <AnimatedCounter
                end={5000}
                suffix="+"
                className="font-headline text-5xl md:text-6xl font-bold text-provn-accent block mb-2"
              />
              <p className="text-xl text-provn-muted">Active Creators</p>
            </motion.div>
          </div>
        </motion.section>

        <FeatureShowcase />

        <motion.section
          className="py-24"
          aria-labelledby="featured-videos"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex justify-between items-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="featured-videos" className="font-headline text-4xl md:text-5xl font-bold text-provn-text">
              Featured Videos
            </h2>
            <ProvnBadge variant="verified">On-chain • Verified Provenance</ProvnBadge>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6" role="list">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <ProvnCard
                  className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-provn-accent focus:ring-offset-2 focus:ring-offset-provn-bg group"
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
                  <div className="aspect-[9/16] bg-provn-surface-2 relative overflow-hidden">
                    <motion.img
                      src={`/short-form-video.png?height=400&width=225&query=short form video ${i}`}
                      alt={`Featured video ${i} thumbnail`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      whileHover={{ scale: 1.1 }}
                    />
                    <div className="absolute bottom-2 left-2">
                      <ProvnBadge variant="verified" className="text-xs">
                        Verified
                      </ProvnBadge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <ProvnCardContent className="p-4">
                    <h3 className="font-medium text-provn-text mb-1">Creative Video #{i}</h3>
                    <p className="text-sm text-provn-muted">by 0x1234...5678</p>
                  </ProvnCardContent>
                </ProvnCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="py-24 text-center relative overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-provn-accent/5 via-transparent to-provn-accent/5" />

          <motion.div
            className="relative z-10 max-w-4xl mx-auto space-y-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-headline text-5xl md:text-6xl font-bold text-provn-text">
              Ready to Own Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/60">
                Creative Future?
              </span>
            </h2>

            <p className="text-xl text-provn-muted max-w-2xl mx-auto">
              Join thousands of creators who are already protecting and monetizing their content on-chain
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.button
                className="relative px-12 py-6 bg-provn-accent text-provn-bg font-semibold text-xl rounded-xl overflow-hidden group glow-effect"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/upload")}
              >
                <span className="relative z-10">Start Creating Today</span>
                <div className="absolute inset-0 bg-gradient-to-r from-provn-accent to-provn-accent-press opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.section>
      </main>
    </div>
  )
}
