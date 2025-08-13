import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, signature, message, timestamp, chainId } = body

    // Validate required fields
    if (!address || !signature || !message || !timestamp || !chainId) {
      return NextResponse.json({ 
        error: "Missing required fields: address, signature, message, timestamp, chainId" 
      }, { status: 400 })
    }

    // Validate address format
    if (!authService.isValidAddress(address)) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 })
    }

    // Check rate limiting
    const rateLimit = authService.checkAuthRateLimit(address)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: "Too many authentication attempts. Please try again later.",
        resetTime: rateLimit.resetTime
      }, { status: 429 })
    }

    // Verify signature
    const verificationResult = await authService.verifySignature(
      message,
      signature,
      address,
      timestamp
    )

    if (!verificationResult.isValid) {
      return NextResponse.json({ 
        error: "Signature verification failed",
        details: verificationResult.error
      }, { status: 401 })
    }

    // Create or update user
    const user = await authService.createOrUpdateUser(address, chainId)

    // Generate JWT token
    const token = authService.generateJWT(user)

    return NextResponse.json({
      message: "Authentication successful",
      user: {
        address: user.address,
        handle: user.handle,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        chainId: user.chainId
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })
  } catch (error) {
    console.error("Wallet authentication error:", error)
    return NextResponse.json({ 
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const chainId = searchParams.get('chainId') || '0x2105'

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    // Validate address format
    if (!authService.isValidAddress(address)) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 })
    }

    // Generate authentication message
    const authMessage = authService.generateAuthMessage(address, chainId)

    return NextResponse.json({
      message: authMessage.message,
      timestamp: authMessage.timestamp,
      chainId,
      address
    })
  } catch (error) {
    console.error("Auth message generation error:", error)
    return NextResponse.json({ error: "Failed to generate auth message" }, { status: 500 })
  }
}
