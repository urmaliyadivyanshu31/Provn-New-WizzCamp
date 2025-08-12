import { type NextRequest, NextResponse } from "next/server"

interface DisputeRequest {
  targetTokenId: string
  reason: "duplicate" | "infringement" | "inappropriate" | "other"
  description: string
  contactEmail: string
  evidenceFiles?: string[] // File URLs after upload
}

export async function POST(request: NextRequest) {
  try {
    const disputeData: DisputeRequest = await request.json()

    if (!disputeData.targetTokenId || !disputeData.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In real implementation:
    // 1. Validate target token exists
    // 2. Store dispute in database
    // 3. Upload evidence files to secure storage
    // 4. Notify moderation team
    // 5. Send confirmation email to reporter

    const mockDispute = {
      id: `dispute_${Date.now()}`,
      targetTokenId: disputeData.targetTokenId,
      reason: disputeData.reason,
      description: disputeData.description,
      contactEmail: disputeData.contactEmail,
      reporter: "0x9876543210fedcba9876543210fedcba98765432",
      status: "pending",
      priority: disputeData.reason === "infringement" ? "high" : "normal",
      createdAt: new Date().toISOString(),
      estimatedReviewTime: "24-48 hours",
      caseNumber: `CASE-${Date.now().toString().slice(-6)}`,
    }

    // Mock notification to moderation team
    console.log("New dispute filed:", mockDispute)

    return NextResponse.json({
      success: true,
      dispute: mockDispute,
      message: "Dispute submitted successfully",
    })
  } catch (error) {
    console.error("Dispute submission error:", error)
    return NextResponse.json({ error: "Failed to submit dispute" }, { status: 500 })
  }
}
