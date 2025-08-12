import { type NextRequest, NextResponse } from "next/server"

interface ProfileUpdateRequest {
  handle?: string
  displayName?: string
  bio?: string
  avatar?: string
}

export async function GET(request: NextRequest, { params }: { params: { address: string } }) {
  try {
    const { address } = params

    // Mock profile data - in real app would fetch from database
    const mockProfile = {
      address: address.toLowerCase(),
      handle: "creativedancer",
      displayName: "Creative Dancer",
      bio: "Digital creator exploring the intersection of movement and technology. Passionate about on-chain provenance and creative ownership.",
      avatar: "/placeholder.svg?key=profile",
      joinedDate: "2024-01-01T00:00:00Z",
      isVerified: true,
      stats: {
        totalVideos: 4,
        totalViews: 4240,
        totalEarnings: 167.5,
        totalTips: 85,
        totalLicenses: 9,
        followers: 1250,
        following: 340,
      },
      socialLinks: {
        twitter: "@creativedancer",
        instagram: "@creativedancer",
      },
    }

    return NextResponse.json(mockProfile)
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { address: string } }) {
  try {
    const { address } = params
    const updates: ProfileUpdateRequest = await request.json()

    // In real implementation:
    // 1. Verify user owns this address
    // 2. Validate handle uniqueness
    // 3. Update profile in database
    // 4. Handle avatar upload if provided

    const updatedProfile = {
      address: address.toLowerCase(),
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
