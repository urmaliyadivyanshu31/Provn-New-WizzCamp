"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface FloatingVideo {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  speed: number
}

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [floatingVideos, setFloatingVideos] = useState<FloatingVideo[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Initialize floating videos
    const videos: FloatingVideo[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.8 + Math.random() * 0.4,
      speed: 0.5 + Math.random() * 0.5,
    }))
    setFloatingVideos(videos)

    // Mouse tracking for parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-screen overflow-hidden bg-gradient-to-br from-provn-bg via-provn-surface to-provn-bg"
    >
      {/* Particle System */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Floating Video Frames */}
      <div className="absolute inset-0">
        {floatingVideos.map((video) => (
          <motion.div
            key={video.id}
            className="absolute w-32 h-48 bg-provn-surface-2 rounded-lg shadow-2xl overflow-hidden"
            style={{
              left: `${video.x}%`,
              top: `${video.y}%`,
              transform: `scale(${video.scale})`,
            }}
            animate={{
              x: mousePosition.x * 20 * video.speed,
              y: mousePosition.y * 20 * video.speed,
              rotateY: mousePosition.x * 10,
              rotateX: -mousePosition.y * 10,
            }}
            transition={{
              type: "spring",
              stiffness: 50,
              damping: 20,
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-provn-accent/20 to-provn-accent/5 flex items-center justify-center">
              <div className="w-8 h-8 bg-provn-accent/40 rounded-full animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="h-1 bg-provn-accent/60 rounded-full" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center space-y-8 max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="space-y-4"
          >
            <motion.h1
              className="font-headline text-6xl md:text-8xl font-bold text-provn-text leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1 }}
            >
              Own Your Content
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/60">
                Own Your Future
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-provn-muted max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.5 }}
            >
              First short-form video platform with on-chain IP protection on Camp Network
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="flex justify-center"
          >
            <motion.button
              className="relative px-12 py-6 bg-provn-accent text-provn-bg font-semibold text-lg rounded-xl overflow-hidden group glow-effect"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (window.location.href = "/upload")}
            >
              <span className="relative z-10">Start Creating</span>
              <div className="absolute inset-0 bg-gradient-to-r from-provn-accent to-provn-accent-press opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--provn-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--provn-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {floatingVideos.map((video, i) => (
          <motion.line
            key={video.id}
            x1={`${video.x}%`}
            y1={`${video.y}%`}
            x2="50%"
            y2="50%"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: i * 0.2 }}
          />
        ))}
      </svg>
    </div>
  )
}
