import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { randomBytes } from 'crypto'

/**
 * VIP Access Management API Endpoint
 * 
 * Allows authorized admins to grant instant platform access to VIP users.
 * Generates secure access tokens that bypass the whitelist system.
 * 
 * Security: Admin authentication required, all actions logged
 * Rate Limit: 10 VIP grants per hour per admin
 */

interface VIPAccessRequest {
  walletAddress: string
  expiryHours?: number
  notes?: string
  maxUsage?: number
}

interface VIPAccessResponse {
  success: boolean
  accessToken?: string
  vipUrl?: string
  expiresAt?: string
  error?: string
}

// Admin rate limiting (in production, use Redis)
const adminRateLimit = new Map<string, { count: number; resetTime: number }>()
const ADMIN_RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const ADMIN_RATE_LIMIT_MAX = 10 // 10 VIP grants per hour

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔐 VIP access grant request received')
    
    // Get admin info
    const adminWallet = request.headers.get('x-admin-wallet')
    const adminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Validate admin authentication
    const adminCheck = await validateAdmin(adminWallet || null, adminKey || null)
    if (!adminCheck.valid) {
      await logAdminAction({
        adminWallet: adminWallet || 'unknown',
        action: 'vip_grant_denied',
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: { reason: adminCheck.error }
      })
      
      return NextResponse.json({
        success: false,
        error: adminCheck.error || 'Unauthorized'
      }, { status: 401 })
    }
    
    console.log('✅ Admin authenticated:', adminWallet)
    
    // Check admin rate limits
    const rateLimitCheck = checkAdminRateLimit(adminWallet!)
    if (!rateLimitCheck.allowed) {
      await logAdminAction({
        adminWallet: adminWallet!,
        action: 'vip_grant_rate_limited',
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
        error: 'Rate limit exceeded. Maximum 10 VIP grants per hour.',
        retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
      }, { status: 429 })
    }
    
    // Parse request body
    let body: VIPAccessRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format'
      }, { status: 400 })
    }
    
    // Validate wallet address
    if (!body.walletAddress || !isValidWalletAddress(body.walletAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Valid wallet address is required'
      }, { status: 400 })
    }
    
    const normalizedWallet = body.walletAddress.toLowerCase()
    
    // Check if wallet is already whitelisted
    const isAlreadyWhitelisted = await checkExistingAccess(normalizedWallet)
    if (isAlreadyWhitelisted.hasAccess) {
      return NextResponse.json({
        success: false,
        error: `Wallet already has access: ${isAlreadyWhitelisted.type}`
      }, { status: 409 })
    }
    
    // Generate secure VIP access token
    const accessToken = generateVIPToken()
    const expiryHours = Math.min(Math.max(body.expiryHours || 24, 1), 168) // 1 hour to 7 days
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)
    const maxUsage = Math.min(Math.max(body.maxUsage || 1, 1), 10) // 1-10 uses
    
    console.log('🎫 Generating VIP access token:', {
      wallet: normalizedWallet,
      expiryHours,
      maxUsage,
      tokenPreview: accessToken.slice(0, 8) + '...'
    })
    
    // Store VIP access in database
    const supabase = createAdminClient()
    
    const { data: vipAccess, error: insertError } = await supabase
      .from('vip_access')
      .insert([{
        access_token: accessToken,
        wallet_address: normalizedWallet,
        created_by: adminWallet,
        expires_at: expiresAt.toISOString(),
        notes: body.notes || `VIP access granted by ${adminWallet}`,
        max_usage: maxUsage,
        active: true
      }])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ VIP access database error:', insertError)
      
      await logAdminAction({
        adminWallet: adminWallet!,
        action: 'vip_grant_failed',
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: { 
          reason: 'Database error',
          error: insertError.message,
          targetWallet: normalizedWallet
        }
      })
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create VIP access. Please try again.'
      }, { status: 500 })
    }
    
    // Generate VIP access URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const vipUrl = `${baseUrl}/vip-access?token=${accessToken}`
    
    console.log('✅ VIP access granted successfully:', {
      id: vipAccess.id,
      wallet: normalizedWallet,
      expiresAt: expiresAt.toISOString()
    })
    
    // Log successful admin action
    await logAdminAction({
      adminWallet: adminWallet!,
      action: 'vip_grant_success',
      ipAddress: clientIP,
      userAgent,
      success: true,
      metadata: { 
        vipAccessId: vipAccess.id,
        targetWallet: normalizedWallet,
        expiryHours,
        maxUsage,
        processingTime: Date.now() - startTime
      }
    })
    
    const response: VIPAccessResponse = {
      success: true,
      accessToken,
      vipUrl,
      expiresAt: expiresAt.toISOString()
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('❌ VIP access grant error:', error)
    
    const adminWallet = request.headers.get('x-admin-wallet') || 'unknown'
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logAdminAction({
      adminWallet,
      action: 'vip_grant_error',
      ipAddress: clientIP,
      userAgent,
      success: false,
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
    })
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 })
  }
}

