"use client"

import React from 'react'
import { AuthGuard } from './AuthGuard'
import { ProfileGuard } from './ProfileGuard'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireProfile?: boolean
  authFallback?: React.ReactNode
  profileFallback?: React.ReactNode
  authMessage?: string
  profileMessage?: string
}

/**
 * ProtectedRoute component that handles both authentication and profile requirements
 * This creates a seamless onboarding flow: 
 * 1. First, user must connect wallet (if requireAuth=true)
 * 2. Then, user must create profile (if requireProfile=true)
 * 3. Finally, they can access the protected content
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireProfile = true,
  authFallback,
  profileFallback,
  authMessage,
  profileMessage
}: ProtectedRouteProps) {
  
  // If no authentication is required, just render children
  if (!requireAuth && !requireProfile) {
    return <>{children}</>
  }

  // If only profile is required (assumes auth is already done)
  if (!requireAuth && requireProfile) {
    return (
      <ProfileGuard fallback={profileFallback} message={profileMessage}>
        {children}
      </ProfileGuard>
    )
  }

  // If only auth is required
  if (requireAuth && !requireProfile) {
    return (
      <AuthGuard fallback={authFallback} message={authMessage}>
        {children}
      </AuthGuard>
    )
  }

  // If both auth and profile are required (most common case)
  return (
    <AuthGuard fallback={authFallback} message={authMessage}>
      <ProfileGuard fallback={profileFallback} message={profileMessage}>
        {children}
      </ProfileGuard>
    </AuthGuard>
  )
}

/**
 * Convenience wrapper for routes that require both wallet connection and profile
 */
export function FullyProtectedRoute({
  children,
  authMessage = "Connect your wallet to access this feature and start creating amazing content on Provn.",
  profileMessage = "Create your profile to unlock all features and start building your creator presence on Provn."
}: {
  children: React.ReactNode
  authMessage?: string
  profileMessage?: string
}) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requireProfile={true}
      authMessage={authMessage}
      profileMessage={profileMessage}
    >
      {children}
    </ProtectedRoute>
  )
}

/**
 * Convenience wrapper for routes that only require wallet connection
 */
export function AuthOnlyRoute({
  children,
  message = "Connect your wallet to access this feature."
}: {
  children: React.ReactNode
  message?: string
}) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requireProfile={false}
      authMessage={message}
    >
      {children}
    </ProtectedRoute>
  )
}