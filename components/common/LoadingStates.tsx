'use client';

import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Skeleton loading for video cards
export function VideoCardSkeleton() {
  return (
    <div className="absolute inset-0 bg-black">
      <div className="animate-pulse">
        {/* Video placeholder */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
        
        {/* Overlay skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        
        {/* Side actions skeleton */}
        <div className="absolute right-4 bottom-20 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-12 h-12 bg-gray-700 rounded-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Feed loading state with multiple skeletons
export function VideoFeedSkeleton() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`absolute inset-0 ${i === 1 ? 'z-10' : 'z-0'}`}
        >
          <VideoCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Loading spinner for modal content
export function ModalLoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}

// Inline loading for buttons
export function ButtonSpinner({ size = 4 }: { size?: number }) {
  return (
    <Loader2 className={`w-${size} h-${size} animate-spin`} />
  );
}

// Page loading overlay
export function PageLoadingOverlay({ message = "Loading page..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Please wait</h3>
          <p className="text-gray-600 text-sm text-center">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Progressive loading for images
export function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 bg-gray-300 rounded"></div>
    </div>
  );
}

// Loading state for text content
export function TextSkeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded animate-pulse ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}

// Staggered loading animation
export function StaggeredLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="flex space-x-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-blue-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}