/**
 * Get VIP access list and statistics (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Simple admin key validation for dashboard
    const adminKey = request.headers.get('x-admin-key')
    const expectedKey = process.env.ADMIN_API_KEY
    
    if (!adminKey || !expectedKey || adminKey !== expectedKey) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid admin key'
      }, { status: 401 })
    }
    
    const supabase = createAdminClient()
    
    // Get query parameters
    const { searchParams } = request.nextUrl
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const status = searchParams.get('status') || 'all' // active, expired, used, all
    
    // Build query
    let query = supabase
      .from('vip_access')
      .select(`
        id,
        access_token,
        wallet_address,
        created_by,
        created_at,
        expires_at,
        used_at,
        active,
        usage_count,
        max_usage,
        notes
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Apply status filter
    if (status === 'active') {
      query = query.eq('active', true).gt('expires_at', new Date().toISOString())
    } else if (status === 'expired') {
      query = query.lt('expires_at', new Date().toISOString())
    } else if (status === 'used') {
      // Filter for used tokens - this would require a more complex query
      // For now, we'll use a simpler approach
      query = query.gt('usage_count', 0)
    }
    
    const { data: vipAccesses, error: queryError } = await query
    
    if (queryError) {
      console.error('VIP access query error:', queryError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch VIP accesses'
      }, { status: 500 })
    }
    
    // Get statistics
    const { count: totalCount } = await supabase
      .from('vip_access')
      .select('*', { count: 'exact', head: true })
    
    const { count: activeCount } = await supabase
      .from('vip_access')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
    
    const { count: usedCount } = await supabase
      .from('vip_access')
      .select('*', { count: 'exact', head: true })
      .gte('usage_count', 1)
    
    return NextResponse.json({
      success: true,
      data: {
        vipAccesses: vipAccesses || [],
        pagination: {
          limit,
          offset,
          total: totalCount || 0
        },
        statistics: {
          total: totalCount || 0,
          active: activeCount || 0,
          used: usedCount || 0,
          expired: (totalCount || 0) - (activeCount || 0)
        }
      }
    })
    
  } catch (error) {
    console.error('VIP access list error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch VIP access data'
    }, { status: 500 })
  }
}

/**
 * Revoke VIP access (Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-admin-wallet')
    const adminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    // Validate admin authentication
    const adminCheck = await validateAdmin(adminWallet || null, adminKey || null)
    if (!adminCheck.valid) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const { searchParams } = request.nextUrl
    const tokenId = searchParams.get('id')
    const accessToken = searchParams.get('token')
    
    if (!tokenId && !accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Token ID or access token is required'
      }, { status: 400 })
    }
    
    const supabase = createAdminClient()
    
    // Revoke the token
    let query = supabase
      .from('vip_access')
      .update({ active: false })
    
    if (tokenId) {
      query = query.eq('id', tokenId)
    } else {
      query = query.eq('access_token', accessToken)
    }
    
    const { data, error } = await query.select().single()
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Token not found or already revoked'
      }, { status: 404 })
    }
    
    // Log admin action
    await logAdminAction({
      adminWallet: adminWallet!,
      action: 'vip_revoke_success',
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      metadata: { 
        revokedTokenId: data.id,
        targetWallet: data.wallet_address
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'VIP access revoked successfully'
    })
    
  } catch (error) {
    console.error('VIP access revoke error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to revoke VIP access'
    }, { status: 500 })
  }
}

/**
 * Validate admin credentials
 */
