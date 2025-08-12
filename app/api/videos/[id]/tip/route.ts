import { type NextRequest, NextResponse } from "next/server"

interface TipRequest {
  amount: number
  message?: string
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { amount, message }: TipRequest = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid tip amount" }, { status: 400 })
    }

    // In real implementation:
    // 1. Verify user has sufficient balance
    // 2. Create blockchain transaction
    // 3. Transfer tokens to creator
    // 4. Record transaction in database
    // 5. Update video stats
    // 6. Send notification to creator

    const mockTransaction = {
      id: `tip_${Date.now()}`,
      videoId: id,
      amount,
      message,
      from: "0x9876543210fedcba9876543210fedcba98765432",
      to: "0x1234567890abcdef1234567890abcdef12345678",
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 12000000,
      timestamp: new Date().toISOString(),
      status: "confirmed",
    }

    return NextResponse.json({
      success: true,
      transaction: mockTransaction,
      message: "Tip sent successfully",
    })
  } catch (error) {
    console.error("Tip error:", error)
    return NextResponse.json({ error: "Failed to send tip" }, { status: 500 })
  }
}
