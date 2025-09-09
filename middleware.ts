import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Simple Provn Whitelist Middleware
 * 
 * Simple flow: Check wallet address → If whitelisted, allow access → If not, redirect to whitelist
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/whitelist',
  '/about',
  '/privacy',
  '/api/whitelist',
  '/api/auth/x',    // Twitter OAuth endpoints
  '/api/health',
  '/api/admin', // Admin routes are public but have their own auth
  '/admin',
  '/api/profile', // Profile API routes need to be public for video display
  '/api/explore', // Explore API routes for video content
  '/api/leaderboards', // Leaderboard API routes
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

interface WhitelistCheckResult {
  isWhitelisted: boolean;
  walletAddress?: string;
  error?: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {
    // Skip middleware for public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }
    
    // Simple check: Get wallet address from cookie or header
    const walletAddress = getWalletFromRequest(request);
    
    if (!walletAddress) {
      console.log('🔒 No wallet address found, redirecting to whitelist');
      return redirectToWhitelist(request, 'Please connect your wallet');
    }
    
    // Check if wallet is whitelisted
    const isWhitelisted = await checkWhitelistDatabase(walletAddress);
    
    if (isWhitelisted) {
      // Allow access
      console.log('✅ Wallet is whitelisted:', walletAddress);
      return NextResponse.next();
    } else {
      console.log('❌ Wallet not whitelisted:', walletAddress);
      return redirectToWhitelist(request, 'Wallet not whitelisted');
    }
    
  } catch (error) {
    console.error('🚨 Middleware Error:', error);
    return redirectToWhitelist(request, 'System error');
  }
}

/**
 * Get wallet address from request (simplified)
 */
function getWalletFromRequest(request: NextRequest): string | null {
  // Check cookies first (most reliable)
  const walletCookie = request.cookies.get('wallet_address')?.value;
  if (walletCookie && isValidWalletAddress(walletCookie)) {
    return walletCookie.toLowerCase();
  }
  
  // Check header as backup
  const headerWallet = request.headers.get('x-wallet-address');
  if (headerWallet && isValidWalletAddress(headerWallet)) {
    return headerWallet.toLowerCase();
  }
  
  return null;
}

/**
 * Check if wallet address is whitelisted (fixed to check beta_whitelist)
 */
async function checkWhitelistDatabase(walletAddress: string): Promise<boolean> {
  try {
    // First check authorized wallets from environment
    const authorizedWallets = (process.env.NEXT_PUBLIC_WHITELIST_WALLETS || '')
      .split(',')
      .map(addr => addr.toLowerCase().trim())
      .filter(addr => addr.length > 0);
    
    if (authorizedWallets.includes(walletAddress.toLowerCase())) {
      return true;
    }
    
    // Check admin wallets
    const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '')
      .split(',')
      .map(addr => addr.toLowerCase().trim())
      .filter(addr => addr.length > 0);
    
    if (adminWallets.includes(walletAddress.toLowerCase())) {
      return true;
    }
    
    const supabase = createSupabaseClient();
    
    // Check VIP access first
    const { data: vipAccess, error: vipError } = await supabase
      .from('vip_access')
      .select('id, expires_at, max_usage, usage_count')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (vipError) {
      console.error('VIP access database error:', vipError);
    } else if (vipAccess && vipAccess.length > 0) {
      const access = vipAccess[0];
      // Check if usage limit exceeded (if there's a limit)
      if (!access.max_usage || access.usage_count < access.max_usage) {
        console.log('✅ Found valid VIP access in middleware for wallet:', walletAddress);
        return true;
      }
    }
    
    // Then check beta_whitelist table for approved entries
    const { data: betaWhitelist, error: betaError } = await supabase
      .from('beta_whitelist')
      .select('id, status')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('status', 'approved')
      .limit(1);
    
    if (betaError) {
      console.error('Beta whitelist database error:', betaError);
    } else if (betaWhitelist && betaWhitelist.length > 0) {
      console.log('✅ Found approved beta whitelist entry in middleware for wallet:', walletAddress);
      return true;
    }
    
    // Fallback to RPC function check (for whitelist_addresses table)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('is_address_whitelisted', {
      address: walletAddress
    });
    
    if (rpcError) {
      console.error('RPC whitelist database error:', rpcError);
      return false;
    }
    
    if (rpcResult === true) {
      console.log('✅ Found whitelisted address via RPC in middleware for wallet:', walletAddress);
      return true;
    }
    
    console.log('❌ Wallet not found in any whitelist in middleware:', walletAddress);
    return false;
    
  } catch (error) {
    console.error('Whitelist check error:', error);
    return false;
  }
}


/**
 * Redirect unauthorized users to whitelist page
 */
function redirectToWhitelist(request: NextRequest, reason?: string): NextResponse {
  const whitelistUrl = new URL('/whitelist', request.url);
  
  if (reason) {
    whitelistUrl.searchParams.set('reason', reason);
  }
  
  return NextResponse.redirect(whitelistUrl);
}

/**
 * Check if a route is public and doesn't need authentication
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Validate wallet address format
 */
function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Create Supabase client for middleware operations
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

/**
 * Middleware configuration
 * Defines which routes the middleware should run on
 */
export const config = {
  // Match all routes except Next.js internals and static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
}