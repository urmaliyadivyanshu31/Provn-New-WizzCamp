"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"

interface UploadedFile {
  file: File
  preview: string
}

interface ProcessingStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  message?: string
}

interface MintResult {
  tokenId: string
  ipfsHash: string
  transactionHash: string
  blockscoutUrl: string
}

export default function UploadPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState("")
  const [allowRemixing, setAllowRemixing] = useState(true) // Default to true as per spec
  const [isProcessing, setIsProcessing] = useState(false)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "validation", name: "File Validation", status: "pending", progress: 0 },
    { id: "transcoding", name: "Transcoding to HLS", status: "pending", progress: 0 },
    { id: "ipfs", name: "Uploading to IPFS", status: "pending", progress: 0 },
    { id: "hashing", name: "Perceptual Hashing", status: "pending", progress: 0 },
    { id: "duplicate", name: "Duplicate Check", status: "pending", progress: 0 },
    { id: "minting", name: "Minting IpNFT", status: "pending", progress: 0 },
  ])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const maxSize = 150 * 1024 * 1024 // 150MB
    const allowedTypes = ["video/mp4", "video/quicktime"]

    if (!allowedTypes.includes(file.type)) {
      return "Please upload MP4 or MOV files only"
    }

    if (file.size > maxSize) {
      return "File size must be under 150MB"
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      alert(error)
      return
    }

    const preview = URL.createObjectURL(file)
    setUploadedFile({ file, preview })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const updateProcessingStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setProcessingSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step)))
  }

  const simulateProcessingStep = async (stepId: string, duration = 2000) => {
    updateProcessingStep(stepId, { status: "processing", progress: 0 })

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProcessingSteps((prev) =>
        prev.map((step) => {
          if (step.id === stepId && step.status === "processing") {
            const newProgress = Math.min(step.progress + Math.random() * 20, 95)
            return { ...step, progress: newProgress }
          }
          return step
        }),
      )
    }, 200)

    await new Promise((resolve) => setTimeout(resolve, duration))
    clearInterval(progressInterval)
    updateProcessingStep(stepId, { status: "completed", progress: 100 })
  }

  const handleUpload = async () => {
    if (!uploadedFile || !title.trim()) {
      alert("Please provide a file and title")
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: File Validation
      await simulateProcessingStep("validation", 500)

      // Step 2: Transcoding to HLS
      updateProcessingStep("transcoding", {
        status: "processing",
        message: "Converting to HLS format for optimal streaming...",
      })
      await simulateProcessingStep("transcoding", 3000)

      // Step 3: IPFS Upload
      updateProcessingStep("ipfs", {
        status: "processing",
        message: "Uploading to decentralized storage...",
      })
      await simulateProcessingStep("ipfs", 2500)

      // Step 4: Perceptual Hashing
      updateProcessingStep("hashing", {
        status: "processing",
        message: "Generating content fingerprint...",
      })
      await simulateProcessingStep("hashing", 1500)

      // Step 5: Duplicate Check
      updateProcessingStep("duplicate", {
        status: "processing",
        message: "Checking for existing content...",
      })
      await simulateProcessingStep("duplicate", 1000)

      // Simulate potential duplicate found (10% chance)
      if (Math.random() < 0.1) {
        updateProcessingStep("duplicate", {
          status: "error",
          message: "Similar content found. Please review before proceeding.",
        })
        setIsProcessing(false)
        return
      }

      // Step 6: Minting
      updateProcessingStep("minting", {
        status: "processing",
        message: "Minting your IpNFT on BaseCAMP...",
      })
      await simulateProcessingStep("minting", 2000)

      // Success - generate mock result
      const mockResult: MintResult = {
        tokenId: `${Date.now()}`,
        ipfsHash: `Qm${Math.random().toString(36).substring(2, 15)}`,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        blockscoutUrl: `https://explorer.basecamp.network/tx/0x${Math.random().toString(16).substring(2, 66)}`,
      }

      setMintResult(mockResult)
    } catch (error) {
      console.error("Upload failed:", error)
      // Mark current processing step as error
      const currentStep = processingSteps.find((step) => step.status === "processing")
      if (currentStep) {
        updateProcessingStep(currentStep.id, {
          status: "error",
          message: "Processing failed. Please try again.",
        })
      }
    }

    setIsProcessing(false)
  }

  const handleCancel = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview)
    }
    router.push("/")
  }

  const handleViewAsset = () => {
    if (mintResult) {
      router.push(`/video/${mintResult.tokenId}`)
    }
  }

  if (mintResult) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="upload" />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-8">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <div className="space-y-4">
              <h1 className="font-headline text-4xl font-bold text-provn-text">Upload Successful!</h1>
              <p className="text-provn-muted text-lg">Your video has been registered as an IpNFT on BaseCAMP</p>
            </div>

            {/* Provenance Badge */}
            <div className="flex justify-center">
              <ProvnBadge variant="success" className="text-base px-4 py-2">
                ✓ Provenance Verified
              </ProvnBadge>
            </div>

            {/* Transaction Details */}
            <ProvnCard>
              <ProvnCardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-provn-muted">Token ID:</span>
                    <span className="text-provn-text font-mono">{mintResult.tokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-provn-muted">IPFS Hash:</span>
                    <span className="text-provn-text font-mono text-xs">{mintResult.ipfsHash}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-provn-muted">Transaction:</span>
                    <a
                      href={mintResult.blockscoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-provn-accent hover:underline font-mono text-xs"
                    >
                      View on Blockscout ↗
                    </a>
                  </div>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <ProvnButton variant="secondary" onClick={() => router.push("/upload")}>
                Upload Another
              </ProvnButton>
              <ProvnButton onClick={handleViewAsset}>View Asset</ProvnButton>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation currentPage="upload" />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-8">
            {/* Processing Header */}
            <div className="text-center space-y-4">
              <h1 className="font-headline text-4xl font-bold text-provn-text">Processing Upload</h1>
              <p className="text-provn-muted text-lg">Please wait while we prepare your content for the blockchain</p>
            </div>

            {/* Processing Steps */}
            <ProvnCard>
              <ProvnCardContent className="p-8">
                <div className="space-y-6">
                  {processingSteps.map((step, index) => (
                    <div key={step.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {step.status === "completed" ? (
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : step.status === "processing" ? (
                            <div className="w-6 h-6 border-2 border-provn-accent border-t-transparent rounded-full animate-spin"></div>
                          ) : step.status === "error" ? (
                            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-provn-border rounded-full"></div>
                          )}
                          <span
                            className={`font-medium ${
                              step.status === "completed"
                                ? "text-green-400"
                                : step.status === "processing"
                                  ? "text-provn-accent"
                                  : step.status === "error"
                                    ? "text-red-400"
                                    : "text-provn-muted"
                            }`}
                          >
                            {step.name}
                          </span>
                        </div>
                        {step.status === "processing" && (
                          <span className="text-provn-accent text-sm font-medium">{Math.round(step.progress)}%</span>
                        )}
                      </div>

                      {step.status === "processing" && (
                        <div className="ml-9">
                          <div className="w-full bg-provn-surface-2 rounded-full h-2">
                            <div
                              className="bg-provn-accent h-2 rounded-full transition-all duration-300"
                              style={{ width: `${step.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {step.message && <p className="ml-9 text-sm text-provn-muted">{step.message}</p>}
                    </div>
                  ))}
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Cancel Button */}
            <div className="text-center">
              <ProvnButton
                variant="secondary"
                onClick={handleCancel}
                disabled={processingSteps.some((step) => step.status === "processing")}
              >
                Cancel
              </ProvnButton>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="upload" />

      {/* Upload Form */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-headline text-4xl font-bold text-provn-text">Upload & Mint</h1>
            <p className="text-provn-muted text-lg">Register your short video on Camp with on‑chain provenance.</p>
          </div>

          {/* Upload Zone */}
          <ProvnCard>
            <ProvnCardContent className="p-8">
              {!uploadedFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragOver
                      ? "border-provn-accent bg-provn-accent-subtle"
                      : "border-provn-border hover:border-provn-accent/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-provn-surface-2 rounded-xl flex items-center justify-center mx-auto">
                      <span className="text-2xl">📹</span>
                    </div>
                    <div>
                      <p className="text-provn-text font-medium mb-2">Drag a video here or Browse</p>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-input"
                      />
                      <label
                        htmlFor="file-input"
                        className="text-provn-accent hover:text-provn-accent-press cursor-pointer underline"
                      >
                        Browse files
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    <video src={uploadedFile.preview} controls className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-provn-text font-medium">{uploadedFile.file.name}</p>
                      <p className="text-provn-muted text-sm">
                        {(uploadedFile.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <ProvnButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        URL.revokeObjectURL(uploadedFile.preview)
                        setUploadedFile(null)
                      }}
                    >
                      Remove
                    </ProvnButton>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-provn-muted text-sm">MP4/MOV • up to 150MB • H.264</p>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Metadata Form */}
          <ProvnCard>
            <ProvnCardContent className="p-8 space-y-6">
              <div>
                <label htmlFor="title" className="block text-provn-text font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                  placeholder="Enter video title..."
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-provn-text font-medium mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                  placeholder="comedy, viral, trending..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allow-remixing"
                    checked={allowRemixing}
                    onChange={(e) => setAllowRemixing(e.target.checked)}
                    className="w-4 h-4 text-provn-accent bg-provn-surface-2 border-provn-border rounded focus:ring-provn-accent focus:ring-2"
                  />
                  <label htmlFor="allow-remixing" className="text-provn-text font-medium">
                    Allow Remixing
                  </label>
                </div>

                <div className="ml-7 space-y-2">
                  <p className="text-provn-muted text-sm">License Price: 10 wCAMP</p>
                  <p className="text-provn-muted text-xs">
                    Creators who license your work will pay 10 wCAMP, with 70% going to you and 30% to the platform.
                  </p>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Gasless Info */}
          <div className="text-center">
            <ProvnBadge variant="success" className="mb-4">
              Gasless
            </ProvnBadge>
            <p className="text-provn-muted text-sm">We sponsor gas on BaseCAMP for minting</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <ProvnButton variant="secondary" onClick={handleCancel}>
              Cancel
            </ProvnButton>
            <ProvnButton onClick={handleUpload} disabled={!uploadedFile || !title.trim()} className="min-w-[160px]">
              Upload & Continue
            </ProvnButton>
          </div>
        </div>
      </main>
    </div>
  )
}
