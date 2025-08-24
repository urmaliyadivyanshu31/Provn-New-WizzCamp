import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

interface WalletAuthRequest {
  walletAddress: string
}

interface WalletAuthResponse {
  success: boolean
  hasAccess: boolean
  isAdmin: boolean
  accessType?: 'authorized' | 'whitelisted' | 'vip' | 'none'
  message?: string
  error?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  try {
    console.log('🔐 Wallet authentication request received')
    
    let body: WalletAuthRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({
        success: false,
        hasAccess: false,
        isAdmin: false,
        error: 'Invalid request format'
      } as WalletAuthResponse, { status: 400 })
    }
    
    const { walletAddress } = body
    
    // Validate wallet address format
    if (!walletAddress || !isValidWalletAddress(walletAddress)) {
      return NextResponse.json({
        success: false,
        hasAccess: false,
        isAdmin: false,
        error: 'Valid wallet address is required'
      } as WalletAuthResponse, { status: 400 })
    }
    
    const normalizedWallet = walletAddress.toLowerCase()
    
    console.log('🔍 Checking wallet access:', normalizedWallet)
    
    // Check if wallet is in authorized whitelist
    const authorizedWallets = (process.env.NEXT_PUBLIC_WHITELIST_WALLETS || '')
      .split(',')
      .map(addr => addr.toLowerCase().trim())
      .filter(addr => addr.length > 0)
    
    // Check if wallet is admin
    const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '')
      .split(',')
      .map(addr => addr.toLowerCase().trim())
      .filter(addr => addr.length > 0)
    
    const isAuthorizedWallet = authorizedWallets.includes(normalizedWallet)
    const isAdminWallet = adminWallets.includes(normalizedWallet)
    
    let hasAccess = false
    let accessType: 'authorized' | 'whitelisted' | 'vip' | 'none' = 'none'
    
    if (isAuthorizedWallet) {
      hasAccess = true
      accessType = 'authorized'
      
      // Automatically add to database whitelist if not already there
      await ensureWalletInDatabase(normalizedWallet)
      
      console.log('✅ Authorized wallet detected:', normalizedWallet)
    } else {
      // Check VIP access first
      const isVipWallet = await checkVipAccess(normalizedWallet)
      if (isVipWallet) {
        hasAccess = true
        accessType = 'vip'
        console.log('✅ VIP access wallet:', normalizedWallet)
      } else {
        // Check if wallet is already in database whitelist
        const isInDatabase = await checkDatabaseWhitelist(normalizedWallet)
        if (isInDatabase) {
          hasAccess = true
          accessType = 'whitelisted'
          console.log('✅ Database whitelisted wallet:', normalizedWallet)
        } else {
          console.log('❌ Wallet not authorized:', normalizedWallet)
        }
      }
    }
    
    // Log the access attempt
    await logAccessAttempt({
      walletAddress: normalizedWallet,
      ipAddress: clientIP,
      userAgent,
      accessType: hasAccess ? 'wallet_auth_success' : 'wallet_auth_denied',
      success: hasAccess,
      routeAttempted: '/api/whitelist/wallet-auth',
      metadata: {
        isAuthorizedWallet,
        isAdminWallet,
        accessType,
        processingTime: Date.now() - startTime
      }
    })
    
    const response: WalletAuthResponse = {
      success: true,
      hasAccess,
      isAdmin: isAdminWallet,
      accessType,
      message: hasAccess 
        ? isAuthorizedWallet 
          ? 'Welcome! You have authorized access to the platform.'
          : accessType === 'vip' 
            ? 'Welcome! You have VIP access to the platform.'
            : 'Welcome back! Your wallet is whitelisted.'
        : 'This wallet does not have platform access. Please submit a whitelist request.'
    }
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error) {
    console.error('❌ Wallet auth error:', error)
    
    await logAccessAttempt({
      walletAddress: null,
      ipAddress: clientIP,
      userAgent,
      accessType: 'wallet_auth_error',
      success: false,
      routeAttempted: '/api/whitelist/wallet-auth',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
    })
    
    return NextResponse.json({
      success: false,
      hasAccess: false,
      isAdmin: false,
      error: 'Authentication check failed. Please try again.'
    } as WalletAuthResponse, { status: 500 })
  }
}

