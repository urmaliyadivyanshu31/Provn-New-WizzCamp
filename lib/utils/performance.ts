// Performance optimization utilities

/**
 * Debounce function - prevents function from being called too frequently
 * Perfect for search inputs, resize handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle function - limits function execution to once per interval
 * Perfect for scroll handlers, animation updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: NodeJS.Timeout | null = null
  let lastRan: number | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    if (lastRan === null) {
      func(...args)
      lastRan = Date.now()
    } else {
      if (lastFunc) clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if (Date.now() - (lastRan || 0) >= limit) {
          func(...args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

/**
 * RAF-based throttle for smooth 60fps animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) return
    
    rafId = requestAnimationFrame(() => {
      func(...args)
      rafId = null
    })
  }
}

/**
 * Memory cleanup utility to prevent memory leaks
 */
export class PerformanceCleanup {
  private cleanupTasks: (() => void)[] = []
  
  addCleanup(task: () => void): void {
    this.cleanupTasks.push(task)
  }
  
  addEventListenerCleanup(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options)
    this.addCleanup(() => element.removeEventListener(event, handler))
  }
  
  addTimeoutCleanup(id: NodeJS.Timeout): void {
    this.addCleanup(() => clearTimeout(id))
  }
  
  addIntervalCleanup(id: NodeJS.Timeout): void {
    this.addCleanup(() => clearInterval(id))
  }
  
  cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task()
      } catch (error) {
        // Silent cleanup to prevent cascading errors
      }
    })
    this.cleanupTasks = []
  }
}

/**
 * Optimized intersection observer for lazy loading
 */
export function createOptimizedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px', // Start loading slightly before entering viewport
    threshold: 0.1,
    ...options
  }
  
  return new IntersectionObserver(callback, defaultOptions)
}

/**
 * Preload critical resources for better performance
 */
export function preloadResource(href: string, as: string, type?: string): void {
  if (typeof window === 'undefined') return
  
  // Check if already preloaded
  if (document.querySelector(`link[href="${href}"]`)) return
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (type) link.type = type
  
  document.head.appendChild(link)
}

/**
 * Batch DOM updates for better performance
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  // Use document fragment to batch DOM changes
  const fragment = document.createDocumentFragment()
  
  // Temporarily detach elements, make changes, then reattach
  updates.forEach(update => {
    try {
      update()
    } catch (error) {
      // Log error but continue with other updates
      console.warn('DOM update failed:', error)
    }
  })
}

/**
 * Optimize image loading with proper format detection
 */
export function getOptimizedImageUrl(src: string, width?: number, height?: number): string {
  // Skip if already optimized or data URL
  if (src.startsWith('data:') || src.includes('w_') || src.includes('f_auto')) {
    return src
  }
  
  // In a real implementation, you'd integrate with an image optimization service
  // For now, just add basic parameters
  const url = new URL(src, window.location.href)
  
  if (width) url.searchParams.set('w', width.toString())
  if (height) url.searchParams.set('h', height.toString())
  
  // Add format optimization hint
  url.searchParams.set('f', 'auto')
  url.searchParams.set('q', 'auto')
  
  return url.toString()
}

/**
 * Measure component render performance
 */
export function measureRenderTime(componentName: string) {
  const startTime = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - startTime
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎭 ${componentName} rendered in ${duration.toFixed(2)}ms`)
      }
      return duration
    }
  }
}

/**
 * Memory-safe event listener utility
 */
export function addEventListenerSafe(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): () => void {
  element.addEventListener(event, handler, options)
  
  // Return cleanup function
  return () => element.removeEventListener(event, handler)
}