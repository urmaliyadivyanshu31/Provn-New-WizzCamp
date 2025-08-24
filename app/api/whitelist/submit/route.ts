import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { headers } from 'next/headers'

/**
 * Whitelist Submission API Endpoint
 * 
 * Handles beta access requests via email or Twitter authentication.
 * Implements enterprise-grade security with rate limiting, validation,
 * and fraud prevention measures.
 * 
 * Rate Limit: 3 requests per minute per IP
 * Security: Input validation, duplicate prevention, IP tracking
 */

interface WhitelistSubmission {
  type: 'email' | 'twitter'
  email?: string
  twitterUsername?: string
  twitterId?: string
  walletAddress?: string
}

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔍 Whitelist submission received')
    
    // Get client information for security
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const origin = request.headers.get('origin')
    
    console.log('📊 Request info:', { clientIP, userAgent: userAgent.slice(0, 100), origin })
    
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(clientIP)
    if (!rateLimitCheck.allowed) {
      await logSubmissionAttempt({
        type: 'rate_limited',
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: { 
          reason: 'Rate limit exceeded',
          attemptsInWindow: rateLimitCheck.attemptsInWindow
        }
      })
      
      return NextResponse.json({
        success: false,
        error: 'Too many requests. Please wait before trying again.',
        retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
      }, { status: 429 })
    }
    
    // Parse and validate request body
    let body: WhitelistSubmission
    
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format'
      }, { status: 400 })
    }
    
    // Validate submission type
    if (!body.type || !['email', 'twitter'].includes(body.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid submission type'
      }, { status: 400 })
    }
    
    // Type-specific validation
    const validation = validateSubmission(body)
    if (!validation.valid) {
      await logSubmissionAttempt({
        type: body.type,
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: { reason: 'Validation failed', error: validation.error }
      })
      
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 })
    }
    
    // Initialize Supabase client
    const supabase = createAdminClient()
    
    // Check for duplicates
    const duplicateCheck = await checkForDuplicates(supabase, body, clientIP)
    if (duplicateCheck.isDuplicate) {
      await logSubmissionAttempt({
        type: body.type,
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: { reason: 'Duplicate submission', duplicateType: duplicateCheck.type }
      })
      
      return NextResponse.json({
        success: false,
        error: duplicateCheck.message
      }, { status: 409 })
    }
    
    // Prepare submission data
    const submissionData = {
      email: body.type === 'email' ? body.email?.toLowerCase().trim() : null,
      twitter_username: body.type === 'twitter' ? body.twitterUsername : null,
      twitter_id: body.type === 'twitter' ? body.twitterId : null,
      wallet_address: body.walletAddress?.toLowerCase().trim() || null,
      submission_type: body.type,
      ip_address: clientIP,
      user_agent: userAgent,
      status: 'pending',
      metadata: {
        origin,
        submittedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    }
    
    console.log('📝 Preparing to insert submission:', {
      type: body.type,
      hasEmail: !!submissionData.email,
      hasTwitter: !!submissionData.twitter_username,
      hasWallet: !!submissionData.wallet_address
    })
    
    // Insert submission into database
    const { data: submission, error: insertError } = await supabase
      .from('beta_whitelist')
      .insert([submissionData])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Database insertion failed:', insertError)
      
      await logSubmissionAttempt({
        type: body.type,
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: { 
          reason: 'Database error', 
          error: insertError.message,
          code: insertError.code
        }
      })
      
      // Handle specific database errors
      if (insertError.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          success: false,
          error: 'This email or account has already been submitted for whitelist access.'
        }, { status: 409 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Submission failed due to a technical issue. Please try again.'
      }, { status: 500 })
    }
    
    console.log('✅ Submission successful:', submission.id)
    
    // Log successful submission
    await logSubmissionAttempt({
      type: body.type,
      ipAddress: clientIP,
      userAgent,
      success: true,
      metadata: { 
        submissionId: submission.id,
        processingTime: Date.now() - startTime
      }
    })
    
    // Send success response
    const response = {
      success: true,
      message: getSuccessMessage(body.type),
      submissionId: submission.id,
      estimatedReviewTime: '24-48 hours'
    }
    
    // Add cache headers to prevent duplicate submissions
    const nextResponse = NextResponse.json(response, { status: 201 })
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    return nextResponse
    
  } catch (error) {
    console.error('❌ Whitelist submission error:', error)
    
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logSubmissionAttempt({
      type: 'unknown',
      ipAddress: clientIP,
      userAgent,
      success: false,
      metadata: { 
        reason: 'Unexpected error',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
    })
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    }, { status: 500 })
  }
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientIP: string): { allowed: boolean; attemptsInWindow: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  
  // Clean old entries
  for (const [ip, data] of rateLimitMap.entries()) {
    if (data.resetTime <= now) {
      rateLimitMap.delete(ip)
    }
  }
  
  const current = rateLimitMap.get(clientIP)
  
  if (!current) {
    // First request in window
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, attemptsInWindow: 1, resetTime: now + RATE_LIMIT_WINDOW }
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, attemptsInWindow: current.count, resetTime: current.resetTime }
  }
  
  // Increment count
  current.count++
  rateLimitMap.set(clientIP, current)
  
  return { allowed: true, attemptsInWindow: current.count, resetTime: current.resetTime }
}

/**
 * Validate submission data
 */
