import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

/**
 * Twitter/X OAuth 2.0 Callback Endpoint
 * 
 * Handles the callback from Twitter OAuth 2.0, exchanges authorization code for access token,
 * fetches user profile, and submits whitelist request.
 */

interface TwitterUserProfile {
  id: string
  username: string
  name: string
  verified?: boolean
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
  created_at?: string
  description?: string
  profile_image_url?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    console.log('🐦 Processing Twitter OAuth 2.0 callback...')
    
    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error received:', error)
      return createErrorRedirect('Twitter authorization was denied or failed')
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('❌ Missing OAuth parameters in callback')
      return createErrorRedirect('Missing authentication parameters')
    }
    
    // Validate state parameter against cookie for CSRF protection
    const storedOAuthData = request.cookies.get('twitter_oauth_data')?.value
    if (!storedOAuthData) {
      console.error('❌ Missing stored OAuth data')
      return createErrorRedirect('Authentication session expired')
    }
    
    let oauthData
    try {
      oauthData = JSON.parse(storedOAuthData)
    } catch (e) {
      console.error('❌ Invalid stored OAuth data format')
      return createErrorRedirect('Invalid authentication state')
    }
    
    // Verify state parameter
    if (state !== oauthData.state) {
      console.error('❌ State parameter mismatch')
      return createErrorRedirect('Invalid authentication state')
    }
    
    // Check if OAuth data is not too old (10 minutes)
    if (Date.now() - oauthData.timestamp > 600000) {
      console.error('❌ OAuth data expired')
      return createErrorRedirect('Authentication session expired')
    }
    
    console.log('👛 Extracted wallet address from OAuth data:', oauthData.walletAddress)
    
    // Validate environment variables
    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.error('❌ Twitter OAuth 2.0 credentials not configured')
      return createErrorRedirect('Authentication service not configured')
    }
    
    console.log('🔑 Exchanging authorization code for access token...')
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/auth/x/callback`,
        code_verifier: oauthData.codeVerifier
      })
    })
    
    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', await tokenResponse.text())
      return createErrorRedirect('Failed to exchange authorization code')
    }
    
    const tokenData = await tokenResponse.json()
    
    console.log('👤 Fetching Twitter user profile...')
    
    // Fetch user profile information using access token
    const userProfile = await fetchTwitterProfile(tokenData.access_token)
    
    if (!userProfile) {
      console.error('❌ Failed to fetch Twitter user profile')
      return createErrorRedirect('Failed to retrieve profile information')
    }
    
    console.log('✅ Twitter profile fetched:', {
      username: userProfile.username,
      verified: userProfile.verified,
      followers: userProfile.public_metrics?.followers_count
    })
    
    // Validate account quality (anti-spam measures)
    const accountValidation = validateTwitterAccount(userProfile)
    if (!accountValidation.isValid) {
      console.warn('⚠️ Twitter account validation failed:', accountValidation.reason)
      return createErrorRedirect(accountValidation.message || 'Account validation failed')
    }
    
    // Submit whitelist request with wallet address
    const whitelistResult = await submitTwitterWhitelistRequest(userProfile, request, oauthData.walletAddress)
    
    if (whitelistResult.success) {
      console.log('✅ Twitter whitelist request submitted successfully with wallet address')
      return createSuccessRedirect(userProfile.username)
    } else {
      console.error('❌ Failed to submit whitelist request:', whitelistResult.error)
      return createErrorRedirect(whitelistResult.error || 'Failed to submit access request')
    }
    
  } catch (error: any) {
    console.error('❌ Twitter OAuth 2.0 callback error:', error)
    
    return createErrorRedirect('Authentication process failed')
  }
}

/**
 * Fetch Twitter user profile with required fields using OAuth 2.0 access token
 */
async function fetchTwitterProfile(accessToken: string): Promise<TwitterUserProfile | null> {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me?' + new URLSearchParams({
      'user.fields': 'id,username,name,verified,public_metrics,created_at,description,profile_image_url'
    }), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch Twitter profile:', response.status, await response.text())
      return null
    }
    
    const result = await response.json()
    return result.data as TwitterUserProfile
  } catch (error) {
    console.error('Failed to fetch Twitter profile:', error)
    return null
  }
}

/**
 * Validate Twitter account quality to prevent spam/bot accounts
 */
function validateTwitterAccount(profile: TwitterUserProfile) {
  // Check account age (must be at least 30 days old)
  if (profile.created_at) {
    const createdDate = new Date(profile.created_at)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    if (createdDate > thirtyDaysAgo) {
      return {
        isValid: false,
        reason: 'account_too_new',
        message: 'Account must be at least 30 days old for platform access'
      }
    }
  }
  
  // Check minimum activity level
  const metrics = profile.public_metrics
  if (metrics) {
    // Must have some activity (tweets, followers, or following)
    const totalActivity = (metrics.tweet_count || 0) + (metrics.followers_count || 0) + (metrics.following_count || 0)
    
    if (totalActivity < 5) {
      return {
        isValid: false,
        reason: 'insufficient_activity',
        message: 'Account must show some activity to qualify for access'
      }
    }
    
    // Suspicious patterns: following way more than followers with no tweets
    if (metrics.following_count > 1000 && 
        metrics.followers_count < 10 && 
        metrics.tweet_count < 5) {
      return {
        isValid: false,
        reason: 'suspicious_pattern',
        message: 'Account activity pattern indicates potential spam account'
      }
    }
  }
  
  return { isValid: true }
}

/**
 * Submit Twitter whitelist request to database
 */
async function submitTwitterWhitelistRequest(profile: TwitterUserProfile, request: NextRequest, walletAddress: string) {
  try {
    const supabase = createAdminClient()
    const clientIP = getClientIP(request)
    
    console.log('💾 Submitting whitelist request:', {
      username: profile.username,
      walletAddress,
      clientIP
    })
    
    // Check for existing submission
    const { data: existing } = await supabase
      .from('beta_whitelist')
      .select('id, status')
      .eq('twitter_username', profile.username)
      .single()
    
    if (existing) {
      if (existing.status === 'approved') {
        return {
          success: true,
          message: 'Your Twitter account is already approved!'
        }
      } else if (existing.status === 'pending') {
        return {
          success: true,
          message: 'Your request is already submitted and pending review.'
        }
      }
    }
    
    // Submit new whitelist request
    const { data, error } = await supabase
      .from('beta_whitelist')
      .insert({
        twitter_username: profile.username,
        wallet_address: walletAddress,
        submission_type: 'twitter',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        ip_address: clientIP,
        metadata: {
          twitter_id: profile.id,
          display_name: profile.name,
          verified: profile.verified || false,
          followers_count: profile.public_metrics?.followers_count || 0,
          following_count: profile.public_metrics?.following_count || 0,
          tweet_count: profile.public_metrics?.tweet_count || 0,
          account_created: profile.created_at
        }
      })
      .select()
    
    if (error) {
      console.error('Database error submitting Twitter whitelist:', error)
      return {
        success: false,
        error: 'Failed to save access request'
      }
    }
    
    return {
      success: true,
      data: data?.[0]
    }
    
  } catch (error) {
    console.error('Error submitting Twitter whitelist request:', error)
    return {
      success: false,
      error: 'Failed to process access request'
    }
  }
}

/**
 * Get client IP address for logging
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * Create error redirect to whitelist page
 */
function createErrorRedirect(message: string) {
  const url = new URL('/whitelist', process.env.NEXTAUTH_URL || 'http://localhost:3000')
  url.searchParams.set('error', 'twitter_auth_failed')
  url.searchParams.set('message', message)
  
  const response = NextResponse.redirect(url)
  
  // Clear OAuth data cookie
  response.cookies.set('twitter_oauth_data', '', {
    maxAge: 0,
    path: '/'
  })
  
  return response
}

/**
 * Create success redirect to whitelist page
 */
function createSuccessRedirect(username: string) {
  const url = new URL('/whitelist', process.env.NEXTAUTH_URL || 'http://localhost:3000')
  url.searchParams.set('x_auth', 'success')
  url.searchParams.set('x_username', username)
  url.searchParams.set('tab', 'x')
  
  const response = NextResponse.redirect(url)
  
  // Clear OAuth data cookie
  response.cookies.set('twitter_oauth_data', '', {
    maxAge: 0,
    path: '/'
  })
  
  return response
}