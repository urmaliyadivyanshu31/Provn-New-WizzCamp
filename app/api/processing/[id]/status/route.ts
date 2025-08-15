import { type NextRequest, NextResponse } from "next/server"
import { videoProcessingService } from "@/lib/processing"
import { authService } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get wallet address from header
    const walletAddress = request.headers.get('X-Wallet-Address')
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 })
    }

    // Get job status from video processing service
    const jobStatus = await videoProcessingService.getJobStatus(id)
    
    if (!jobStatus) {
      return NextResponse.json({ error: "Processing job not found" }, { status: 404 })
    }

    // Verify user can only view their own job status
    if (jobStatus.userAddress !== walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Format the response
    const formattedStatus = {
      processingId: id,
      status: jobStatus.status,
      progress: jobStatus.progress,
      currentStep: jobStatus.currentStep,
      steps: jobStatus.steps,
      result: jobStatus.result,
      errorMessage: jobStatus.errorMessage
    }

    return NextResponse.json(formattedStatus)
  } catch (error) {
    console.error("Error fetching processing status:", error)
    return NextResponse.json({ error: "Failed to fetch processing status" }, { status: 500 })
  }
}

// Helper function to determine step status
function getStepStatus(step: string, jobStatus: any): 'pending' | 'processing' | 'completed' | 'error' {
  if (jobStatus.status === 'failed') {
    return 'error'
  }
  
  if (jobStatus.status === 'completed') {
    return 'completed'
  }

  if (jobStatus.currentStep === step) {
    return 'processing'
  }

  const stepIndex = jobStatus.steps.indexOf(step)
  const currentStepIndex = jobStatus.steps.indexOf(jobStatus.currentStep)
  
  if (stepIndex < currentStepIndex) {
    return 'completed'
  }
  
  return 'pending'
}

// Helper function to determine step progress
function getStepProgress(step: string, jobStatus: any): number {
  if (getStepStatus(step, jobStatus) === 'completed') {
    return 100
  }
  
  if (getStepStatus(step, jobStatus) === 'error') {
    return 0
  }
  
  if (jobStatus.currentStep === step) {
    return jobStatus.progress
  }
  
  return 0
}

// Helper function to get step completion time
function getStepCompletedAt(step: string, jobStatus: any): string | undefined {
  if (getStepStatus(step, jobStatus) === 'completed') {
    // For completed steps, estimate completion time based on current progress
    const now = new Date().toISOString()
    return now
  }
  
  return undefined
}
