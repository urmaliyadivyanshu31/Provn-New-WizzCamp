import { useState, useEffect } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { toast } from 'sonner'
import { LicenseTerms } from '@/types/explore'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { encodeFunctionData, parseAbi } from 'viem'

// Success result interface
interface PurchaseResult {
  success: boolean
  transactionHash?: string
  receipt?: any
  error?: string
  expiryDate?: Date
}

export function useOriginLicensing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsCache, setTermsCache] = useState<Record<string, LicenseTerms>>({})
  const { origin, isAuthenticated, walletAddress } = useAuth()
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  
  // Enhanced Provn Marketplace contract ABI with community features
  const marketplaceABI = parseAbi([
    'function purchaseLicense(uint256 tokenId, uint32 periods) external',
    'function hasActiveLicense(address user, uint256 tokenId) external view returns (bool)',
    'function licenseExpiry(uint256 tokenId, address user) external view returns (uint64)',
    'function setLicenseTerms(uint256 tokenId, uint128 price, uint32 duration, uint8 licenseType, bool transferable, uint16 royaltyBps) external',
    'function createCommunity(uint256 creatorTokenId, string calldata name, string calldata description) external',
    'function joinCommunity(uint256 communityId) external',
    'function addDerivativeToCommunit(uint256 communityId, uint256 derivativeTokenId) external',
    'function getCommunityDetails(uint256 communityId) external view returns (uint256, address, string, string, uint64, uint64, uint64, uint8, bool)',
    'function canCreateCommunity(address creator) external view returns (bool)',
    'function isCommunityMember(uint256 communityId, address user) external view returns (bool)',
    'function getCreatorStats(address creator) external view returns (uint256, uint256, uint256)',
    'function protocolFeeBps() external view returns (uint16)',
    'function communityCounter() external view returns (uint256)'
  ])
  
  // IP-NFT contract ABI for getting license terms
  const ipNftABI = parseAbi([
    'function getTerms(uint256 tokenId) external view returns (uint128 price, uint32 duration, uint16 royaltyBps, address paymentToken)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function dataStatus(uint256 tokenId) external view returns (uint8)'
  ])
  
  // Contract addresses - will be updated after deployment
  const PROVN_MARKETPLACE_CONTRACT = process.env.NEXT_PUBLIC_PROVN_MARKETPLACE_CONTRACT || '0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981'
  const IP_NFT_CONTRACT = '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1'
  const CAMP_TOKEN_CONTRACT = '0x618a32eae7dEE87dD7dF8DF24D18dc98fb6Df8Ab'
  
  // Set up wallet client for Origin SDK
  useEffect(() => {
    if (origin && walletClient && isAuthenticated) {
      console.log('🔌 Setting up wallet client for Origin SDK...')
      try {
        // Use the Origin SDK's setViemClient method
        if (typeof origin.setViemClient === 'function') {
          origin.setViemClient(walletClient)
          console.log('✅ Wallet client connected to Origin SDK')
        } else {
          console.warn('⚠️ Origin SDK setViemClient method not available')
        }
      } catch (error) {
        console.error('❌ Failed to set wallet client:', error)
      }
    }
  }, [origin, walletClient, isAuthenticated])

  const buyLicense = async (tokenId: string, periods: number): Promise<PurchaseResult> => {
    if (!isAuthenticated || !origin) {
      setError('Please connect your wallet first')
      return { success: false, error: 'Please connect your wallet first' }
    }

    if (periods <= 0) {
      setError('Number of periods must be greater than 0')
      return { success: false, error: 'Number of periods must be greater than 0' }
    }

    // Validate tokenId before proceeding
    if (!tokenId || typeof tokenId !== 'string') {
      setError('Invalid token ID provided')
      return { success: false, error: 'Invalid token ID provided' }
    }
    
    // Check if tokenId is a valid number
    const tokenIdNum = tokenId.trim()
    if (!/^\d+$/.test(tokenIdNum)) {
      console.error('❌ Invalid tokenId format:', {
        tokenId,
        type: typeof tokenId,
        length: tokenId.length,
        isNumeric: /^\d+$/.test(tokenIdNum)
      })
      setError(`Invalid token ID format: ${tokenId}. Must be a numeric string.`)
      return { success: false, error: 'Invalid token ID format' }
    }

    setLoading(true)
    setError(null)

    try {
      console.log('💳 Purchasing license:', {
        tokenId: tokenIdNum,
        tokenIdOriginal: tokenId,
        periods,
        wallet: walletAddress,
        tokenIdBigInt: BigInt(tokenIdNum).toString()
      })

      // Get license terms from Origin Protocol with fallback
      let terms
      try {
        const tokenBigInt = BigInt(tokenIdNum)
        console.log('🔢 Converting tokenId to BigInt:', {
          original: tokenId,
          cleaned: tokenIdNum,
          bigInt: tokenBigInt.toString()
        })
        terms = await origin.getTerms(tokenBigInt)
        console.log('📋 License terms from Origin SDK:', terms)
      } catch (termsError) {
        console.warn('⚠️ Failed to get terms from Origin SDK, trying direct contract call:', termsError)
        
        // Fallback: Direct contract call to IP-NFT contract
        if (publicClient) {
          try {
            const result = await publicClient.readContract({
              address: IP_NFT_CONTRACT as `0x${string}`,
              abi: ipNftABI,
              functionName: 'getTerms',
              args: [BigInt(tokenIdNum)]
            })
            
            terms = {
              price: result[0],
              duration: Number(result[1]),
              royaltyBps: Number(result[2]),
              paymentToken: result[3]
            }
            console.log('📋 License terms from direct IP-NFT contract:', terms)
          } catch (directError) {
            console.error('❌ Failed to get terms from direct contract call:', directError)
            throw new Error('Unable to fetch license terms. Please check your connection.')
          }
        } else {
          throw termsError
        }
      }

      // Calculate total cost
      const totalCost = terms.price * BigInt(periods)
      console.log('💰 Total cost:', totalCost.toString(), 'wei')
      
      let result
      
      // Method 1: Try Origin SDK with proper wallet client setup
      if (walletClient && typeof origin.setViemClient === 'function') {
        try {
          origin.setViemClient(walletClient)
          console.log('🔌 Wallet client connected to Origin SDK')
          
          // Try buyAccessSmart first
          console.log('🔄 Attempting Origin SDK buyAccessSmart...')
          if (typeof origin.buyAccessSmart === 'function') {
            result = await origin.buyAccessSmart(BigInt(tokenIdNum), periods)
            console.log('✅ buyAccessSmart successful:', result)
          } else {
            throw new Error('buyAccessSmart not available')
          }
        } catch (sdkError) {
          console.warn('⚠️ Origin SDK failed:', sdkError)
          
          // Method 2: Direct contract interaction
          console.log('🔄 Attempting direct contract interaction...')
          
          if (!walletClient) {
            throw new Error('Wallet not connected for direct contract call')
          }
          
          try {
            // Prepare transaction data for purchaseLicense(tokenId, periods)
            const txData = encodeFunctionData({
              abi: marketplaceABI,
              functionName: 'purchaseLicense',
              args: [BigInt(tokenIdNum), periods]
            })
            
            console.log('📝 Transaction data prepared:', {
              to: PROVN_MARKETPLACE_CONTRACT,
              data: txData,
              buyer: walletAddress,
              tokenId: tokenIdNum,
              tokenIdBigInt: BigInt(tokenIdNum).toString(),
              periods
            })
            
            // Send transaction directly
            const hash = await walletClient.sendTransaction({
              to: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
              data: txData,
              gas: BigInt(300000) // Provide gas limit
            })
            
            console.log('✅ Direct contract transaction sent:', hash)
            
            // Wait for confirmation
            if (publicClient) {
              const receipt = await publicClient.waitForTransactionReceipt({ hash })
              console.log('✅ Transaction confirmed:', receipt)
              result = { hash, receipt }
            } else {
              result = { hash }
            }
            
          } catch (directError) {
            console.error('❌ Direct contract call failed:', directError)
            throw directError
          }
        }
      } else {
        throw new Error('Wallet client not available')
      }
      
      console.log('✅ License purchase result:', result)

      toast.success(`Successfully purchased ${periods} period(s) license!`)
      
              // Track purchase in our backend
        try {
          await fetch('/api/licenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenId: tokenIdNum,
              periods,
              totalCost: totalCost.toString(),
              purchaser: walletAddress,
              timestamp: new Date().toISOString()
            })
          })
      } catch (trackingError) {
        console.warn('⚠️ Failed to track purchase in backend:', trackingError)
        // Don't fail the entire transaction for tracking errors
      }

      return {
        success: true,
        transactionHash: result.hash,
        receipt: result.receipt,
        expiryDate: result.expiryDate
      }
    } catch (err) {
      console.error('❌ Failed to buy license:', err)
      
      // Extract more meaningful error messages
      let errorMessage = 'Failed to purchase license'
      
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient CAMP tokens for this purchase'
        } else if (err.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected'
        } else if (err.message.includes('WalletClient not connected')) {
          errorMessage = 'Wallet connection lost. Please reconnect and try again.'
        } else if (err.message.includes('AbiEncodingLengthMismatch')) {
          errorMessage = 'Contract integration error. Please try reconnecting your wallet.'
        } else if (err.message.includes('buyAccessSmart not available')) {
          errorMessage = 'Using direct contract method...'
        } else if (err.message.includes('HTTP request failed')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = async (tokenId: string, userAddress?: string): Promise<boolean> => {
    const address = userAddress || walletAddress
    if (!address || !publicClient) return false

    try {
      // First try Origin SDK
      if (origin) {
        try {
          const hasAccessResult = await (origin as any).hasAccess(BigInt(tokenId), address)
          return hasAccessResult
        } catch (sdkError) {
          console.warn('⚠️ Origin SDK hasAccess failed, trying direct contract:', sdkError)
        }
      }

      // Fallback to direct contract call
      const hasLicense = await publicClient.readContract({
        address: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
        abi: marketplaceABI,
        functionName: 'hasActiveLicense',
        args: [address as `0x${string}`, BigInt(tokenId)]
      })
      
      return hasLicense
    } catch (error) {
      console.error('Failed to check access:', error)
      return false
    }
  }

  const getLicenseTerms = async (tokenId: string): Promise<LicenseTerms | null> => {
    // Validate tokenId
    if (!tokenId || typeof tokenId !== 'string') {
      console.error('❌ Invalid tokenId in getLicenseTerms:', tokenId)
      return null
    }
    
    const tokenIdNum = tokenId.trim()
    if (!/^\d+$/.test(tokenIdNum)) {
      console.error('❌ Invalid tokenId format in getLicenseTerms:', {
        tokenId,
        cleaned: tokenIdNum,
        isNumeric: /^\d+$/.test(tokenIdNum)
      })
      return null
    }
    
    // Check cache first
    if (termsCache[tokenIdNum]) {
      console.log('📋 Using cached terms for tokenId:', tokenIdNum);
      return termsCache[tokenIdNum];
    }
    
    try {
      let terms
      
      // Try Origin SDK first
      if (origin) {
        try {
          const tokenBigInt = BigInt(tokenIdNum)
          console.log('🔢 getLicenseTerms converting tokenId:', {
            original: tokenId,
            cleaned: tokenIdNum,
            bigInt: tokenBigInt.toString()
          })
          terms = await origin.getTerms(tokenBigInt)
          console.log('📋 Terms fetched from Origin SDK for tokenId:', tokenIdNum, terms)
        } catch (sdkError) {
          console.warn('⚠️ Origin SDK getTerms failed:', sdkError)
          throw sdkError
        }
      } else {
        throw new Error('Origin SDK not available')
      }
      
      const licenseTerms = {
        price: terms.price,
        duration: terms.duration,
        royaltyBps: terms.royaltyBps,
        paymentToken: terms.paymentToken
      };
      
      // Cache the result
      setTermsCache(prev => ({ ...prev, [tokenIdNum]: licenseTerms }));
      
      return licenseTerms
    } catch (error) {
      console.warn('⚠️ Failed to get license terms from SDK, trying direct contract...')
      
      // Fallback: Direct contract call to IP-NFT contract
      if (publicClient) {
        try {
          const result = await publicClient.readContract({
            address: IP_NFT_CONTRACT as `0x${string}`,
            abi: ipNftABI,
            functionName: 'getTerms',
            args: [BigInt(tokenIdNum)]
          })
          
          const licenseTerms = {
            price: result[0],
            duration: Number(result[1]),
            royaltyBps: Number(result[2]),
            paymentToken: result[3]
          };
          
          // Cache the result
          setTermsCache(prev => ({ ...prev, [tokenIdNum]: licenseTerms }));
          
          return licenseTerms
        } catch (directError) {
          console.error('❌ Direct IP-NFT contract getTerms failed:', directError)
        }
      }
      
      console.error('All methods failed to get license terms:', error)
      return null
    }
  }

  const getSubscriptionExpiry = async (tokenId: string, userAddress?: string): Promise<Date | null> => {
    if (!origin) return null

    try {
      const address = userAddress || walletAddress
      if (!address) return null

      const expiry = await (origin as any).subscriptionExpiry(BigInt(tokenId), address)
      return new Date(Number(expiry) * 1000)
    } catch (error) {
      console.error('Failed to get subscription expiry:', error)
      return null
    }
  }

  const renewAccess = async (tokenId: string, periods: number): Promise<boolean> => {
    if (!isAuthenticated || !origin) {
      setError('Please connect your wallet first')
      return false
    }

    if (periods <= 0) {
      setError('Number of periods must be greater than 0')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Renewing license:', {
        tokenId,
        periods,
        wallet: walletAddress
      })

      const result = await (origin as any).renewAccess(BigInt(tokenId), periods)
      console.log('✅ License renewal result:', result)

      toast.success(`Successfully renewed license for ${periods} period(s)!`)
      return true
    } catch (err) {
      console.error('❌ Failed to renew license:', err)
      
      let errorMessage = 'Failed to renew license'
      
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient CAMP tokens for renewal'
        } else if (err.message.includes('user rejected')) {
          errorMessage = 'Renewal transaction was rejected'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Community-related functions
  const canCreateCommunity = async (creatorAddress?: string): Promise<boolean> => {
    if (!publicClient) return false
    
    try {
      const address = creatorAddress || walletAddress
      if (!address) return false
      
      const canCreate = await publicClient.readContract({
        address: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
        abi: marketplaceABI,
        functionName: 'canCreateCommunity',
        args: [address as `0x${string}`]
      })
      
      return canCreate
    } catch (error) {
      console.error('Failed to check community creation eligibility:', error)
      return false
    }
  }

  const createCommunity = async (tokenId: string, name: string, description: string) => {
    if (!isAuthenticated || !walletClient) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      const txData = encodeFunctionData({
        abi: marketplaceABI,
        functionName: 'createCommunity',
        args: [BigInt(tokenId), name, description]
      })

      const hash = await walletClient.sendTransaction({
        to: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
        data: txData,
        gas: BigInt(400000)
      })

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }

      toast.success('Community created successfully!')
      return { success: true, hash }
    } catch (error) {
      console.error('Failed to create community:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create community'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const joinCommunity = async (communityId: number) => {
    if (!isAuthenticated || !walletClient) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      const txData = encodeFunctionData({
        abi: marketplaceABI,
        functionName: 'joinCommunity',
        args: [BigInt(communityId)]
      })

      const hash = await walletClient.sendTransaction({
        to: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
        data: txData,
        gas: BigInt(200000)
      })

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }

      toast.success('Joined community successfully!')
      return { success: true, hash }
    } catch (error) {
      console.error('Failed to join community:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to join community'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const addDerivativeToCommunity = async (communityId: number, derivativeTokenId: string) => {
    if (!isAuthenticated || !walletClient) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      const txData = encodeFunctionData({
        abi: marketplaceABI,
        functionName: 'addDerivativeToCommunit',
        args: [BigInt(communityId), BigInt(derivativeTokenId)]
      })

      const hash = await walletClient.sendTransaction({
        to: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
        data: txData,
        gas: BigInt(300000)
      })

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }

      toast.success('Derivative added to community successfully!')
      return { success: true, hash }
    } catch (error) {
      console.error('Failed to add derivative to community:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add derivative'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getCommunityDetails = async (communityId: number) => {
    if (!publicClient) return null

    try {
      const details = await publicClient.readContract({
        address: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
        abi: marketplaceABI,
        functionName: 'getCommunityDetails',
        args: [BigInt(communityId)]
      })

      return {
        creatorTokenId: details[0].toString(),
        creator: details[1],
        name: details[2],
        description: details[3],
        createdAt: Number(details[4]),
        memberCount: Number(details[5]),
        derivativeCount: Number(details[6]),
        tier: Number(details[7]),
        active: details[8]
      }
    } catch (error) {
      console.error('Failed to get community details:', error)
      return null
    }
  }

  const isCommunityMember = async (communityId: number, userAddress?: string): Promise<boolean> => {
    if (!publicClient) return false
    
    try {
      const address = userAddress || walletAddress
      if (!address) return false
      
      const isMember = await publicClient.readContract({
        address: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
        abi: marketplaceABI,
        functionName: 'isCommunityMember',
        args: [BigInt(communityId), address as `0x${string}`]
      })
      
      return isMember
    } catch (error) {
      console.error('Failed to check community membership:', error)
      return false
    }
  }

  const getCreatorStats = async (creatorAddress: string) => {
    if (!publicClient) return null

    try {
      const stats = await publicClient.readContract({
        address: PROVN_MARKETPLACE_CONTRACT as `0x${string}`,
        abi: marketplaceABI,
        functionName: 'getCreatorStats',
        args: [creatorAddress as `0x${string}`]
      })

      return {
        revenue: stats[0].toString(),
        licensesSold: Number(stats[1]),
        derivatives: Number(stats[2])
      }
    } catch (error) {
      console.error('Failed to get creator stats:', error)
      return null
    }
  }

  return {
    // Original licensing functions
    buyLicense,
    hasAccess,
    getLicenseTerms,
    getSubscriptionExpiry,
    renewAccess,
    
    // Community functions
    canCreateCommunity,
    createCommunity,
    joinCommunity,
    addDerivativeToCommunity,
    getCommunityDetails,
    isCommunityMember,
    getCreatorStats,
    
    // State
    loading,
    error,
    clearError: () => setError(null)
  }
}