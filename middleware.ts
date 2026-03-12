import { NextRequest, NextResponse } from 'next/server'

/**
 * Provn Middleware - Public Access
 *
 * All routes are publicly accessible. No whitelist gating.
 * Wallet connection is still used for authenticated features (upload, profile, etc.)
 * but is not required to browse the platform.
 */

export async function middleware(request: NextRequest) {
  // Allow all requests through - no whitelist gating
  return NextResponse.next();
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