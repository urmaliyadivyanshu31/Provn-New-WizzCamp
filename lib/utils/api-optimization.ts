// API optimization utilities for better performance and caching

import { logger } from '@/lib/logger'

// Performance-aware fetch wrapper with built-in error handling
export async function optimizedFetch<T>(
  url: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Request timeout', { url })
      throw new Error('Request timeout')
    }

    if (retries > 0) {
      logger.debug('Retrying request', { url, retriesLeft: retries })
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1s delay
      return optimizedFetch(url, options, retries - 1)
    }

    logger.error('Request failed', { url, error })
    throw error
  }
}

// Debounced API calls to prevent excessive requests
const apiCallCache = new Map<string, Promise<any>>()
const cacheTimeouts = new Map<string, NodeJS.Timeout>()

export function debouncedAPICall<T>(
  key: string,
  apiCall: () => Promise<T>,
  debounceMs: number = 300
): Promise<T> {
  // Clear existing timeout
  const existingTimeout = cacheTimeouts.get(key)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }

  // Return existing promise if available
  const existingPromise = apiCallCache.get(key)
  if (existingPromise) {
    return existingPromise
  }

  // Create new promise with debouncing
  const promise = new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(async () => {
      try {
        const result = await apiCall()
        apiCallCache.delete(key)
        cacheTimeouts.delete(key)
        resolve(result)
      } catch (error) {
        apiCallCache.delete(key)
        cacheTimeouts.delete(key)
        reject(error)
      }
    }, debounceMs)

    cacheTimeouts.set(key, timeout)
  })

  apiCallCache.set(key, promise)
  return promise
}

// Batch API requests to reduce network overhead
interface BatchRequest {
  id: string
  url: string
  options?: RequestInit
}

const batchQueue: BatchRequest[] = []
let batchTimeout: NodeJS.Timeout | null = null

export function batchAPIRequest<T>(
  id: string,
  url: string,
  options?: RequestInit
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Add to batch queue
    batchQueue.push({ id, url, options })

    // Set up batch processing
    if (batchTimeout) {
      clearTimeout(batchTimeout)
    }

    batchTimeout = setTimeout(async () => {
      const currentBatch = batchQueue.splice(0) // Clear queue
      
      try {
        // Process batch requests in parallel
        const results = await Promise.allSettled(
          currentBatch.map(req => 
            optimizedFetch(req.url, req.options)
          )
        )

        // Resolve individual promises
        results.forEach((result, index) => {
          const request = currentBatch[index]
          if (request.id === id) {
            if (result.status === 'fulfilled') {
              resolve(result.value as T)
            } else {
              reject(result.reason)
            }
          }
        })
      } catch (error) {
        reject(error)
      }
    }, 50) // 50ms batch window
  })
}

// Memory-efficient cache with automatic cleanup
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>()
  private maxSize: number
  private maxAge: number

  constructor(maxSize: number = 100, maxAgeMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.maxAge = maxAgeMs
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check if expired
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    // Move to end (mark as recently used)
    this.cache.delete(key)
    this.cache.set(key, item)
    
    return item.value
  }

  set(key: string, value: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

// Global cache instance for API responses
export const apiCache = new LRUCache<any>(200, 5 * 60 * 1000) // 200 items, 5 minutes

// Cached fetch with automatic cache key generation
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheDurationMs: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options)}`
  
  // Try cache first
  const cached = apiCache.get(cacheKey)
  if (cached) {
    logger.debug('Serving from cache', { url })
    return cached
  }

  // Fetch fresh data
  const data = await optimizedFetch<T>(url, options)
  
  // Cache the result
  apiCache.set(cacheKey, data)
  
  return data
}