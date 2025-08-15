// Enhanced authentication utilities for Provn platform
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { db } from './database'
import { blockchainUtils } from './blockchain'

export interface AuthUser {
  address: string
  handle?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  isVerified: boolean
  chainId: string
  lastLoginAt?: string
}

export interface AuthSession {
  address: string
  signature: string
  message: string
  timestamp: number
  expiresAt: number
}

export interface JWTPayload {
  address: string
  chainId: string
  isVerified: boolean
  iat: number
  exp: number
}

export interface SignatureVerificationResult {
  isValid: boolean
  address?: string
  error?: string
}

export interface AuthRequest extends NextRequest {
  user?: AuthUser
}

class AuthService {
  private jwtSecret: string
  private jwtExpiresIn: string
  private signatureExpiry: number

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key'
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'
    this.signatureExpiry = 15 * 60 * 1000 // 15 minutes in milliseconds
    
    if (this.jwtSecret === 'fallback-secret-key') {
      console.warn('⚠️ Using fallback JWT secret. Set JWT_SECRET environment variable in production.')
    }
  }

  // Generate authentication message for signing
  generateAuthMessage(address: string, chainId: string = '0x2105'): { message: string; timestamp: number } {
    const timestamp = Date.now()
    const nonce = crypto.randomBytes(16).toString('hex')
    
    const message = `Welcome to Provn!

Sign this message to authenticate your wallet and access the platform.

Wallet: ${address}
Chain ID: ${chainId}
Timestamp: ${timestamp}
Nonce: ${nonce}

This request will not trigger a blockchain transaction or cost any gas fees.`

    return { message, timestamp }
  }

  // Verify wallet signature
  async verifySignature(
    message: string, 
    signature: string, 
    expectedAddress: string,
    timestamp: number
  ): Promise<SignatureVerificationResult> {
    try {
      // Check if signature is not expired
      if (Date.now() - timestamp > this.signatureExpiry) {
        return {
          isValid: false,
          error: 'Signature expired. Please try again.'
        }
      }

      // Verify the signature using blockchain utils
      const isValid = blockchainUtils.verifySignedMessage(message, signature, expectedAddress)
      
      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid signature'
        }
      }

      return {
        isValid: true,
        address: expectedAddress
      }
    } catch (error) {
      console.error('Signature verification failed:', error)
      return {
        isValid: false,
        error: 'Signature verification failed'
      }
    }
  }

  // Create or update user in database
  async createOrUpdateUser(address: string, chainId: string): Promise<AuthUser> {
    try {
      // Check if user exists
      const existingUser = await db.query(`
        SELECT * FROM users WHERE address = $1
      `, [address.toLowerCase()])

      if (existingUser.rows.length > 0) {
        // Update last login
        await db.query(`
          UPDATE users SET last_login_at = NOW() WHERE address = $1
        `, [address.toLowerCase()])

        const user = existingUser.rows[0]
        return {
          address: user.address,
          handle: user.handle,
          displayName: user.display_name,
          bio: user.bio,
          avatarUrl: user.avatar_url,
          isVerified: user.is_verified,
          chainId: user.chain_id,
          lastLoginAt: user.last_login_at
        }
      } else {
        // Create new user
        const result = await db.query(`
          INSERT INTO users (address, chain_id, last_login_at)
          VALUES ($1, $2, NOW())
          RETURNING *
        `, [address.toLowerCase(), chainId])

        const user = result.rows[0]
        return {
          address: user.address,
          handle: user.handle,
          displayName: user.display_name,
          bio: user.bio,
          avatarUrl: user.avatar_url,
          isVerified: user.is_verified,
          chainId: user.chain_id,
          lastLoginAt: user.last_login_at
        }
      }
    } catch (error) {
      console.error('Failed to create/update user:', error)
      throw new Error('Failed to authenticate user')
    }
  }

  // Generate JWT token
  generateJWT(user: AuthUser): string {
    const payload: JWTPayload = {
      address: user.address,
      chainId: user.chainId,
      isVerified: user.isVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(this.jwtExpiresIn)
    }

    return jwt.sign(payload, this.jwtSecret)
  }

  // Verify JWT token
  async verifyJWT(token: string): Promise<{ isValid: boolean; user?: AuthUser; error?: string }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload
      
      // Get fresh user data from database
      const user = await this.getUserByAddress(decoded.address)
      
      if (!user) {
        return {
          isValid: false,
          error: 'User not found'
        }
      }

      return {
        isValid: true,
        user
      }
    } catch (error) {
      console.error('JWT verification failed:', error)
      
      if (error instanceof jwt.TokenExpiredError) {
        return {
          isValid: false,
          error: 'Token expired'
        }
      } else if (error instanceof jwt.JsonWebTokenError) {
        return {
          isValid: false,
          error: 'Invalid token'
        }
      }

      return {
        isValid: false,
        error: 'Token verification failed'
      }
    }
  }

  // Get user by address
  async getUserByAddress(address: string): Promise<AuthUser | null> {
    try {
      const result = await db.query(`
        SELECT * FROM users WHERE address = $1
      `, [address.toLowerCase()])

      if (result.rows.length === 0) {
        return null
      }

      const user = result.rows[0]
      return {
        address: user.address,
        handle: user.handle,
        displayName: user.display_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
        chainId: user.chain_id,
        lastLoginAt: user.last_login_at
      }
    } catch (error) {
      console.error('Failed to get user by address:', error)
      return null
    }
  }

  // Update user profile
  async updateUserProfile(
    address: string, 
    updates: {
      handle?: string
      displayName?: string
      bio?: string
      avatarUrl?: string
    }
  ): Promise<AuthUser | null> {
    try {
      const fields = []
      const values = []
      let paramIndex = 1

      if (updates.handle !== undefined) {
        fields.push(`handle = $${paramIndex++}`)
        values.push(updates.handle)
      }
      if (updates.displayName !== undefined) {
        fields.push(`display_name = $${paramIndex++}`)
        values.push(updates.displayName)
      }
      if (updates.bio !== undefined) {
        fields.push(`bio = $${paramIndex++}`)
        values.push(updates.bio)
      }
      if (updates.avatarUrl !== undefined) {
        fields.push(`avatar_url = $${paramIndex++}`)
        values.push(updates.avatarUrl)
      }

      if (fields.length === 0) {
        return await this.getUserByAddress(address)
      }

      values.push(address.toLowerCase())

      const query = `
        UPDATE users 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE address = $${paramIndex}
        RETURNING *
      `

      const result = await db.query(query, values)
      
      if (result.rows.length === 0) {
        return null
      }

      const user = result.rows[0]
      return {
        address: user.address,
        handle: user.handle,
        displayName: user.display_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
        chainId: user.chain_id,
        lastLoginAt: user.last_login_at
      }
    } catch (error) {
      console.error('Failed to update user profile:', error)
      throw new Error('Failed to update profile')
    }
  }

  // Check if handle is available
  async isHandleAvailable(handle: string, excludeAddress?: string): Promise<boolean> {
    try {
      let query = `SELECT COUNT(*) FROM users WHERE handle = $1`
      const values = [handle.toLowerCase()]

      if (excludeAddress) {
        query += ` AND address != $2`
        values.push(excludeAddress.toLowerCase())
      }

      const result = await db.query(query, values)
      return parseInt(result.rows[0].count) === 0
    } catch (error) {
      console.error('Failed to check handle availability:', error)
      return false
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  }

  // Middleware to authenticate requests
  async authenticateRequest(request: NextRequest): Promise<{ 
    isAuthenticated: boolean 
    user?: AuthUser 
    error?: string 
  }> {
    try {
      const authHeader = request.headers.get('authorization')
      const token = this.extractTokenFromHeader(authHeader)

      if (!token) {
        return {
          isAuthenticated: false,
          error: 'No authentication token provided'
        }
      }

      const verification = await this.verifyJWT(token)
      
      if (!verification.isValid) {
        return {
          isAuthenticated: false,
          error: verification.error
        }
      }

      return {
        isAuthenticated: true,
        user: verification.user
      }
    } catch (error) {
      console.error('Request authentication failed:', error)
      return {
        isAuthenticated: false,
        error: 'Authentication failed'
      }
    }
  }

  // Rate limiting for authentication attempts
  private authAttempts = new Map<string, { count: number; lastAttempt: number }>()
  private maxAuthAttempts = 5
  private authAttemptWindow = 15 * 60 * 1000 // 15 minutes

  checkAuthRateLimit(address: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = address.toLowerCase()
    const attempts = this.authAttempts.get(key)

    if (!attempts || (now - attempts.lastAttempt) > this.authAttemptWindow) {
      // Reset or create new entry
      this.authAttempts.set(key, { count: 1, lastAttempt: now })
      return {
        allowed: true,
        remaining: this.maxAuthAttempts - 1,
        resetTime: now + this.authAttemptWindow
      }
    }

    if (attempts.count >= this.maxAuthAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: attempts.lastAttempt + this.authAttemptWindow
      }
    }

    // Increment attempts
    attempts.count += 1
    attempts.lastAttempt = now
    this.authAttempts.set(key, attempts)

    return {
      allowed: true,
      remaining: this.maxAuthAttempts - attempts.count,
      resetTime: attempts.lastAttempt + this.authAttemptWindow
    }
  }

  // Clean up expired rate limit entries
  cleanupRateLimitEntries(): void {
    const now = Date.now()
    for (const [key, attempts] of this.authAttempts.entries()) {
      if ((now - attempts.lastAttempt) > this.authAttemptWindow) {
        this.authAttempts.delete(key)
      }
    }
  }

  // Helper to parse JWT expires in string
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) {
      return 7 * 24 * 60 * 60 // Default to 7 days
    }

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 60 * 60
      case 'd': return value * 24 * 60 * 60
      default: return 7 * 24 * 60 * 60
    }
  }

  // Validate Ethereum address format
  isValidAddress(address: string): boolean {
    return blockchainUtils.isValidAddress(address)
  }

  // Health check for auth service
  async healthCheck(): Promise<{ status: string; database: boolean; jwt: boolean }> {
    try {
      // Test database connection
      const dbTest = await db.query('SELECT 1')
      const databaseOk = dbTest.rows.length > 0

      // Test JWT functionality
      const testPayload = { test: true, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 }
      const testToken = jwt.sign(testPayload, this.jwtSecret)
      const jwtOk = !!jwt.verify(testToken, this.jwtSecret)

      return {
        status: databaseOk && jwtOk ? 'healthy' : 'degraded',
        database: databaseOk,
        jwt: jwtOk
      }
    } catch (error) {
      console.error('Auth service health check failed:', error)
      return {
        status: 'unhealthy',
        database: false,
        jwt: false
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export utility functions
export const authUtils = {
  // Validate Ethereum address format
  isValidAddress: (address: string): boolean => {
    return blockchainUtils.isValidAddress(address)
  },

  // Normalize address to lowercase
  normalizeAddress: (address: string): string => {
    return address.toLowerCase()
  },

  // Generate secure random string
  generateNonce: (length: number = 32): string => {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
  },

  // Hash sensitive data
  hashData: (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex')
  },

  // Validate handle format
  isValidHandle: (handle: string): boolean => {
    const handleRegex = /^[a-zA-Z0-9_]{3,20}$/
    return handleRegex.test(handle)
  },

  // Sanitize user input
  sanitizeString: (input: string, maxLength: number = 255): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, maxLength)
  }
}

// Clean up rate limit entries every hour
setInterval(() => {
  authService.cleanupRateLimitEntries()
}, 60 * 60 * 1000)