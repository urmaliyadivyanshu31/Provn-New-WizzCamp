import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'

/**
 * Twitter/X OAuth Authorization Endpoint
 * 
 * Initiates the Twitter OAuth flow for whitelist authentication.
 * Creates a secure authorization URL with state parameter for CSRF protection.
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🐦 Initiating Twitter OAuth flow...')
    
    // Validate environment variables
    const apiKey = process.env.TWITTER_API_KEY
    const apiSecret = process.env.TWITTER_API_SECRET
    
    if (!apiKey || !apiSecret) {
      console.error('❌ Twitter API credentials not configured')
      return NextResponse.json({
        success: false,
        error: 'Twitter authentication not properly configured'
      }, { status: 500 })
    }
    
    // Initialize Twitter API client
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
    })
    
    // Generate callback URL
    const baseUrl = request.nextUrl.origin
    const callbackUrl = `${baseUrl}/api/auth/x/callback`
    
    // Generate state parameter for CSRF protection
    const state = generateSecureState()
    
    console.log('🔗 Generating authorization URL with callback:', callbackUrl)
    
    // Generate OAuth 1.0a request token and authorization URL
    const authLink = await client.generateAuthLink(callbackUrl)
    
    // Store the OAuth secret temporarily (in production, use Redis/database)
    // For now, we'll include it in the state parameter (not recommended for production)
    const secureState = `${state}:${authLink.oauth_token_secret}`
    
    const response = NextResponse.json({
      success: true,
      authUrl: authLink.url,
      oauth_token: authLink.oauth_token,
      state: secureState
    })
    
    // Set secure cookie with OAuth data for callback verification
    response.cookies.set('twitter_oauth_state', secureState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })
    
    console.log('✅ Twitter authorization URL generated successfully')
    
    return response
    
  } catch (error: any) {
    console.error('❌ Twitter OAuth initialization failed:', error)
    
    // Handle specific Twitter API errors
    if (error?.code) {
      return NextResponse.json({
        success: false,
        error: 'Twitter API error: ' + (error.message || 'Unknown error'),
        code: error.code
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize Twitter authentication'
    }, { status: 500 })
  }
}

/**
 * Generate cryptographically secure state parameter
 */
function generateSecureState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomArray = new Uint8Array(32)
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomArray)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 32; i++) {
      randomArray[i] = Math.floor(Math.random() * 256)
    }
  }
  
  for (let i = 0; i < randomArray.length; i++) {
    result += chars[randomArray[i] % chars.length]
  }
  
  return result
}