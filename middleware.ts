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
  '/api/whitelist',
  '/api/auth/x',    // Twitter OAuth endpoints
  '/api/health',
  '/api/admin', // Admin routes are public but have their own auth
  '/admin',
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
 * Check if wallet address is whitelisted (simplified)
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
    
    // Then check database
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.rpc('is_address_whitelisted', {
      address: walletAddress
    });
    
    if (error) {
      console.error('Whitelist database error:', error);
      return false;
    }
    
    return data === true;
    
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