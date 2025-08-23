import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

/**
 * Simplified Twitter Authentication for Whitelist
 * 
 * Since OAuth 1.0a is complex, this provides a simpler flow where users
 * provide their Twitter username and we verify it exists and meets quality standards.
 * This is suitable for a whitelist system where we just need to verify account quality.
 */

export async function POST(request: NextRequest) {
  try {
    const { username, walletAddress } = await request.json()
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Twitter username is required'
      }, { status: 400 })
    }

    // Validate wallet address if provided
    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format'
      }, { status: 400 })
    }
    
    // Clean username (remove @ if present)
    const cleanUsername = username.replace(/^@/, '').trim()
    
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(cleanUsername)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Twitter username format'
      }, { status: 400 })
    }
    
    console.log('🐦 Verifying Twitter username:', cleanUsername)
    
    // Fetch Twitter profile to verify it exists and get metrics
    const profileResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/x/profile?username=${cleanUsername}`
    )
    
    if (!profileResponse.ok) {
      const error = await profileResponse.json()
      return NextResponse.json({
        success: false,
        error: error.error || 'Twitter account not found or inaccessible'
      }, { status: 404 })
    }
    
    const profileData = await profileResponse.json()
    
    if (!profileData.success || !profileData.profile) {
      return NextResponse.json({
        success: false,
        error: 'Unable to verify Twitter account'
      }, { status: 400 })
    }
    
    const profile = profileData.profile
    
    // Validate account quality
    const validation = validateTwitterAccount(profile)
    
    if (!validation.isValid) {
      console.log('⚠️ Twitter account validation failed:', validation.reason)
      return NextResponse.json({
        success: false,
        error: validation.message,
        reason: validation.reason
      }, { status: 400 })
    }
    
    console.log('✅ Twitter account validation passed:', {
      username: profile.username,
      qualityScore: validation.score
    })
    
    // Submit to whitelist
    const whitelistResult = await submitTwitterWhitelist(profile, request, walletAddress)
    
    if (!whitelistResult.success) {
      return NextResponse.json({
        success: false,
        error: whitelistResult.error
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: `Twitter account @${profile.username} verified and submitted for review!`,
      profile: {
        username: profile.username,
        name: profile.name,
        verified: profile.verified,
        qualityScore: validation.score,
        metrics: profile.metrics
      }
    })
    
  } catch (error: any) {
    console.error('❌ Twitter auth error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process Twitter authentication'
    }, { status: 500 })
  }
}

/**
 * Validate Twitter account for whitelist access
 */
function validateTwitterAccount(profile: any) {
  let score = 0
  
  // Check account age (must be at least 30 days old)
  if (profile.createdAt) {
    const createdDate = new Date(profile.createdAt)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    if (createdDate > thirtyDaysAgo) {
      return {
        isValid: false,
        reason: 'account_too_new',
        message: 'Twitter account must be at least 30 days old to qualify for platform access.'
      }
    }
    score += 20
  }
  
  const metrics = profile.metrics
  if (metrics) {
    // Check minimum activity
    const totalActivity = (metrics.tweet_count || 0) + (metrics.followers_count || 0) + (metrics.following_count || 0)
    
    if (totalActivity < 5) {
      return {
        isValid: false,
        reason: 'insufficient_activity',
        message: 'Account must show some activity (tweets, followers, or following) to qualify for access.'
      }
    }
    
    // Check for suspicious patterns
    if (metrics.following_count > 1000 && 
        metrics.followers_count < 10 && 
        (metrics.tweet_count || 0) < 5) {
      return {
        isValid: false,
        reason: 'suspicious_pattern',
        message: 'Account activity pattern suggests potential spam account.'
      }
    }
    
    // Score calculation
    if (metrics.followers_count > 1000) score += 20
    else if (metrics.followers_count > 100) score += 15
    else if (metrics.followers_count > 10) score += 10
    else if (metrics.followers_count > 0) score += 5
    
    if ((metrics.tweet_count || 0) > 100) score += 15
    else if ((metrics.tweet_count || 0) > 10) score += 10
    else if ((metrics.tweet_count || 0) > 0) score += 5
  }
  
  // Verification bonus
  if (profile.verified) score += 25
  
  // Profile completeness
  if (profile.description && profile.description.length > 10) score += 10
  if (profile.location) score += 5
  
  const finalScore = Math.max(0, Math.min(100, score))
  
  if (finalScore < 20) {
    return {
      isValid: false,
      reason: 'quality_too_low',
      message: 'Account quality score is too low. Please use a more established Twitter account.',
      score: finalScore
    }
  }
  
  return {
    isValid: true,
    score: finalScore
  }
}

/**
 * Submit Twitter whitelist entry
 */
async function submitTwitterWhitelist(profile: any, request: NextRequest, walletAddress?: string) {
  try {
    const supabase = createAdminClient()
    const clientIP = getClientIP(request)
    
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
    
    // Insert new whitelist request
    const { error } = await supabase
      .from('beta_whitelist')
      .insert({
        twitter_username: profile.username,
        wallet_address: walletAddress?.toLowerCase().trim() || null,
        submission_type: 'twitter',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        ip_address: clientIP,
        metadata: {
          twitter_id: profile.id,
          display_name: profile.name,
          verified: profile.verified || false,
          followers_count: profile.metrics?.followers_count || 0,
          following_count: profile.metrics?.following_count || 0,
          tweet_count: profile.metrics?.tweet_count || 0,
          quality_score: profile.qualityScore || 0,
          account_created: profile.createdAt,
          profile_image: profile.profileImageUrl
        }
      })
    
    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to save request'
      }
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Whitelist submission error:', error)
    return {
      success: false,
      error: 'Failed to process request'
    }
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP
  return 'unknown'
}