/**
 * Ensure wallet is in database whitelist
 */
async function ensureWalletInDatabase(walletAddress: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    // Check if wallet already exists
    const { data: existing } = await supabase.rpc('is_address_whitelisted', {
      address: walletAddress
    })
    
    if (existing === true) {
      console.log('💾 Wallet already in database:', walletAddress)
      return
    }
    
    // Add wallet to whitelist_addresses table
    const { error } = await supabase
      .from('whitelist_addresses')
      .insert([{
        wallet_address: walletAddress,
        added_by: 'system_authorized',
        active: true,
        notes: 'Automatically added - authorized wallet'
      }])
    
    if (error) {
      console.error('❌ Failed to add wallet to database:', error)
    } else {
      console.log('✅ Wallet added to database whitelist:', walletAddress)
    }
    
  } catch (error) {
    console.error('❌ Database whitelist error:', error)
  }
}

/**
 * Check if wallet has VIP access
 */
async function checkVipAccess(walletAddress: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    
    // Check for active VIP access that hasn't expired
    const { data: vipAccess, error } = await supabase
      .from('vip_access')
      .select('id, expires_at, max_usage, usage_count')
      .eq('wallet_address', walletAddress)
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('VIP access check error:', error)
      return false
    }
    
    if (vipAccess && vipAccess.length > 0) {
      const access = vipAccess[0]
      // Check if usage limit exceeded (if there's a limit)
      if (access.max_usage && access.usage_count >= access.max_usage) {
        console.log('❌ VIP access usage limit exceeded for wallet:', walletAddress)
        return false
      }
      
      console.log('✅ Found valid VIP access for wallet:', walletAddress)
      return true
    }
    
    return false
    
  } catch (error) {
    console.error('VIP access error:', error)
    return false
  }
}

/**
 * Check if wallet is in database whitelist
 */
async function checkDatabaseWhitelist(walletAddress: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    
    // First check the beta_whitelist table for approved entries
    const { data: betaWhitelist, error: betaError } = await supabase
      .from('beta_whitelist')
      .select('id, status')
      .eq('wallet_address', walletAddress)
      .eq('status', 'approved')
      .limit(1)
    
    if (betaError) {
      console.error('Beta whitelist check error:', betaError)
    } else if (betaWhitelist && betaWhitelist.length > 0) {
      console.log('✅ Found approved beta whitelist entry for wallet:', walletAddress)
      return true
    }
    
    // Fallback to RPC function check (for whitelist_addresses table)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('is_address_whitelisted', {
      address: walletAddress
    })
    
    if (rpcError) {
      console.error('RPC whitelist check error:', rpcError)
      return false
    }
    
    if (rpcResult === true) {
      console.log('✅ Found whitelisted address via RPC for wallet:', walletAddress)
      return true
    }
    
    console.log('❌ Wallet not found in any whitelist:', walletAddress)
    return false
    
  } catch (error) {
    console.error('Database whitelist error:', error)
    return false
  }
}

/**
 * Validate wallet address format
 */
function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
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
 * Log access attempts for security monitoring
 */
async function logAccessAttempt(params: {
  walletAddress: string | null
  ipAddress: string
  userAgent: string
  accessType: string
  success: boolean
  routeAttempted: string
  metadata?: any
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    await supabase.rpc('log_access_attempt', {
      p_wallet_address: params.walletAddress,
      p_ip_address: params.ipAddress,
      p_user_agent: params.userAgent,
      p_access_type: params.accessType,
      p_success: params.success,
      p_route_attempted: params.routeAttempted,
      p_metadata: params.metadata || {}
    })
    
  } catch (error) {
    console.error('Failed to log access attempt:', error)
  }
}