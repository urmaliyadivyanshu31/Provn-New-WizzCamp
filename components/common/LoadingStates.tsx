'use client';

import { Loader2, Play, Users, Trophy, Video, Upload, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Unified Premium Loading Spinner
export function ProvnBrandLoader({ 
  size = "default", 
  message, 
  variant = "brand",
  minDisplayTime = 500 
}: { 
  size?: "sm" | "default" | "lg"
  message?: string
  variant?: "brand" | "simple"
  minDisplayTime?: number
}) {
  const sizeClasses = {
    sm: { container: "w-12 h-12", inner: "w-3 h-3", text: "text-xs" },
    default: { container: "w-20 h-20", inner: "w-5 h-5", text: "text-sm" },
    lg: { container: "w-24 h-24", inner: "w-6 h-6", text: "text-base" }
  };

  // Simple variant for inline/button usage
  if (variant === "simple") {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${sizeClasses[size].inner} text-provn-accent`}
        >
          <Loader2 className="w-full h-full" />
        </motion.div>
        {message && (
          <motion.p 
            className={`text-provn-muted font-headline ${sizeClasses[size].text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {message}
          </motion.p>
        )}
      </div>
    )
  }

  // Premium brand loader for main loading states
  return (
    <motion.div 
      className="flex flex-col items-center justify-center space-y-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ minHeight: `${minDisplayTime}ms` }}
    >
      <div className={`${sizeClasses[size].container} relative`}>
        {/* Outer gradient ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, var(--provn-accent), var(--provn-accent-press), transparent, var(--provn-accent))',
            borderRadius: '50%'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-1 bg-provn-bg rounded-full" />
        </motion.div>
        
        {/* Inner pulsing core */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className={`${sizeClasses[size].inner} bg-provn-accent rounded-full`} />
        </motion.div>
        
        {/* Pulse rings */}
        <motion.div
          className="absolute inset-0 border-2 border-provn-accent/30 rounded-full"
          animate={{ 
            scale: [1, 1.3], 
            opacity: [0.5, 0] 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </div>
      
      {message && (
        <motion.p
          className={`text-provn-text font-headline font-medium text-center max-w-sm ${sizeClasses[size].text}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
}

// Premium Video Card Skeleton
export function VideoCardSkeleton() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Video placeholder with play button */}
      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
        <motion.div
          className="relative"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-20 h-20 bg-provn-accent/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-provn-accent/30">
            <Play className="w-8 h-8 text-provn-accent ml-1" />
          </div>
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 border-2 border-provn-accent/30 rounded-full"
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>
      
      {/* Enhanced overlay skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="space-y-3">
          <motion.div 
            className="h-5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg"
            style={{ width: '75%' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div 
            className="h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg"
            style={{ width: '50%' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
        </div>
      </div>
      
      {/* Premium side actions skeleton */}
      <div className="absolute right-6 bottom-24 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border border-gray-600/50"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          >
            <div className="w-6 h-6 bg-gray-600 rounded-full" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Premium Video Feed Loading
export function VideoFeedSkeleton({ message = "Loading content" }: { message?: string } = {}) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Main video skeleton */}
      <VideoCardSkeleton />
      
      {/* Unified loading overlay */}
      <AnimatePresence>
        <motion.div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ProvnBrandLoader size="lg" message={message} variant="brand" minDisplayTime={800} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Premium Leaderboard Loading
export function LeaderboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center py-12">
        <motion.div
          className="h-12 bg-gradient-to-r from-provn-surface to-provn-surface-2 rounded-xl w-96 mx-auto mb-4"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="h-6 bg-provn-surface rounded-lg w-80 mx-auto"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
      </div>
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="p-6 bg-gradient-to-br from-provn-surface to-provn-surface-2 rounded-xl border border-provn-border"
            animate={{ 
              scale: [1, 1.02, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: i * 0.1 
            }}
          >
            <div className="flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8 text-provn-accent/50" />
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-provn-surface-2 rounded w-16 mx-auto" />
              <div className="h-4 bg-provn-surface-2 rounded w-20 mx-auto" />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Rankings skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="p-4 bg-gradient-to-r from-provn-surface to-provn-surface-2 rounded-xl border border-provn-border"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 text-center">
                <div className="h-6 bg-provn-accent/20 rounded w-8 mx-auto" />
              </div>
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-provn-accent/20 to-provn-accent-press/20 rounded-full border-2 border-provn-accent/30"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-provn-surface-2 rounded w-32" />
                <div className="h-4 bg-provn-surface-2 rounded w-24" />
              </div>
              <div className="hidden md:flex gap-6">
                <div className="text-center space-y-1">
                  <div className="h-5 bg-provn-surface-2 rounded w-16" />
                  <div className="h-3 bg-provn-surface-2 rounded w-12" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Premium Modal Loading
export function ModalLoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <ProvnBrandLoader size="default" />
      <motion.p
        className="text-provn-muted text-sm mt-4 font-headline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {message}
      </motion.p>
    </div>
  );
}

// Inline loading for buttons (Legacy - use LoadingSpinner instead)
export function ButtonSpinner({ size = 4 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`w-${size} h-${size} text-provn-accent`}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
}

// Premium Page Loading Overlay
export function PageLoadingOverlay({ message = "Loading page..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-provn-surface rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 border border-provn-border"
      >
        <div className="flex flex-col items-center space-y-6">
          <ProvnBrandLoader size="default" />
          <div className="text-center">
            <h3 className="font-headline font-semibold text-provn-text mb-2">Please wait</h3>
            <p className="text-provn-muted text-sm">{message}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Premium Image Placeholder
export function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-provn-surface to-provn-surface-2 flex items-center justify-center relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <div className="w-8 h-8 bg-provn-accent/20 rounded flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-provn-accent/50" />
      </div>
    </div>
  );
}

// Premium Text Skeleton
export function TextSkeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-4 bg-gradient-to-r from-provn-surface to-provn-surface-2 rounded-lg relative overflow-hidden ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Premium Profile Loading
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-provn-bg">
      {/* Banner skeleton */}
      <motion.div
        className="h-48 sm:h-64 bg-gradient-to-r from-provn-surface to-provn-surface-2 relative overflow-hidden"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage: 'linear-gradient(45deg, var(--provn-surface), var(--provn-surface-2), var(--provn-surface))'
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile header skeleton */}
        <div className="relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar skeleton */}
            <motion.div
              className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-provn-surface to-provn-surface-2 border-4 border-provn-bg"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-provn-accent/20 to-provn-accent-press/20 flex items-center justify-center">
                <User className="w-16 h-16 text-provn-accent/50" />
              </div>
            </motion.div>
            
            {/* Profile info skeleton */}
            <div className="flex-1 space-y-3 sm:mb-4">
              <div className="space-y-2">
                <motion.div
                  className="h-8 bg-gradient-to-r from-provn-surface to-provn-surface-2 rounded-lg w-48"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="h-5 bg-provn-surface rounded w-32"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
              </div>
            </div>
          </div>
          
          {/* Stats skeleton */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="text-center space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div
                  className="h-8 bg-gradient-to-r from-provn-surface to-provn-surface-2 rounded w-16 mx-auto"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                />
                <div className="h-4 bg-provn-surface rounded w-12 mx-auto" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Loading overlay */}
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ProvnBrandLoader size="lg" message="Loading profile" variant="brand" minDisplayTime={600} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Premium Upload Loading
export function UploadSkeleton({ progress = 0 }: { progress?: number }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8 space-y-4">
        <motion.div
          className="h-10 bg-gradient-to-r from-provn-surface to-provn-surface-2 rounded-xl w-64 mx-auto"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className="h-6 bg-provn-surface rounded w-80 mx-auto" />
      </div>
      
      {/* Upload area skeleton */}
      <div className="border-2 border-dashed border-provn-border rounded-xl p-12">
        <div className="text-center space-y-6">
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-provn-accent/20 to-provn-accent-press/20 rounded-xl mx-auto flex items-center justify-center"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Upload className="w-10 h-10 text-provn-accent" />
          </motion.div>
          
          <ProvnBrandLoader size="default" message="Processing your upload" />
          
          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto">
            <div className="h-2 bg-provn-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-provn-accent to-provn-accent-press"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <p className="text-sm text-provn-muted mt-2">{progress}% complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Premium Staggered Loader
export function StaggeredLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="flex space-x-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-gradient-to-r from-provn-accent to-provn-accent-press rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Error state with retry functionality
export function ErrorState({ 
  title = "Something went wrong", 
  message = "We couldn't load the content. Please try again.",
  onRetry 
}: { 
  title?: string
  message?: string
  onRetry?: () => void 
}) {
  return (
    <div className="min-h-screen bg-provn-bg flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-4"
        >
          {/* Error icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <div className="w-10 h-10 text-red-500">⚠️</div>
          </div>
          
          {/* Error text */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-provn-text font-headline">
              {title}
            </h2>
            <p className="text-provn-muted font-headline">
              {message}
            </p>
          </div>
          
          {/* Retry button */}
          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className="px-6 py-3 bg-provn-accent hover:bg-provn-accent-press text-provn-bg rounded-lg font-medium font-headline transition-colors"
            >
              Try Again
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Empty state for when no content exists
export function EmptyState({ 
  icon = <Sparkles className="w-12 h-12" />,
  title = "No content yet",
  message = "This section doesn't have any content to display.",
  action 
}: { 
  icon?: React.ReactNode
  title?: string
  message?: string
  action?: React.ReactNode 
}) {
  return (
    <div className="text-center py-16 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-4"
      >
        {/* Icon */}
        <div className="text-provn-muted">
          {icon}
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-provn-text font-headline">
            {title}
          </h3>
          <p className="text-provn-muted font-headline text-sm">
            {message}
          </p>
        </div>
        
        {/* Action button */}
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {action}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// Unified Loading Configuration
export const LOADING_CONFIG = {
  // Animation durations
  BRAND_SPIN_DURATION: 2,
  PULSE_DURATION: 1.5,
  SHIMMER_DURATION: 2,
  STAGGER_DELAY: 0.15,
  
  // Colors (using CSS variables)
  GRADIENT_FROM: 'var(--provn-accent)',
  GRADIENT_TO: 'var(--provn-accent-press)',
  
  // Size presets
  SIZES: {
    sm: { container: 'w-12 h-12', inner: 'w-3 h-3', text: 'text-xs' },
    default: { container: 'w-16 h-16', inner: 'w-4 h-4', text: 'text-sm' },
    lg: { container: 'w-20 h-20', inner: 'w-5 h-5', text: 'text-base' }
  }
} as const;

