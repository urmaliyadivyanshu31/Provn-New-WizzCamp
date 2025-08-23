import { TwitterApi } from 'twitter-api-v2'

/**
 * Twitter API Utility Library
 * 
 * Centralized Twitter API handling with proper error management,
 * rate limiting, and data validation for the Provn platform.
 */

export interface TwitterProfile {
  id: string
  username: string
  name: string
  verified: boolean
  description?: string
  profileImageUrl?: string
  location?: string
  createdAt?: string
  metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
    listed_count?: number
  }
  qualityScore?: number
}

export interface TwitterAccountValidation {
  isValid: boolean
  reason?: string
  message?: string
  score?: number
}

/**
 * Initialize Twitter API client with OAuth 1.0a credentials
 */
export function createTwitterOAuthClient(accessToken?: string, accessSecret?: string) {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  
  if (!apiKey || !apiSecret) {
    throw new Error('Twitter API credentials not configured')
  }
  
  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret,
  })
}

/**
 * Initialize Twitter API client with Bearer Token (read-only)
 */
export function createTwitterBearerClient() {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  
  if (!bearerToken) {
    throw new Error('Twitter Bearer Token not configured')
  }
  
  return new TwitterApi(bearerToken)
}

/**
 * Validate Twitter account for platform access
 * Returns validation result with detailed reasoning
 */
export function validateTwitterAccount(profile: TwitterProfile): TwitterAccountValidation {
  let score = 0
  const reasons: string[] = []
  
  // Check account age (must be at least 30 days old)
  if (profile.createdAt) {
    const createdDate = new Date(profile.createdAt)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    if (createdDate > thirtyDaysAgo) {
      return {
        isValid: false,
        reason: 'account_too_new',
        message: 'Twitter account must be at least 30 days old to qualify for platform access.',
        score: 0
      }
    } else {
      score += 20
      const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      if (ageInDays > 365) score += 10 // Bonus for mature accounts
    }
  }
  
  const metrics = profile.metrics
  if (metrics) {
    // Check minimum activity level
    const totalActivity = metrics.tweet_count + metrics.followers_count + metrics.following_count
    
    if (totalActivity < 5) {
      return {
        isValid: false,
        reason: 'insufficient_activity',
        message: 'Account must show some activity (tweets, followers, or following) to qualify for access.',
        score
      }
    }
    
    // Suspicious patterns detection
    if (metrics.following_count > 1000 && 
        metrics.followers_count < 10 && 
        metrics.tweet_count < 5) {
      return {
        isValid: false,
        reason: 'suspicious_pattern',
        message: 'Account activity pattern suggests potential spam account. Please use a more established Twitter account.',
        score
      }
    }
    
    // Score based on followers
    if (metrics.followers_count > 10000) score += 30
    else if (metrics.followers_count > 1000) score += 20
    else if (metrics.followers_count > 100) score += 15
    else if (metrics.followers_count > 10) score += 10
    else if (metrics.followers_count > 0) score += 5
    
    // Score based on tweets
    if (metrics.tweet_count > 1000) score += 20
    else if (metrics.tweet_count > 100) score += 15
    else if (metrics.tweet_count > 10) score += 10
    else if (metrics.tweet_count > 0) score += 5
    
    // Following ratio check (reasonable follow/follower ratio)
    if (metrics.followers_count > 0) {
      const ratio = metrics.following_count / metrics.followers_count
      if (ratio < 0.5) score += 15      // Great ratio
      else if (ratio < 2) score += 10   // Good ratio
      else if (ratio < 5) score += 5    // Acceptable ratio
      else if (ratio > 20) score -= 20  // Suspicious ratio
    }
  }
  
  // Verification bonus
  if (profile.verified) {
    score += 25
  }
  
  // Profile completeness
  if (profile.description && profile.description.length > 20) score += 10
  if (profile.location) score += 5
  if (profile.profileImageUrl && !profile.profileImageUrl.includes('default_profile')) {
    score += 5
  }
  
  // Username quality (not just numbers or random characters)
  if (profile.username.length > 3 && !/^\w*\d{6,}$/.test(profile.username)) {
    score += 5
  }
  
  // Final validation
  const finalScore = Math.max(0, Math.min(100, score))
  const isValid = finalScore >= 25 // Minimum score threshold
  
  if (!isValid && finalScore < 25) {
    return {
      isValid: false,
      reason: 'quality_score_too_low',
      message: 'Account quality score is too low. Please use a more established Twitter account with regular activity.',
      score: finalScore
    }
  }
  
  return {
    isValid: true,
    score: finalScore
  }
}

