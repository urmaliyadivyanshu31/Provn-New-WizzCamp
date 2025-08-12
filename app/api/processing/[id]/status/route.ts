import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Mock processing status - in real app would check job queue
    const mockStatus = {
      processingId: id,
      status: "completed",
      progress: 100,
      currentStep: "minting",
      steps: [
        { id: "validation", status: "completed", progress: 100, completedAt: "2024-01-16T10:00:00Z" },
        { id: "transcoding", status: "completed", progress: 100, completedAt: "2024-01-16T10:02:00Z" },
        { id: "ipfs", status: "completed", progress: 100, completedAt: "2024-01-16T10:04:00Z" },
        { id: "hashing", status: "completed", progress: 100, completedAt: "2024-01-16T10:05:00Z" },
        { id: "duplicate", status: "completed", progress: 100, completedAt: "2024-01-16T10:06:00Z" },
        { id: "minting", status: "completed", progress: 100, completedAt: "2024-01-16T10:08:00Z" },
      ],
      result: {
        tokenId: `${Date.now()}`,
        ipfsHash: `Qm${Math.random().toString(36).substring(2, 15)}`,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        blockscoutUrl: `https://explorer.basecamp.network/tx/0x${Math.random().toString(16).substring(2, 66)}`,
      },
      completedAt: "2024-01-16T10:08:00Z",
      totalTime: "8 minutes",
    }

    return NextResponse.json(mockStatus)
  } catch (error) {
    console.error("Processing status error:", error)
    return NextResponse.json({ error: "Processing status not found" }, { status: 404 })
  }
}
