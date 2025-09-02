import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'

/**
 * Twitter/X Profile Information Endpoint
 * 
 * Fetches Twitter user profile information using bearer token.
 * Used for admin verification and user profile enhancement.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const twitterId = searchParams.get('id')
    
    if (!username && !twitterId) {
      return NextResponse.json({
        success: false,
        error: 'Username or Twitter ID required'
      }, { status: 400 })
    }
    
    // Validate bearer token
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    if (!bearerToken) {
      console.error('❌ Twitter Bearer Token not configured')
      return NextResponse.json({
        success: false,
        error: 'Twitter API not properly configured'
      }, { status: 500 })
    }
    
    console.log('🐦 Fetching Twitter profile for:', username || twitterId)
    
    // Use real Twitter API call with proper URL decoding
    let userProfile
    
    try {
      console.log('🔑 Using Twitter API for:', username)
      
      const apiUrl = twitterId 
        ? `https://api.twitter.com/2/users/${twitterId}`
        : `https://api.twitter.com/2/users/by/username/${username}`
        
      const userFields = 'id,username,name,verified,description,profile_image_url,public_metrics,created_at,location'
      const fullUrl = `${apiUrl}?user.fields=${userFields}`
      
      console.log('🌐 Making API call to Twitter...')
      
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'User-Agent': 'ProvnApp/1.0'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        userProfile = data.data
        console.log('✅ Successfully fetched real Twitter profile:', userProfile.username)
      } else {
        const errorText = await response.text()
        console.error('❌ Twitter API error:', response.status, errorText)
        throw new Error(`Twitter API error: ${response.status} - ${errorText}`)
      }
      
    } catch (fetchError) {
      console.error('❌ Twitter API fetch error:', fetchError instanceof Error ? fetchError.message : String(fetchError))
      throw fetchError
    }
    
    // Calculate account quality score
    const qualityScore = calculateAccountQuality(userProfile)
    
    console.log('✅ Twitter profile fetched successfully:', {
      username: userProfile.username,
      followers: userProfile.public_metrics?.followers_count,
      qualityScore
    })
    
    return NextResponse.json({
      success: true,
      profile: {
        id: userProfile.id,
        username: userProfile.username,
        name: userProfile.name,
        verified: userProfile.verified || false,
        description: userProfile.description,
        profileImageUrl: userProfile.profile_image_url,
        location: userProfile.location,
        createdAt: userProfile.created_at,
        metrics: userProfile.public_metrics,
        qualityScore
      }
    })
    
  } catch (error: any) {
    console.error('❌ Twitter profile fetch error:', error)
    
    if (error?.code === 50) {
      return NextResponse.json({
        success: false,
        error: 'Twitter user not found'
      }, { status: 404 })
    }
    
    if (error?.code === 63) {
      return NextResponse.json({
        success: false,
        error: 'Twitter user has been suspended'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Twitter profile'
    }, { status: 500 })
  }
}

/**
 * Calculate account quality score based on various factors
 */
function calculateAccountQuality(profile: any): number {
  let score = 0
  const metrics = profile.public_metrics
  
  if (!metrics) return 0
  
  // Base score for having metrics
  score += 10
  
  // Verification status
  if (profile.verified) {
    score += 30
  }
  
  // Account age (if available)
  if (profile.created_at) {
    const accountAge = Date.now() - new Date(profile.created_at).getTime()
    const daysOld = accountAge / (1000 * 60 * 60 * 24)
    
    if (daysOld > 365) score += 20      // Over 1 year
    else if (daysOld > 180) score += 15 // Over 6 months
    else if (daysOld > 90) score += 10  // Over 3 months
    else if (daysOld > 30) score += 5   // Over 1 month
  }
  
  // Follower count
  const followers = metrics.followers_count || 0
  if (followers > 10000) score += 20
  else if (followers > 1000) score += 15
  else if (followers > 100) score += 10
  else if (followers > 10) score += 5
  
  // Following ratio (not following too many compared to followers)
  const following = metrics.following_count || 0
  if (followers > 0) {
    const ratio = following / followers
    if (ratio < 0.5) score += 10      // Good ratio
    else if (ratio < 2) score += 5    // Reasonable ratio
    else if (ratio > 10) score -= 10  // Suspicious ratio
  }
  
  // Tweet activity
  const tweets = metrics.tweet_count || 0
  if (tweets > 1000) score += 15
  else if (tweets > 100) score += 10
  else if (tweets > 10) score += 5
  else if (tweets === 0) score -= 5 // No tweets is suspicious
  
  // Profile completeness
  if (profile.description && profile.description.length > 10) score += 5
  if (profile.location) score += 3
  if (profile.profile_image_url && !profile.profile_image_url.includes('default_profile')) {
    score += 5
  }
  
  // Cap the score between 0 and 100
  return Math.max(0, Math.min(100, score))
}

/**
 * Admin-only endpoint to get bulk Twitter profiles
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminWallet = request.headers.get('x-admin-wallet')
    const adminKey = request.headers.get('x-admin-key')
    
    if (!adminWallet || !adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const { usernames } = await request.json()
    
    if (!Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Array of usernames required'
      }, { status: 400 })
    }
    
    if (usernames.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 100 usernames allowed per request'
      }, { status: 400 })
    }
    
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    if (!bearerToken) {
      return NextResponse.json({
        success: false,
        error: 'Twitter API not configured'
      }, { status: 500 })
    }
    
    const client = new TwitterApi(bearerToken)
    
    // Fetch multiple users
    const response = await client.v2.usersByUsernames(usernames, {
      'user.fields': [
        'id',
        'username',
        'name',
        'verified',
        'description',
        'profile_image_url',
        'public_metrics',
        'created_at'
      ]
    })
    
    const profiles = response.data?.map(profile => ({
      id: profile.id,
      username: profile.username,
      name: profile.name,
      verified: profile.verified || false,
      description: profile.description,
      profileImageUrl: profile.profile_image_url,
      createdAt: profile.created_at,
      metrics: profile.public_metrics,
      qualityScore: calculateAccountQuality(profile)
    })) || []
    
    return NextResponse.json({
      success: true,
      profiles,
      found: profiles.length,
      errors: response.errors || []
    })
    
  } catch (error) {
    console.error('Bulk Twitter profile fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profiles'
    }, { status: 500 })
  }
}