/**
 * Fetch Twitter user profile with complete information
 */
export async function fetchTwitterProfile(
  client: TwitterApi,
  identifier: string,
  byId: boolean = false
): Promise<TwitterProfile | null> {
  try {
    const userFields = [
      'id',
      'username',
      'name',
      'verified',
      'description',
      'profile_image_url',
      'location',
      'created_at',
      'public_metrics'
    ]
    
    let response
    if (byId) {
      response = await client.v2.user(identifier, {
        'user.fields': userFields
      })
    } else {
      response = await client.v2.userByUsername(identifier, {
        'user.fields': userFields
      })
    }
    
    if (!response.data) {
      return null
    }
    
    const user = response.data
    const profile: TwitterProfile = {
      id: user.id,
      username: user.username,
      name: user.name,
      verified: user.verified || false,
      description: user.description,
      profileImageUrl: user.profile_image_url,
      location: user.location,
      createdAt: user.created_at,
      metrics: user.public_metrics ? {
        followers_count: user.public_metrics.followers_count || 0,
        following_count: user.public_metrics.following_count || 0,
        tweet_count: user.public_metrics.tweet_count || 0,
        listed_count: user.public_metrics.listed_count || 0
      } : undefined
    }
    
    // Calculate quality score
    const validation = validateTwitterAccount(profile)
    profile.qualityScore = validation.score
    
    return profile
    
  } catch (error: any) {
    console.error('Error fetching Twitter profile:', error)
    
    // Handle specific Twitter API errors
    if (error.code === 50) {
      console.log('Twitter user not found:', identifier)
      return null
    }
    
    if (error.code === 63) {
      console.log('Twitter user suspended:', identifier)
      return null
    }
    
    throw error
  }
}

/**
 * Generate secure state parameter for OAuth flow
 */
export function generateSecureState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomArray = new Uint8Array(32)
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomArray)
  } else {
    // Fallback for older environments
    for (let i = 0; i < 32; i++) {
      randomArray[i] = Math.floor(Math.random() * 256)
    }
  }
  
  for (let i = 0; i < randomArray.length; i++) {
    result += chars[randomArray[i] % chars.length]
  }
  
  return result
}

/**
 * Rate limiting for Twitter API calls
 */
export class TwitterRateLimit {
  private lastCall: number = 0
  private callCount: number = 0
  private resetTime: number = 0
  
  constructor(
    private maxCalls: number = 300,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  async checkLimit(): Promise<void> {
    const now = Date.now()
    
    // Reset counter if window has passed
    if (now > this.resetTime) {
      this.callCount = 0
      this.resetTime = now + this.windowMs
    }
    
    // Check if we've exceeded the limit
    if (this.callCount >= this.maxCalls) {
      const waitTime = this.resetTime - now
      throw new Error(`Twitter API rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }
    
    // Add minimum delay between calls
    const timeSinceLastCall = now - this.lastCall
    const minDelay = 100 // 100ms between calls
    
    if (timeSinceLastCall < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastCall))
    }
    
    this.callCount++
    this.lastCall = Date.now()
  }
}

// Global rate limiter instance
export const twitterRateLimit = new TwitterRateLimit()

/**
 * Error handling for Twitter API responses
 */
export function handleTwitterError(error: any): {
  code?: number
  message: string
  retryable: boolean
} {
  // Rate limiting
  if (error.rateLimit) {
    return {
      code: 429,
      message: `Twitter API rate limited. Reset at: ${new Date(error.rateLimit.reset * 1000).toLocaleTimeString()}`,
      retryable: true
    }
  }
  
  // User not found
  if (error.code === 50) {
    return {
      code: 404,
      message: 'Twitter user not found',
      retryable: false
    }
  }
  
  // User suspended
  if (error.code === 63) {
    return {
      code: 403,
      message: 'Twitter user account has been suspended',
      retryable: false
    }
  }
  
  // Authentication errors
  if (error.code === 89 || error.code === 401) {
    return {
      code: 401,
      message: 'Twitter API authentication failed',
      retryable: false
    }
  }
  
  // Server errors (retryable)
  if (error.code >= 500) {
    return {
      code: error.code,
      message: 'Twitter API server error',
      retryable: true
    }
  }
  
  // Generic error
  return {
    code: error.code || 500,
    message: error.message || 'Twitter API error',
    retryable: false
  }
}