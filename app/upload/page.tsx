"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useAuthState } from "@campnetwork/origin/react"
import { useVideoMinting } from "@/hooks/useVideoMinting"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { CampModal } from "@campnetwork/origin/react"
import { Video, Loader2, CheckCircle, Copy, Share2, ExternalLink } from "lucide-react"
import { toast } from "sonner"


interface LicenseTerms {
  price: string
  duration: string
  royalty: string
  paymentToken: string
}

interface VideoMetadata {
  name: string
  description: string
  mimeType?: string
  size?: number
}

interface MintResult {
  tokenId: string
  ipfsHash: string
  metadataHash: string
  transactionHash?: string
  blockscoutUrl?: string
  fileUrl?: string
  videoUrl?: string
}

export default function UploadPage() {
  const router = useRouter()
  const { authenticated } = useAuthState()
  const { origin, jwt } = useAuth()
  const {
    mintVideoWithOrigin,
    fetchMetadata,
    loading,
    error,
    success,
    address,
    clearError,
    clearSuccess 
  } = useVideoMinting()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [allowRemixing, setAllowRemixing] = useState(true)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)

  const metadata: VideoMetadata = {
    name: '',
    description: '',
  }

  const license: LicenseTerms = {
    price: '0',
    duration: '2629800',
    royalty: '0',
    paymentToken: '0x0000000000000000000000000000000000000000',
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === "video/mp4" || file.type === "video/quicktime")) {
      // Check file size (150MB limit)
      const maxSize = 150 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error("File size must be under 150MB")
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      toast.error("Please select a valid video file (MP4 or MOV)")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (file && (file.type === "video/mp4" || file.type === "video/quicktime")) {
        const fakeEvent = {
          target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>
        handleFileSelect(fakeEvent)
      }
    }
  }

  const handleMint = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error("Please provide a video file and title")
      return
    }
    if (!authenticated || !origin || !jwt) {
      toast.error("Please connect your wallet first")
      return
    }

    // Clear previous messages
    clearError()
    clearSuccess()

    try {
      const updatedMetadata = {
        ...metadata,
        name: title,
        description: description || `A video uploaded via Provn platform`,
        mimeType: selectedFile.type,
        size: selectedFile.size,
      }

      const mintResult = await mintVideoWithOrigin(
        selectedFile,
        updatedMetadata,
        license,
        ''
      )

      if (mintResult && mintResult.tokenId) {
        const { tokenId, ipfsUrl } = mintResult
        const tokenIdStr = tokenId.toString()
        
        // Show loading state first
        const loadingResult: MintResult = {
          tokenId: tokenIdStr,
          ipfsHash: ipfsUrl.split('/ipfs/')[1] || 'processing', // Extract IPFS hash from URL
          metadataHash: 'loading...',
          transactionHash: 'processing',
          blockscoutUrl: `https://basecamp.cloud.blockscout.com/tx/processing`,
          fileUrl: preview,
          videoUrl: ipfsUrl
        }
        
        setMintResult(loadingResult)
        
        // Fetch real metadata asynchronously and sync to platform
        setTimeout(async () => {
          try {
            const metadata = await fetchMetadata(tokenIdStr, address!)
            if (metadata) {
              const finalResult: MintResult = {
                tokenId: tokenIdStr,
                ipfsHash: ipfsUrl.split('/ipfs/')[1] || 'unknown',
                metadataHash: metadata.metadataHash,
                transactionHash: metadata.transactionHash || 'View on Explorer',
                blockscoutUrl: metadata.transactionHash 
                  ? `https://basecamp.cloud.blockscout.com/tx/${metadata.transactionHash}`
                  : `https://basecamp.cloud.blockscout.com/token/0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1/instance/${tokenIdStr}`,
                fileUrl: preview,
                videoUrl: metadata.videoUrl || ipfsUrl
              }
              setMintResult(finalResult)

              // Sync the minted video to platform database
              try {
                console.log('🔄 Starting video sync to platform database...')
                console.log('🔄 Sync data being sent:', {
                  tokenId: tokenIdStr,
                  transactionHash: metadata.transactionHash,
                  creatorWallet: address,
                  title,
                  description: description || `A video uploaded via Provn platform`,
                  tagsCount: tags ? tags.split(',').length : 0
                })

                const syncResponse = await fetch('/api/sync-minted-video', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    tokenId: tokenIdStr,
                    transactionHash: metadata.transactionHash,
                    creatorWallet: address,
                    title,
                    description: description || `A video uploaded via Provn platform`,
                    tags: tags ? tags.split(',').map(t => t.trim()) : [],
                    videoUrl: metadata.videoUrl || ipfsUrl,
                    thumbnailUrl: preview,
                    metadataUri: `https://gateway.pinata.cloud/ipfs/${metadata.metadataHash}`,
                    license: {
                      price: license.price,
                      duration: license.duration,
                      royalty: license.royalty,
                      paymentToken: license.paymentToken
                    },
                    mintTimestamp: new Date().toISOString()
                  })
                })

                console.log('🔄 Sync API response status:', syncResponse.status)
                const syncData = await syncResponse.json()
                console.log('🔄 Sync API response data:', syncData)

                if (syncData.success && syncData.synced) {
                  console.log('✅ Video successfully synced to platform!')
                  console.log('✅ Platform video ID:', syncData.video?.id)
                  console.log('✅ Sync completed in:', syncData.duration)
                  toast.success('Video synced to your profile!')
                } else if (syncData.success && !syncData.synced) {
                  console.warn('⚠️ Video minted but not synced to platform')
                  console.warn('⚠️ Reason:', syncData.message)
                  console.warn('⚠️ Action required:', syncData.action_required)
                  
                  if (syncData.action_required?.includes('profile')) {
                    toast.error('Please create a profile first to sync videos!')
                  } else {
                    toast.warning('Video minted but not synced to profile. Check console for details.')
                  }
                } else {
                  console.error('❌ Sync failed:', syncData.error)
                  toast.error('Video minted but sync failed. Check your profile later.')
                }
              } catch (syncError) {
                console.error('❌ Sync request failed:', syncError)
                toast.error('Video minted but sync failed. Check your profile later.')
              }
            }
          } catch (error) {
            console.warn('Failed to fetch metadata:', error)
          }
        }, 3000) // Wait 3 seconds for blockchain to settle
        
        // setMintResult(result) - moved above

        // Store minimal data in localStorage to avoid quota issues
        try {
          const videos = JSON.parse(localStorage.getItem('provn-videos') || '[]')
          const newVideo = {
            id: Date.now().toString(),
            title,
            description,
            minted: true,
            mintedAt: new Date().toISOString(),
            tokenId: tokenIdStr,
            fileName: selectedFile.name,
            fileSize: selectedFile.size
          }
          
          // Keep only last 10 videos to prevent quota issues
          const updatedVideos = [...videos, newVideo].slice(-10)
          localStorage.setItem('provn-videos', JSON.stringify(updatedVideos))
        } catch (error) {
          console.warn('Failed to save to localStorage:', error)
        }

        toast.success("Video minted successfully as IP-NFT!")
        
        // Reset form
        setSelectedFile(null)
        setPreview("")
        setTitle("")
        setDescription("")
        setTags("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } catch (err) {
      console.error('Video minting error:', err)
      toast.error('Failed to mint video. Please try again.')
    }
  }

  const handleCancel = () => {
    if (selectedFile) {
      URL.revokeObjectURL(preview)
    }
    router.push("/")
  }

  const handleViewAsset = () => {
    if (mintResult) {
      router.push(`/video/${mintResult.tokenId}`)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const shareNFT = async () => {
    const url = `${window.location.origin}/video/${mintResult?.tokenId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out my IpNFT: ${title}`,
          text: 'I just minted my video as an IpNFT on BaseCAMP with provenance verification!',
          url: url,
        })
      } catch (error) {
        copyToClipboard(url, 'Share URL')
      }
    } else {
      copyToClipboard(url, 'Share URL')
    }
  }

  // Render success state
  if (mintResult) {
    return (
      <div className="font-headline min-h-screen bg-provn-bg">
        <Navigation currentPage="upload" />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-12">
            {/* Hero Success Section */}
            <div className="space-y-6 pt-16">
              <div className="relative mx-auto">
                <div className="w-32 h-32 bg-gradient-to-br  from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/25">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="font-headline text-5xl font-bold text-provn-text">
                  IpNFT Minted Successfully!
                </h1>
                <p className="text-provn-muted text-xl max-w-2xl mx-auto">
                  Your video is now immortalized on BaseCAMP with verified provenance and decentralized storage
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <ProvnBadge variant="success" className="text-base px-6 py-2 bg-green-100 text-green-800 border-green-200">
                  <Video className="w-4 h-4 mr-2" />
                  Provenance Verified
                </ProvnBadge>
                <ProvnBadge variant="default" className="text-base px-6 py-2 bg-blue-100 text-blue-800 border-blue-200">
                  BaseCAMP Network
                </ProvnBadge>
              </div>
            </div>

            {/* NFT Preview Card */}
            <div>
              <ProvnCard className="max-w-2xl mx-auto">
                <ProvnCardContent className="p-6 space-y-4">
                  {(mintResult.videoUrl || preview) && (
                    <div className="aspect-video bg-provn-surface-2 rounded-lg overflow-hidden border border-provn-border">
                      <video 
                        src={mintResult.videoUrl || preview || undefined}
                        controls 
                        className="w-full h-full object-contain"
                        poster={preview || undefined}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-provn-text">{title}</h3>
                    {description && (
                      <p className="text-provn-muted">{description}</p>
                    )}
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            </div>

            {/* Blockchain Details Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Token ID Card */}
              <ProvnCard className="group">
                <ProvnCardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-provn-accent rounded-full"></div>
                      <span className="text-xs font-medium text-provn-accent uppercase tracking-wider">TOKEN ID</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(mintResult.tokenId, 'Token ID')}
                      className="p-1.5 hover:bg-provn-surface-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Copy className="w-3.5 h-3.5 text-provn-muted" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono text-xs text-provn-muted bg-provn-surface-2 px-2.5 py-1.5 rounded border border-provn-border">
                      #{mintResult.tokenId.length > 20 
                        ? `${mintResult.tokenId.slice(0, 6)}...${mintResult.tokenId.slice(-6)}`
                        : mintResult.tokenId
                      }
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>

              {/* IPFS Storage Card */}
              <ProvnCard className="group">
                <ProvnCardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-provn-success rounded-full"></div>
                      <span className="text-xs font-medium text-provn-success uppercase tracking-wider">IPFS URL</span>
                    </div>
                    {mintResult.ipfsHash !== 'processing' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyToClipboard(mintResult.ipfsHash, 'IPFS Hash')}
                          className="p-1.5 hover:bg-provn-surface-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Copy className="w-3.5 h-3.5 text-provn-muted" />
                        </button>
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${mintResult.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-provn-surface-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-provn-muted" />
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono text-xs text-provn-muted bg-provn-surface-2 px-2.5 py-1.5 rounded border border-provn-border">
                      {mintResult.ipfsHash === 'processing' ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        `${mintResult.ipfsHash.slice(0, 6)}...${mintResult.ipfsHash.slice(-6)}`
                      )}
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>

              {/* Transaction Card */}
              <ProvnCard className="group">
                <ProvnCardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-provn-warning rounded-full"></div>
                      <span className="text-xs font-medium text-provn-warning uppercase tracking-wider">TRANSACTION ID</span>
                    </div>
                    {mintResult.transactionHash !== 'processing' && mintResult.transactionHash && mintResult.transactionHash.startsWith('0x') && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyToClipboard(mintResult.transactionHash!, 'Transaction Hash')}
                          className="p-1.5 hover:bg-provn-surface-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Copy className="w-3.5 h-3.5 text-provn-muted" />
                        </button>
                        <a
                          href={mintResult.blockscoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-provn-surface-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-provn-muted" />
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono text-xs text-provn-muted bg-provn-surface-2 px-2.5 py-1.5 rounded border border-provn-border">
                      {mintResult.transactionHash === 'processing' ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processing...
                        </div>
                      ) : mintResult.transactionHash && mintResult.transactionHash.startsWith('0x') ? (
                        `${mintResult.transactionHash.slice(0, 6)}...${mintResult.transactionHash.slice(-6)}`
                      ) : (
                        <a
                          href={mintResult.blockscoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-provn-accent hover:text-provn-accent-press transition-colors"
                        >
                          View Explorer ↗
                        </a>
                      )}
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <ProvnButton onClick={handleViewAsset} className="min-w-[160px]">
                <span className="mr-2">👁️</span>
                View IpNFT
              </ProvnButton>
              <ProvnButton variant="secondary" onClick={shareNFT} className="min-w-[160px]">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </ProvnButton>
              <ProvnButton variant="secondary" onClick={() => router.push("/upload")} className="min-w-[160px]">
                <span className="mr-2">📤</span>
                Upload Another
              </ProvnButton>
            </div>

            {/* Additional Info */}
            <div className="text-center space-y-3">
              <p className="text-provn-muted text-sm max-w-2xl mx-auto">
                Your content is now permanently stored on IPFS with blockchain-verified provenance. 
                The transaction was processed gaslessly on the BaseCAMP network.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Render main upload form
  return (
    <div className="font-headline min-h-screen bg-provn-bg">
      <Navigation currentPage="upload" />

      {/* Upload Form */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center pt-12 space-y-4">
            <h1 className="font-headline text-4xl font-bold text-provn-text">Upload & Mint</h1>
            <p className="text-provn-muted text-lg">Register your short video on Camp with on‑chain provenance.</p>
          </div>

          {/* Wallet Status Indicator */}
          {authenticated && (
            <div className="text-center">
              <ProvnBadge 
                variant="success"
                className="text-sm px-3 py-1"
              >
                ✓ Wallet Connected
              </ProvnBadge>
            </div>
          )}

          {/* Upload Zone */}
          <ProvnCard>
            <ProvnCardContent className="p-8">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed rounded-xl p-12 text-center transition-colors border-provn-border hover:border-provn-accent/50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-provn-surface-2 rounded-xl flex items-center justify-center mx-auto">
                      <Video className="w-8 h-8 text-provn-muted" />
                    </div>
                    <div>
                      <p className="text-provn-text font-medium mb-2">Drag a video here or Browse</p>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-input"
                        ref={fileInputRef}
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
                    <video src={preview} controls className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-provn-text font-medium">{selectedFile.name}</p>
                      <p className="text-provn-muted text-sm">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
                      </p>
                    </div>
                    <ProvnButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        URL.revokeObjectURL(preview)
                        setSelectedFile(null)
                        setPreview("")
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
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
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                  placeholder="Enter video title..."
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-provn-text font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent resize-none"
                  placeholder="Describe your video content..."
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
                  <p className="text-provn-muted text-sm">License Price: Free (0 wCAMP)</p>
                  <p className="text-provn-muted text-xs">
                    This video will be minted as a free IP-NFT on the BaseCAMP network.
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
            {!authenticated ? (
              <ProvnButton disabled className="min-w-[160px]">
                Connect Wallet to Upload
              </ProvnButton>
            ) : (
              <ProvnButton 
                onClick={handleMint} 
                disabled={!selectedFile || !title.trim() || loading} 
                className="min-w-[160px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting Video...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Mint as IP-NFT
                  </>
                )}
              </ProvnButton>
            )}
          </div>

          {!authenticated && (
            <p className="text-sm text-provn-muted text-center">
              Connect your wallet to mint videos
            </p>
          )}

          {authenticated && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              ✅ Ready to mint!
            </p>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          )}
        </div>
      </main>
      
      {/* CampModal for Origin SDK wallet connection */}
      <CampModal />
    </div>
  )
}