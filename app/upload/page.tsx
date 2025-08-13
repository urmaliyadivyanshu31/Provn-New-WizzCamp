"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { useWalletAuth } from "@/components/provn/wallet-connection"

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

interface ProcessingStatus {
  processingId: string
  status: string
  progress: number
  currentStep: string
  steps: Array<{
    id: string
    status: string
    progress: number
    completedAt?: string
  }>
  result?: {
    tokenId: string
    ipfsHash: string
    thumbnailHash: string
    duration: number
    resolution: string
    format: string
  }
  errorMessage?: string
}

export default function UploadPage() {
  const router = useRouter()
  // Use new wallet authentication state
  const { isConnected, address: walletAddress, connect, disconnect, isConnecting } = useWalletAuth()
  
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState("")
  const [allowRemixing, setAllowRemixing] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "validation", name: "File Validation", status: "pending", progress: 0 },
    { id: "transcoding", name: "Transcoding to HLS", status: "pending", progress: 0 },
    { id: "ipfs", name: "Uploading to IPFS", status: "pending", progress: 0 },
    { id: "hashing", name: "Perceptual Hashing", status: "pending", progress: 0 },
    { id: "duplicate", name: "Duplicate Check", status: "pending", progress: 0 },
    { id: "minting", name: "Minting IpNFT", status: "pending", progress: 0 },
  ])

  // Polling for processing status
  useEffect(() => {
    if (!processingId || !isProcessing) return

    const pollInterval = setInterval(async () => {
      try {
        // Use wallet address for authentication instead of authToken
        const response = await fetch(`/api/processing/${processingId}/status`, {
          headers: {
            'X-Wallet-Address': walletAddress || ''
          }
        })

        if (response.ok) {
          const status: ProcessingStatus = await response.json()
          updateProcessingStepsFromStatus(status)

          if (status.status === 'completed' && status.result) {
            // Processing completed successfully
            const result: MintResult = {
              tokenId: status.result.tokenId,
              ipfsHash: status.result.ipfsHash,
              transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`, // Mock for now
              blockscoutUrl: `https://basecamp.cloud.blockscout.com/tx/0x${Math.random().toString(16).substring(2, 66)}`
            }
            setMintResult(result)
            setIsProcessing(false)
            clearInterval(pollInterval)
          } else if (status.status === 'failed') {
            // Processing failed
            setIsProcessing(false)
            clearInterval(pollInterval)
            alert(`Processing failed: ${status.errorMessage || 'Unknown error'}`)
          }
        }
      } catch (error) {
        console.error('Failed to check processing status:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [processingId, isProcessing, walletAddress])

  const updateProcessingStepsFromStatus = (status: ProcessingStatus) => {
    setProcessingSteps(prev => prev.map(step => {
      const statusStep = status.steps.find(s => s.id === step.id)
      if (statusStep) {
        return {
          ...step,
          status: statusStep.status as "pending" | "processing" | "completed" | "error",
          progress: statusStep.progress
        }
      }
      return step
    }))
  }

  const handleCancel = () => {
    router.push('/')
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('video/')) {
        const preview = URL.createObjectURL(file)
        setUploadedFile({ file, preview })
      } else {
        alert('Please upload a video file')
      }
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('video/')) {
        const preview = URL.createObjectURL(file)
        setUploadedFile({ file, preview })
      } else {
        alert('Please upload a video file')
      }
    }
  }, [])

  const handleUpload = async () => {
    if (!uploadedFile || !title.trim()) {
      alert('Please upload a video and enter a title')
      return
    }

    if (!isConnected || !walletAddress) {
      alert('Please connect your wallet first')
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('video', uploadedFile.file)
      formData.append('metadata', JSON.stringify({
        title: title.trim(),
        description: '',
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        allowRemixing,
        parentTokenId: null
      }))

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'X-Wallet-Address': walletAddress
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setProcessingId(result.processingId)
        
        // Update first step to processing
        setProcessingSteps(prev => prev.map(step => 
          step.id === 'validation' ? { ...step, status: 'processing', progress: 0 } : step
        ))
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (uploadedFile?.preview) {
        URL.revokeObjectURL(uploadedFile.preview)
      }
    }
  }, [uploadedFile])

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
              {processingId && (
                <p className="text-provn-accent text-sm font-mono">ID: {processingId}</p>
              )}
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
            
            {/* Connect Wallet Section */}
            {!isConnected ? (
              <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
                <h3 className="text-lg font-medium text-provn-text mb-4">Connect Your Wallet</h3>
                <p className="text-provn-muted text-sm mb-4">
                  Connect your wallet to start minting IP-NFTs on BaseCAMP Network
                </p>
                <ProvnButton
                  onClick={connect}
                  disabled={isConnecting}
                  className="inline-flex items-center justify-center rounded-[10px] font-headline font-semibold transition-all duration-[120ms] ease-out disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-provn-bg bg-provn-accent text-provn-bg hover:bg-provn-accent-press focus:ring-provn-accent active:scale-95 px-6 py-3 text-base"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </ProvnButton>
                {isConnecting && (
                  <p className="text-provn-muted text-sm mt-2">Connecting to your wallet...</p>
                )}
              </div>
            ) : (
              <div className="bg-provn-success/20 border border-provn-success/30 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-provn-success">✅</span>
                  <span className="text-provn-success font-medium">
                    Wallet Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </span>
                  <button
                    onClick={disconnect}
                    className="text-provn-success/70 hover:text-provn-success text-sm underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
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
                    className="w-4 h-4 text-provn-accent bg-provn-surface-2 border border-provn-border rounded focus:ring-provn-accent focus:ring-2"
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
            <ProvnButton onClick={handleUpload} disabled={!uploadedFile || !title.trim() || !isConnected} className="min-w-[160px]">
              {isConnected ? 'Upload & Mint IP-NFT' : 'Connect Wallet First'}
            </ProvnButton>
          </div>
        </div>
      </main>
    </div>
  )
}
