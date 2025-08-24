import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Twitter/X OAuth 2.0 Authorization Endpoint
 * 
 * Initiates the Twitter OAuth 2.0 PKCE flow for whitelist authentication.
 * Creates a secure authorization URL with state parameter for CSRF protection.
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🐦 Initiating Twitter OAuth 2.0 PKCE flow...')
    
    // Extract wallet address from query parameters
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    
    console.log('👛 Received wallet address for OAuth:', walletAddress)
    
    // Validate wallet address
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      console.error('❌ Invalid or missing wallet address')
      return NextResponse.json({
        success: false,
        error: 'Valid wallet address is required for Twitter authentication'
      }, { status: 400 })
    }
    
    // Validate environment variables
    const clientId = process.env.TWITTER_CLIENT_ID
    
    if (!clientId) {
      console.error('❌ Twitter OAuth 2.0 credentials not configured')
      return NextResponse.json({
        success: false,
        error: 'Twitter authentication not properly configured'
      }, { status: 500 })
    }
    
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)
    const state = generateSecureState()
    
    // Generate callback URL (use consistent production URL)
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const redirectUri = `${baseUrl}/api/auth/x/callback`
    console.log('🔗 Generating authorization URL with callback:', redirectUri)
    
    // Build OAuth 2.0 authorization URL
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read users.read offline.access',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })
    
    const authUrl = `https://twitter.com/i/oauth2/authorize?${authParams.toString()}`
    
    // Store OAuth state and PKCE data for callback verification
    const oauthData = {
      state,
      codeVerifier,
      walletAddress,
      timestamp: Date.now()
    }
    
    const response = NextResponse.json({
      success: true,
      authUrl,
      state
    })
    
    // Set secure cookie with OAuth data for callback verification
    response.cookies.set('twitter_oauth_data', JSON.stringify(oauthData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })
    
    console.log('✅ Twitter OAuth 2.0 authorization URL generated successfully')
    
    return response
    
  } catch (error: any) {
    console.error('❌ Twitter OAuth 2.0 initialization failed:', error)
    
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

/**
 * Generate PKCE code verifier
 */
function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  const randomArray = new Uint8Array(128)
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomArray)
  } else {
    for (let i = 0; i < 128; i++) {
      randomArray[i] = Math.floor(Math.random() * 256)
    }
  }
  
  for (let i = 0; i < randomArray.length; i++) {
    result += chars[randomArray[i] % chars.length]
  }
  
  return result
}

/**
 * Generate PKCE code challenge from code verifier
 */
function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest()
  return hash.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}