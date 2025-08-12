import { type NextRequest, NextResponse } from "next/server"

interface UploadRequest {
  title: string
  description?: string
  tags: string[]
  allowRemixing: boolean
  parentTokenId?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File
    const metadata = JSON.parse(formData.get("metadata") as string) as UploadRequest

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    // Validate file
    const maxSize = 150 * 1024 * 1024 // 150MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const allowedTypes = ["video/mp4", "video/quicktime"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Start processing pipeline
    const processingId = `proc_${Date.now()}`

    // In real implementation:
    // 1. Upload to temporary storage
    // 2. Start transcoding job
    // 3. Generate perceptual hash
    // 4. Check for duplicates
    // 5. Upload to IPFS
    // 6. Mint IpNFT on blockchain

    const mockResponse = {
      processingId,
      status: "processing",
      steps: [
        { id: "validation", status: "completed" },
        { id: "transcoding", status: "processing" },
        { id: "ipfs", status: "pending" },
        { id: "hashing", status: "pending" },
        { id: "duplicate", status: "pending" },
        { id: "minting", status: "pending" },
      ],
      estimatedTime: "5-10 minutes",
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
