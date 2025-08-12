import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Mock video data - in real app would fetch from database
    const mockVideo = {
      id,
      title: "Creative Dance Routine",
      description: "An original dance routine showcasing contemporary moves with urban influences.",
      creator: "0x1234567890abcdef1234567890abcdef12345678",
      ipnftId: "#123",
      tags: ["dance", "creative", "original", "urban"],
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z",
      status: "minted",
      views: 1250,
      tips: 25,
      licenses: 3,
      earnings: 47.5,
      parentTokenId: null,
      derivatives: ["2", "3"],
      ipfsHash: "QmExampleHash123",
      transactionHash: "0xabcdef123456789",
      blockNumber: 12345678,
      contractAddress: "0xcontract123456789",
      metadata: {
        duration: 30,
        resolution: "1080p",
        format: "mp4",
        size: 15728640, // bytes
      },
    }

    return NextResponse.json(mockVideo)
  } catch (error) {
    console.error("Get video error:", error)
    return NextResponse.json({ error: "Video not found" }, { status: 404 })
  }
}
