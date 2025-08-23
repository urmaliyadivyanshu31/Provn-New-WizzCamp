// Optimized animation configurations for 60fps performance

// Fast durations for smooth 60fps animations
export const FAST_DURATION = 0.2
export const NORMAL_DURATION = 0.3
export const SLOW_DURATION = 0.4

// Optimized transition configs
export const fastTransition = {
  duration: FAST_DURATION,
  ease: [0.25, 0.46, 0.45, 0.94] as const
}

export const normalTransition = {
  duration: NORMAL_DURATION,
  ease: [0.25, 0.46, 0.45, 0.94] as const
}

export const slowTransition = {
  duration: SLOW_DURATION,
  ease: [0.25, 0.46, 0.45, 0.94] as const
}

// Stagger configurations - reduced for better performance
export const fastStagger = {
  staggerChildren: 0.03, // Reduced from typical 0.1
  delayChildren: 0.05
}

export const normalStagger = {
  staggerChildren: 0.05,
  delayChildren: 0.1
}

// Optimized viewport settings for intersection observer
export const optimizedViewport = {
  once: true,
  margin: "0px 0px -50px 0px", // Trigger animations slightly before coming into view
  amount: 0.2 // Trigger when 20% visible instead of default
}

// Performance-aware animation variants
export const fadeInFast = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: fastTransition
}

export const slideUpFast = {
  initial: { opacity: 0, y: 15 }, // Reduced from typical y: 30
  animate: { opacity: 1, y: 0 },
  transition: fastTransition
}

export const scaleInFast = {
  initial: { opacity: 0, scale: 0.98 }, // Subtle scale instead of 0.9
  animate: { opacity: 1, scale: 1 },
  transition: fastTransition
}

// Container variants for staggered animations
export const staggerContainerFast = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      ...fastStagger,
      when: "beforeChildren"
    }
  }
}

export const staggerItemFast = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: fastTransition
  }
}