async function validateAdmin(
  adminWallet: string | null, 
  adminKey: string | null
): Promise<{ valid: boolean; error?: string }> {
  
  // Check for required credentials
  if (!adminWallet || !adminKey) {
    return { valid: false, error: 'Admin credentials required' }
  }
  
  // Validate wallet address format
  if (!isValidWalletAddress(adminWallet)) {
    return { valid: false, error: 'Invalid admin wallet address' }
  }
  
  // Check admin key (in production, use proper JWT validation)
  const validAdminKey = process.env.ADMIN_API_KEY || process.env.JWT_SECRET
  if (!validAdminKey || adminKey !== validAdminKey) {
    return { valid: false, error: 'Invalid admin key' }
  }
  
  // Additional admin wallet validation (check against whitelist of admin wallets)
  const adminWallets = (process.env.ADMIN_WALLETS || process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(w => w.toLowerCase().trim())
  if (adminWallets.length > 0 && !adminWallets.includes(adminWallet.toLowerCase())) {
    return { valid: false, error: 'Wallet not authorized as admin' }
  }
  
  return { valid: true }
}

/**
 * Check if wallet already has platform access
 */
async function checkExistingAccess(
  walletAddress: string
): Promise<{ hasAccess: boolean; type?: string }> {
  
  try {
    const supabase = createAdminClient()
    
    // Check whitelist
    const { data: whitelistCheck } = await supabase.rpc('is_address_whitelisted', {
      address: walletAddress
    })
    
    if (whitelistCheck === true) {
      return { hasAccess: true, type: 'whitelisted' }
    }
    
    // Check active VIP tokens
    const { data: vipCheck } = await supabase
      .from('vip_access')
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
    
    if (vipCheck && vipCheck.length > 0) {
      return { hasAccess: true, type: 'VIP token' }
    }
    
    return { hasAccess: false }
    
  } catch (error) {
    console.error('Access check error:', error)
    return { hasAccess: false }
  }
}

/**
 * Generate secure VIP access token
 */
function generateVIPToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Validate wallet address format
 */
function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Admin rate limiting check
 */
function checkAdminRateLimit(adminWallet: string): { 
  allowed: boolean; 
  attemptsInWindow: number; 
  resetTime: number 
} {
  const now = Date.now()
  const windowStart = now - ADMIN_RATE_LIMIT_WINDOW
  
  // Clean old entries
  for (const [wallet, data] of adminRateLimit.entries()) {
    if (data.resetTime <= now) {
      adminRateLimit.delete(wallet)
    }
  }
  
  const current = adminRateLimit.get(adminWallet)
  
  if (!current) {
    adminRateLimit.set(adminWallet, { count: 1, resetTime: now + ADMIN_RATE_LIMIT_WINDOW })
    return { allowed: true, attemptsInWindow: 1, resetTime: now + ADMIN_RATE_LIMIT_WINDOW }
  }
  
  if (current.count >= ADMIN_RATE_LIMIT_MAX) {
    return { allowed: false, attemptsInWindow: current.count, resetTime: current.resetTime }
  }
  
  current.count++
  adminRateLimit.set(adminWallet, current)
  
  return { allowed: true, attemptsInWindow: current.count, resetTime: current.resetTime }
}

/**
 * Get client IP address
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
 * Log admin actions for security and audit
 */
async function logAdminAction(params: {
  adminWallet: string
  action: string
  ipAddress: string
  userAgent: string
  success: boolean
  metadata?: any
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    await supabase.rpc('log_access_attempt', {
      p_wallet_address: params.adminWallet,
      p_ip_address: params.ipAddress,
      p_user_agent: params.userAgent,
      p_access_type: params.action,
      p_success: params.success,
      p_route_attempted: '/api/admin/vip-access',
      p_metadata: {
        ...params.metadata,
        timestamp: new Date().toISOString(),
        isAdminAction: true
      }
    })
    
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}