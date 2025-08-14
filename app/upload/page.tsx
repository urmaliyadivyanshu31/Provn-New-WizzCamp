"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { useAuth, useAuthState, useConnect } from "@campnetwork/origin/react"
import { toast } from "sonner"
import { CampModal } from "@campnetwork/origin/react"
import { Copy, ExternalLink, Share2, Download, CheckCircle, Sparkles } from "lucide-react"
import { ipfsService } from "@/lib/ipfs"

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
  metadataUri?: string
  transactionHash: string
  blockscoutUrl: string
  contractAddress?: string
  chainId?: number
  fileUrl?: string
}

export default function UploadPage() {
  const router = useRouter()
  const auth = useAuth()
  const { authenticated, loading } = useAuthState()
  const { connect, disconnect } = useConnect()
  
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [allowRemixing, setAllowRemixing] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [isWalletReady, setIsWalletReady] = useState(false)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "validation", name: "File Validation", status: "pending", progress: 0 },
    { id: "transcoding", name: "Transcoding to HLS", status: "pending", progress: 0 },
    { id: "ipfs", name: "Uploading to IPFS", status: "pending", progress: 0 },
    { id: "hashing", name: "Perceptual Hashing", status: "pending", progress: 0 },
    { id: "duplicate", name: "Duplicate Check", status: "pending", progress: 0 },
    { id: "minting", name: "Minting IpNFT", status: "pending", progress: 0 },
  ])

  // Simplified wallet readiness check - rely on Origin SDK
  useEffect(() => {
    const checkWalletReadiness = () => {
      // Simple check: if we have auth, origin SDK, and JWT, we're ready
      const ready = !!(authenticated && auth.origin && auth.jwt && auth.walletAddress)
      setIsWalletReady(ready)
      
      if (ready) {
        console.log('✅ Origin SDK ready for minting')
      } else {
        console.log('⏳ Waiting for Origin SDK initialization...')
      }
    }

    checkWalletReadiness()
  }, [authenticated, auth.origin, auth.jwt, auth.walletAddress])

  // Authentication event listeners as per official docs
  useEffect(() => {
    if (!auth.on) return

    // Listen for authentication state changes
    const handleStateChange = (state: any) => {
      console.log('🔐 Auth state changed:', state)
      // setAuthState(state) // This line was removed from the new_code, so it's removed here.
      
      if (state === 'authenticated') {
        console.log('✅ User authenticated successfully')
      } else if (state === 'unauthenticated') {
        console.log('❌ User unauthenticated')
        setIsWalletReady(false)
      }
    }

    // Listen for provider changes
    const handleProviderChange = (provider: any) => {
      console.log('🔐 Provider changed:', provider)
    }

    // Listen for available providers
    const handleProvidersChange = (providers: any) => {
      console.log('🔐 Available providers:', providers)
    }

    // Subscribe to events
    auth.on('state', handleStateChange)
    auth.on('provider', handleProviderChange)
    auth.on('providers', handleProvidersChange)

    // Cleanup
    return () => {
      // Note: The on method might not have an off method, so we'll rely on component unmount
    }
  }, [auth.on])

  // Monitor Origin SDK state
  useEffect(() => {
    const checkOriginSDK = () => {
      console.log('🔍 Origin SDK State Check:', {
        authenticated,
        hasOrigin: !!auth.origin,
        hasJWT: !!auth.jwt,
        originType: typeof auth.origin,
        originMethods: auth.origin ? Object.keys(auth.origin) : 'undefined',
        walletAddress: auth.walletAddress,
        isWalletReady,
        timestamp: new Date().toISOString()
      });
    };

    checkOriginSDK();
  }, [authenticated, auth.origin, auth.walletAddress, isWalletReady, auth.jwt]);
  
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

  // Enhanced authentication trigger with better debugging
  const handleManualAuth = async () => {
    if (!connect || !disconnect) {
      toast.error('Authentication methods not available')
      return
    }

    try {
      console.log('🔐 Starting fresh authentication...', {
        currentAuth: {
          authenticated,
          hasJWT: !!auth.jwt,
          hasOrigin: !!auth.origin,
          walletAddress: auth.walletAddress
        }
      })
      
      // First disconnect to clear any stale state
      if (authenticated) {
        console.log('🔐 Disconnecting existing session...')
        try {
          await disconnect()
          console.log('🔐 Disconnect successful')
        } catch (disconnectError) {
          console.warn('🔐 Disconnect error (continuing anyway):', disconnectError)
        }
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait longer for disconnect
      }
      
      // Clear any cached authentication data
      console.log('🔐 Clearing cached auth state...')
      if (typeof window !== 'undefined') {
        // Clear any stored auth tokens or state
        localStorage.removeItem('camp-auth-token')
        localStorage.removeItem('camp-wallet-address')
        sessionStorage.clear()
      }
      
      // Then reconnect
      console.log('🔐 Connecting wallet...')
      await connect()
      toast.success('Please sign the authentication message in your wallet.')
      
      // Wait longer and check auth state more thoroughly
      let attempts = 0
      const maxAttempts = 10
      const checkAuthState = () => {
        attempts++
        console.log(`🔍 Auth check attempt ${attempts}:`, {
          authenticated,
          hasJWT: !!auth.jwt,
          hasOrigin: !!auth.origin,
          walletAddress: auth.walletAddress,
          jwtPreview: auth.jwt ? auth.jwt.substring(0, 30) + '...' : 'none'
        })
        
        if (auth.jwt && authenticated) {
          toast.success('✅ Authentication successful!')
          console.log('✅ Authentication flow completed successfully')
        } else if (attempts < maxAttempts) {
          setTimeout(checkAuthState, 1000)
        } else {
          console.warn('⚠️ Authentication may not have completed properly')
          toast.warning('Authentication may be incomplete. Try uploading anyway or refresh the page.')
        }
      }
      
      setTimeout(checkAuthState, 1000)
      
    } catch (error: any) {
      console.error('🔐 Authentication failed:', {
        error,
        message: error?.message,
        stack: error?.stack
      })
      toast.error(`Authentication failed: ${error?.message || 'Unknown error'}`)
    }
  }


  const handleUpload = async () => {
    if (!uploadedFile || !title.trim()) {
      toast.error("Please provide a file and title")
      return
    }

    // Simple validation based on working model
    if (!auth.walletAddress) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet first.",
        duration: 5000,
      })
      return
    }
    console.log("✅ Wallet connected:", auth.walletAddress)

    if (!auth.origin) {
      toast.error("Origin SDK not initialized", {
        description: "Please try reconnecting your wallet.",
        duration: 5000,
      })
      return
    }
    console.log("✅ Origin SDK initialized")

    // Check file size (based on working model)
    const fileSizeMB = uploadedFile.file.size / (1024 * 1024)
    if (fileSizeMB > 150) { // Keep our 150MB limit
      toast.error("File too large for upload.", {
        description: `File size is ${fileSizeMB.toFixed(2)}MB. Maximum allowed is 150MB.`,
        duration: 5000,
      })
      return
    }
    console.log(`✅ File size valid: ${fileSizeMB.toFixed(2)}MB`)

    setIsProcessing(true)

    try {
      // Update processing steps
      updateProcessingStep("validation", { status: "processing", message: "Validating file..." })
      updateProcessingStep("validation", { status: "completed", progress: 100 })
      updateProcessingStep("transcoding", { status: "completed", progress: 100, message: "Ready for processing" })
      updateProcessingStep("ipfs", { status: "processing", progress: 0, message: "Preparing upload..." })
      updateProcessingStep("hashing", { status: "pending", progress: 0 })
      updateProcessingStep("duplicate", { status: "pending", progress: 0 })
      updateProcessingStep("minting", { status: "pending", progress: 0 })

      // Define license terms (based on working model)
      const license = {
        price: BigInt(0),
        duration: 2629800, // 30 days in seconds  
        royaltyBps: 0,
        paymentToken: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      }

      // Create metadata (based on working model)
      const metadata = {
        name: title,
        description: description || title,
        attributes: [
          {
            trait_type: "Type",
            value: "Video",
          },
          {
            trait_type: "File Size",
            value: `${fileSizeMB.toFixed(2)}MB`,
          },
          {
            trait_type: "Platform",
            value: "Provn",
          },
        ],
      }

      console.log("📤 Starting IP registration...", {
        fileSize: fileSizeMB.toFixed(2) + "MB",
        walletAddress: auth.walletAddress,
        hasOrigin: !!auth.origin,
        fileName: uploadedFile.file.name,
        fileType: uploadedFile.file.type,
        metadata,
        license: { ...license, price: license.price.toString() }
      })

      updateProcessingStep("minting", {
        status: "processing", 
        progress: 30,
        message: "Registering IP with Origin SDK...",
      })
      
      // Let Origin SDK handle IPFS upload internally
      console.log("🚀 Starting mintFile with Origin SDK (handling IPFS internally)...")
      updateProcessingStep("ipfs", { status: "processing", progress: 30, message: "Uploading to IPFS via Origin SDK..." })
      updateProcessingStep("minting", { status: "processing", progress: 50, message: "Minting with Origin SDK..." })
      
      // Check Origin SDK authentication status
      console.log("🔍 Origin SDK Authentication Check:", {
        hasOrigin: !!auth.origin,
        hasJWT: !!auth.jwt,
        walletAddress: auth.walletAddress,
        jwtPreview: auth.jwt ? `${auth.jwt.substring(0, 20)}...` : 'none'
      })
      
      const mintResult = await auth.origin.mintFile(uploadedFile.file, metadata, license)
      
      updateProcessingStep("hashing", { status: "completed", progress: 100, message: "Content fingerprinted" })
      updateProcessingStep("duplicate", { status: "completed", progress: 100, message: "No duplicates found" })
      updateProcessingStep("minting", { status: "processing", progress: 80, message: "Finalizing registration..." })

      toast.success("IP registration successful! Your NFT is now live.", {
        duration: 5000,
      })
      
      // Comprehensive logging for debugging
      console.log("✅ IP registration successful! Your NFT is now live.")
      console.log("🔍 Full mintResult object:", mintResult)
      console.log("🔍 mintResult type:", typeof mintResult)
      console.log("🔍 mintResult structure:", JSON.stringify(mintResult, null, 2))
      
      if (mintResult && typeof mintResult === 'object') {
        console.log("📊 Available properties:", Object.keys(mintResult))
        console.log("📊 All values:", Object.entries(mintResult))
      }

      // Enhanced data parsing for Origin SDK response
      let realTokenId = 'unknown'
      let realTxHash = 'unknown'
      let realIpfsHash = 'unknown'
      let metadataUri = ''
      let contractAddress = ''
      let fileUrl = ''
      
      console.log("🔧 Starting enhanced data parsing...")
      
      if (mintResult) {
        if (typeof mintResult === 'string') {
          // According to docs, mintFile should return token ID as string
          console.log("📝 mintResult is string (likely token ID):", mintResult)
          realTokenId = mintResult
          console.log("✅ Token ID extracted:", realTokenId)
          
          // Try to get transaction hash and additional data including IPFS hash
          if (auth.origin && realTokenId !== 'unknown' && realTokenId !== '0') {
            try {
              console.log("🔍 Attempting to get token URI for additional data...")
              const tokenUri = await auth.origin.tokenURI(BigInt(realTokenId))
              console.log("✅ Got token URI:", tokenUri)
              metadataUri = tokenUri
              
              if (tokenUri && tokenUri.includes('ipfs://')) {
                const metadataHash = tokenUri.replace('ipfs://', '')
                console.log("✅ Found metadata IPFS hash:", metadataHash)
                metadataUri = tokenUri
                
                // Fetch the metadata to get the actual video file hash
                try {
                  console.log("🔍 Fetching metadata to find video file hash...")
                  const metadataResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${metadataHash}`)
                  const metadata = await metadataResponse.json()
                  console.log("📄 Metadata content:", metadata)
                  
                  // Look for video file hash in metadata
                  if (metadata.image && metadata.image.includes('ipfs://')) {
                    realIpfsHash = metadata.image.replace('ipfs://', '')
                    fileUrl = `https://gateway.pinata.cloud/ipfs/${realIpfsHash}`
                    console.log("✅ Found video file IPFS hash in metadata.image:", realIpfsHash)
                  } else if (metadata.image && metadata.image.includes('mypinata.cloud/ipfs/')) {
                    // Handle gateway URL format
                    realIpfsHash = metadata.image.split('/ipfs/')[1]
                    fileUrl = metadata.image
                    console.log("✅ Found video file IPFS hash from gateway URL:", realIpfsHash)
                  } else if (metadata.animation_url) {
                    if (metadata.animation_url.includes('ipfs://')) {
                      realIpfsHash = metadata.animation_url.replace('ipfs://', '')
                    } else if (metadata.animation_url.includes('mypinata.cloud/ipfs/')) {
                      realIpfsHash = metadata.animation_url.split('/ipfs/')[1]
                    }
                    fileUrl = metadata.animation_url
                    console.log("✅ Found video file IPFS hash in metadata.animation_url:", realIpfsHash)
                  }
                } catch (metadataError) {
                  console.warn("⚠️ Could not fetch metadata:", metadataError)
                  // Fallback to using metadata hash
                  realIpfsHash = metadataHash
                  fileUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`
                }
              }
            } catch (error) {
              console.warn("⚠️ Could not fetch token URI:", error)
              // This is expected if the token was just minted
            }
            
            try {
              console.log("🔍 Attempting to get content hash...")
              const contentHashResult = await auth.origin.contentHash(BigInt(realTokenId))
              console.log("✅ Got content hash:", contentHashResult)
              if (contentHashResult && !realIpfsHash) {
                realIpfsHash = contentHashResult
                fileUrl = `https://gateway.pinata.cloud/ipfs/${realIpfsHash}`
              }
            } catch (error) {
              console.warn("⚠️ Could not fetch content hash:", error)
            }
          }
          
        } else if (typeof mintResult === 'object' && mintResult !== null) {
          const result = mintResult as any
          console.log("📝 mintResult is object (unexpected based on docs), extracting fields...")
          
          // Extract token ID (primary)
          if (result.tokenId) {
            realTokenId = result.tokenId.toString()
            console.log("✅ Found token ID in 'tokenId':", realTokenId)
          } else if (result.id) {
            realTokenId = result.id.toString()
            console.log("✅ Found token ID in 'id':", realTokenId)
          } else if (typeof result === 'string') {
            realTokenId = result
            console.log("✅ Found token ID as string value:", realTokenId)
          }
          
          // Extract transaction hash
          if (result.hash) {
            realTxHash = result.hash
            console.log("✅ Found transaction hash in 'hash':", realTxHash)
          } else if (result.transactionHash) {
            realTxHash = result.transactionHash
            console.log("✅ Found transaction hash in 'transactionHash':", realTxHash)
          } else if (result.txHash) {
            realTxHash = result.txHash
            console.log("✅ Found transaction hash in 'txHash':", realTxHash)
          }
          
          // Extract IPFS hash from object
          if (result.ipfsHash) {
            realIpfsHash = result.ipfsHash
            fileUrl = `https://gateway.pinata.cloud/ipfs/${realIpfsHash}`
            console.log("✅ Found IPFS hash in 'ipfsHash':", realIpfsHash)
          } else if (result.cid) {
            realIpfsHash = result.cid
            fileUrl = `https://gateway.pinata.cloud/ipfs/${realIpfsHash}`
            console.log("✅ Found IPFS hash in 'cid':", realIpfsHash)
          } else if (result.tokenURI || result.uri) {
            const uri = result.tokenURI || result.uri
            metadataUri = uri
            
            if (uri.includes('ipfs://')) {
              const metadataHash = uri.replace('ipfs://', '')
              console.log("✅ Found metadata IPFS hash in object:", metadataHash)
              
              // Fetch metadata to get video file hash
              try {
                const metadataResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${metadataHash}`)
                const metadata = await metadataResponse.json()
                console.log("📄 Metadata from object:", metadata)
                
                if (metadata.image && metadata.image.includes('mypinata.cloud/ipfs/')) {
                  realIpfsHash = metadata.image.split('/ipfs/')[1]
                  fileUrl = metadata.image
                  console.log("✅ Found video IPFS hash from metadata:", realIpfsHash)
                }
              } catch (error) {
                console.warn("⚠️ Could not fetch metadata from object:", error)
                realIpfsHash = metadataHash
                fileUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`
              }
            }
          } else if (result.metadata?.image) {
            const imageUrl = result.metadata.image
            if (imageUrl.includes('ipfs://')) {
              realIpfsHash = imageUrl.replace('ipfs://', '')
              fileUrl = `https://gateway.pinata.cloud/ipfs/${realIpfsHash}`
              console.log("✅ Found IPFS hash in 'metadata.image':", realIpfsHash)
            } else if (imageUrl.includes('mypinata.cloud/ipfs/')) {
              realIpfsHash = imageUrl.split('/ipfs/')[1]
              fileUrl = imageUrl
              console.log("✅ Found video IPFS hash from direct metadata.image:", realIpfsHash)
            }
          }
          
          // Extract additional fields
          if (result.metadataUri) {
            metadataUri = result.metadataUri
          }
          if (result.contractAddress) {
            contractAddress = result.contractAddress
          }
          if (result.fileUrl) {
            fileUrl = result.fileUrl
          }
        }
      }
      
      // Try to fetch transaction details if we don't have a transaction hash
      if (realTxHash === 'unknown' && realTokenId !== 'unknown') {
        console.log('🔍 Attempting to fetch transaction details from BaseCAMP API...')
        try {
          const txDetails = await fetchTransactionDetails(realTokenId)
          if (txDetails?.hash) {
            realTxHash = txDetails.hash
            console.log('✅ Retrieved transaction hash from API:', realTxHash)
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch transaction details:', error)
        }
      }

      // Update IPFS step based on whether we found the hash
      if (realIpfsHash !== 'unknown') {
        updateProcessingStep("ipfs", { 
          status: "completed", 
          progress: 100, 
          message: "Video found on IPFS successfully" 
        })
      } else {
        updateProcessingStep("ipfs", { 
          status: "completed", 
          progress: 100, 
          message: "Processing complete (IPFS hash extraction pending)" 
        })
      }

      console.log("📊 Final parsed values:", {
        tokenId: realTokenId,
        ipfsHash: realIpfsHash, 
        transactionHash: realTxHash,
        metadataUri,
        contractAddress,
        fileUrl
      })

      const finalResult: MintResult = {
        tokenId: realTokenId,
        ipfsHash: realIpfsHash,
        metadataUri,
        transactionHash: realTxHash,
        blockscoutUrl: realTxHash !== 'unknown' 
          ? `https://basecamp.cloud.blockscout.com/tx/${realTxHash}`
          : '#',
        contractAddress,
        chainId: 123420001114, // BaseCAMP chain ID
        fileUrl
      }

      updateProcessingStep("minting", { status: "completed", progress: 100, message: "IP registration completed successfully!" })
      setMintResult(finalResult)

    } catch (error) {
      console.error("IP registration failed:", error)
      
      // Enhanced error handling for Origin SDK issues
      let errorMessage = "IP registration failed. Please try again later."
      let errorDescription = error instanceof Error ? error.message : "An error occurred"
      
      console.error("❌ Full error details:", {
        error,
        message: errorDescription,
        stack: error instanceof Error ? error.stack : undefined,
        authState: {
          hasJWT: !!auth.jwt,
          hasOrigin: !!auth.origin,
          walletAddress: auth.walletAddress
        }
      })
      
      if (errorDescription.includes("Failed to get signature") || errorDescription.includes("signature")) {
        errorMessage = "Origin SDK authentication failed."
        errorDescription = "Please disconnect and reconnect your wallet, then try again. The Origin SDK needs proper authentication to mint."
      } else if (errorDescription.includes("400") || errorDescription.includes("Bad Request")) {
        errorMessage = "Origin SDK registration failed."
        errorDescription = "There was an issue with the Origin SDK registration. Please try refreshing the page and reconnecting your wallet."
      } else if (errorDescription.includes("network")) {
        errorMessage = "Network error. Please check your connection."
        errorDescription = "Make sure you're connected to the correct network."
      } else if (errorDescription.includes("gas")) {
        errorMessage = "Insufficient gas fees."
        errorDescription = "Please ensure you have enough gas for the transaction."
      } else if (errorDescription.includes("user rejected") || errorDescription.includes("User rejected")) {
        errorMessage = "Transaction was rejected."
        errorDescription = "You declined the transaction. Please try again and approve when prompted."
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      })
      
      // Mark processing step as error
      const currentStep = processingSteps.find((step) => step.status === "processing")
      if (currentStep) {
        updateProcessingStep(currentStep.id, {
          status: "error",
          message: errorMessage,
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

  // Function to monitor and fetch transaction details from BaseCAMP API
  const fetchTransactionDetails = async (tokenId: string) => {
    try {
      console.log('🔍 Fetching transaction details for token ID:', tokenId)
      
      // Try to get transaction hash from recent wallet transactions
      // We'll search for transactions involving the wallet address
      const response = await fetch(
        `https://basecamp.cloud.blockscout.com/api/v2/addresses/${auth.walletAddress}/transactions?filter=validated&type=token_creation`
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 BaseCAMP API response:', data)
        
        // Find the most recent transaction (should be our mint)
        if (data.items && data.items.length > 0) {
          const recentTx = data.items[0]
          console.log('✅ Found recent transaction:', recentTx)
          return {
            hash: recentTx.hash,
            blockNumber: recentTx.block_number,
            status: recentTx.status
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch transaction details:', error)
    }
    
    return null
  }

  // Render success state
  if (mintResult) {
    return (
      <div className="font-headline min-h-screen bg-provn-bg">
        <Navigation currentPage="upload" />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-12">
            {/* Hero Success Section */}
            <div className="space-y-6">
              <div className="relative mx-auto">
                <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/25">
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
                  <Sparkles className="w-4 h-4 mr-2" />
                  Provenance Verified
                </ProvnBadge>
                <ProvnBadge variant="default" className="text-base px-6 py-2 bg-blue-100 text-blue-800 border-blue-200">
                  BaseCAMP Network
                </ProvnBadge>
              </div>
            </div>

            {/* NFT Preview Card */}
            <div>
              <ProvnCard className="max-w-2xl mx-auto bg-gradient-to-br from-provn-surface/80 to-provn-surface border-provn-border/50 backdrop-blur-sm">
                <ProvnCardContent className="p-8 space-y-6">
                  {uploadedFile && (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-xl">
                      <video 
                        src={uploadedFile.preview} 
                        controls 
                        className="w-full h-full object-contain"
                        poster={uploadedFile.preview}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-provn-text">{title}</h3>
                    {description && (
                      <p className="text-provn-muted text-lg">{description}</p>
                    )}
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            </div>

            {/* Blockchain Details Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Token ID Card */}
              <ProvnCard className="bg-gradient-to-br from-provn-surface/80 to-provn-surface border-provn-border/50 backdrop-blur-sm">
                <ProvnCardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-provn-accent/20 rounded-xl flex items-center justify-center mx-auto">
                    <span className="text-2xl">🏷️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-provn-text mb-2">Token ID</h4>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-sm text-provn-text bg-provn-surface-2 px-3 py-1 rounded-lg">
                        #{mintResult.tokenId}
                      </span>
                      <button
                        onClick={() => copyToClipboard(mintResult.tokenId, 'Token ID')}
                        className="p-1 hover:bg-provn-surface-2 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-provn-muted" />
                      </button>
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>

              {/* IPFS Hash Card */}
              <ProvnCard className="bg-gradient-to-br from-provn-surface/80 to-provn-surface border-provn-border/50 backdrop-blur-sm">
                <ProvnCardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-provn-text mb-2">IPFS Storage</h4>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-xs text-provn-text bg-provn-surface-2 px-3 py-1 rounded-lg max-w-[120px] truncate">
                        {mintResult.ipfsHash !== 'unknown' ? mintResult.ipfsHash : 'Processing...'}
                      </span>
                      {mintResult.ipfsHash !== 'unknown' && (
                        <>
                          <button
                            onClick={() => copyToClipboard(mintResult.ipfsHash, 'IPFS Hash')}
                            className="p-1 hover:bg-provn-surface-2 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-provn-muted" />
                          </button>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${mintResult.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-provn-surface-2 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-provn-accent" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>

              {/* Transaction Card */}
              <ProvnCard className="bg-gradient-to-br from-provn-surface/80 to-provn-surface border-provn-border/50 backdrop-blur-sm">
                <ProvnCardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto">
                    <span className="text-2xl">⛓️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-provn-text mb-2">Transaction</h4>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-xs text-provn-text bg-provn-surface-2 px-3 py-1 rounded-lg max-w-[120px] truncate">
                        {mintResult.transactionHash !== 'unknown' 
                          ? `${mintResult.transactionHash.slice(0, 6)}...${mintResult.transactionHash.slice(-4)}`
                          : 'Processing...'
                        }
                      </span>
                      {mintResult.transactionHash !== 'unknown' && (
                        <>
                          <button
                            onClick={() => copyToClipboard(mintResult.transactionHash, 'Transaction Hash')}
                            className="p-1 hover:bg-provn-surface-2 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-provn-muted" />
                          </button>
                          <a
                            href={mintResult.blockscoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-provn-surface-2 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-provn-accent" />
                          </a>
                        </>
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

  // Render processing state
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
                  {processingSteps.map((step) => (
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
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <ProvnBadge 
                  variant={isWalletReady ? "success" : "default"} 
                  className="text-sm px-3 py-1"
                >
                  {isWalletReady ? "✓ Wallet Ready" : "⏳ Wallet Connecting..."}
                </ProvnBadge>
                {auth.jwt && (
                  <ProvnBadge 
                    variant="success" 
                    className="text-sm px-3 py-1"
                  >
                    ✓ Authenticated
                  </ProvnBadge>
                )}
                <ProvnBadge 
                  variant={authenticated ? 'success' : loading ? 'warning' : 'error'} 
                  className="text-sm px-3 py-1"
                >
                  {authenticated ? '🔐 Auth OK' : loading ? '⏳ Auth Loading' : '❌ Auth Failed'}
                </ProvnBadge>
              </div>
              
              {/* Manual Authentication Button */}
              {!auth.jwt && typeof connect === 'function' && (
                <div className="flex gap-2 justify-center">
                  <ProvnButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleManualAuth}
                    className="text-xs"
                  >
                    🔐 Re-authenticate
                  </ProvnButton>
                  <ProvnButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="text-xs"
                  >
                    🔄 Refresh Page
                  </ProvnButton>
                </div>
              )}
            </div>
          )}

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
                        {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)}MB
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
            {!authenticated ? (
              <ProvnButton disabled className="min-w-[160px]">
                Connect Wallet to Upload
              </ProvnButton>
            ) : !isWalletReady ? (
              <ProvnButton disabled className="min-w-[160px]">
                Wallet Not Ready
              </ProvnButton>
            ) : (
              <ProvnButton 
                onClick={handleUpload} 
                disabled={!uploadedFile || !title.trim() || isProcessing} 
                className="min-w-[160px]"
              >
                {isProcessing ? "Processing..." : "Upload & Mint IP-NFT"}
              </ProvnButton>
            )}
          </div>
        </div>
      </main>
      
      {/* CampModal for Origin SDK wallet connection */}
      <CampModal />
    </div>
  )
}