function validateSubmission(body: WhitelistSubmission): { valid: boolean; error?: string } {
  if (body.type === 'email') {
    if (!body.email) {
      return { valid: false, error: 'Email address is required' }
    }
    
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailRegex.test(body.email)) {
      return { valid: false, error: 'Please enter a valid email address' }
    }
    
    // Check for suspicious patterns
    if (isSuspiciousEmail(body.email)) {
      return { valid: false, error: 'Please use a valid email address from a recognized provider' }
    }
  }
  
  if (body.type === 'twitter') {
    if (!body.twitterUsername && !body.twitterId) {
      return { valid: false, error: 'Twitter information is required' }
    }
    
    if (body.twitterUsername) {
      // Twitter username validation
      const twitterRegex = /^[a-zA-Z0-9_]{1,15}$/
      if (!twitterRegex.test(body.twitterUsername)) {
        return { valid: false, error: 'Invalid Twitter username format' }
      }
    }
  }
  
  // Wallet address validation (optional but if provided, must be valid)
  if (body.walletAddress) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)) {
      return { valid: false, error: 'Invalid wallet address format' }
    }
  }
  
  return { valid: true }
}

/**
 * Check for suspicious email patterns
 */
function isSuspiciousEmail(email: string): boolean {
  const suspiciousPatterns = [
    /^[a-z]+\d{4,}@/i, // Simple name + many digits
    /^\d+@/,           // Only digits before @
    /\.tk$|\.ml$|\.ga$|\.cf$/i, // Suspicious TLD
    /temp|disposable|10minute|guerrilla/i // Temporary email services
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(email))
}

/**
 * Check for duplicate submissions
 */
async function checkForDuplicates(
  supabase: any, 
  body: WhitelistSubmission, 
  clientIP: string
): Promise<{ isDuplicate: boolean; type?: string; message?: string }> {
  
  try {
    // Check for email duplicates
    if (body.type === 'email' && body.email) {
      const { data: emailDuplicate } = await supabase
        .from('beta_whitelist')
        .select('id, status')
        .eq('email', body.email.toLowerCase().trim())
        .limit(1)
      
      if (emailDuplicate && emailDuplicate.length > 0) {
        const status = emailDuplicate[0].status
        const statusMessage = status === 'approved' 
          ? 'This email is already approved for platform access.'
          : 'This email has already been submitted for whitelist review.'
        return {
          isDuplicate: true,
          type: 'email',
          message: statusMessage
        }
      }
    }
    
    // Check for Twitter duplicates
    if (body.type === 'twitter' && body.twitterUsername) {
      const { data: twitterDuplicate } = await supabase
        .from('beta_whitelist')
        .select('id, status')
        .eq('twitter_username', body.twitterUsername)
        .limit(1)
      
      if (twitterDuplicate && twitterDuplicate.length > 0) {
        const status = twitterDuplicate[0].status
        const statusMessage = status === 'approved' 
          ? 'This Twitter account is already approved for platform access.'
          : 'This Twitter account has already been submitted for whitelist review.'
        return {
          isDuplicate: true,
          type: 'twitter',
          message: statusMessage
        }
      }
    }
    
    // Check for wallet address duplicates if provided
    if (body.walletAddress) {
      const { data: walletDuplicate } = await supabase
        .from('beta_whitelist')
        .select('id, submission_type, twitter_username, email, status')
        .eq('wallet_address', body.walletAddress.toLowerCase().trim())
        .limit(1)
      
      if (walletDuplicate && walletDuplicate.length > 0) {
        const duplicate = walletDuplicate[0]
        let duplicateMethod = 'another method'
        
        if (duplicate.submission_type === 'email' && duplicate.email) {
          duplicateMethod = `email (${duplicate.email})`
        } else if (duplicate.submission_type === 'twitter' && duplicate.twitter_username) {
          duplicateMethod = `Twitter account @${duplicate.twitter_username}`
        }
        
        const statusMessage = duplicate.status === 'approved' 
          ? `This wallet address is already approved via ${duplicateMethod}.`
          : `This wallet address has already been submitted via ${duplicateMethod}. Each wallet can only be used once.`
        
        return {
          isDuplicate: true,
          type: 'wallet',
          message: statusMessage
        }
      }
    }
    
    // Check for IP-based rate limiting (max 5 submissions per IP per day)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('beta_whitelist')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIP)
      .gte('submitted_at', dayAgo)
    
    if (count && count >= 5) {
      return {
        isDuplicate: true,
        type: 'ip_limit',
        message: 'Maximum submissions reached for today. Please try again tomorrow.'
      }
    }
    
    return { isDuplicate: false }
    
  } catch (error) {
    console.error('Duplicate check error:', error)
    // Allow submission on check failure to avoid false positives
    return { isDuplicate: false }
  }
}

/**
 * Get success message based on submission type
 */
function getSuccessMessage(type: string): string {
  switch (type) {
    case 'email':
      return 'Thank you! Your email has been added to our beta waitlist. We\'ll notify you when access is available.'
    case 'twitter':
      return 'Thank you! Your Twitter account has been submitted for priority review. Check your DMs for updates.'
    default:
      return 'Thank you! Your submission has been received and is being reviewed.'
  }
}

/**
 * Extract client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         '0.0.0.0'
}

/**
 * Log submission attempts for analytics and security
 */
async function logSubmissionAttempt(params: {
  type: string
  ipAddress: string
  userAgent: string
  success: boolean
  metadata?: any
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    await supabase.rpc('log_access_attempt', {
      p_wallet_address: null,
      p_ip_address: params.ipAddress,
      p_user_agent: params.userAgent,
      p_access_type: 'whitelist_submission',
      p_success: params.success,
      p_route_attempted: '/api/whitelist/submit',
      p_metadata: {
        ...params.metadata,
        submissionType: params.type,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Failed to log submission attempt:', error)
  }
}

/**
 * Handle CORS and preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}