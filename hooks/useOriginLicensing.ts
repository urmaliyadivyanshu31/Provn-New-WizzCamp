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
  const { origin, isAuthenticated, walletAddress } = useAuth()
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  
  // Marketplace contract ABI (actual contract functions)
  const marketplaceABI = parseAbi([
    'function buyAccess(address buyer, uint256 tokenId, uint32 periods) external payable',
    'function hasAccess(address user, uint256 tokenId) external view returns (bool)',
    'function subscriptionExpiry(uint256 tokenId, address user) external view returns (uint256)',
    'function protocolFeeBps() external view returns (uint16)',
    'function treasury() external view returns (address)',
    'function maxSubscriptionPeriod() external view returns (uint256)'
  ])
  
  // IP-NFT contract ABI for getting license terms
  const ipNftABI = parseAbi([
    'function getTerms(uint256 tokenId) external view returns (uint128 price, uint32 duration, uint16 royaltyBps, address paymentToken)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function dataStatus(uint256 tokenId) external view returns (uint8)'
  ])
  
  const MARKETPLACE_CONTRACT = '0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981'
  const IP_NFT_CONTRACT = '0xF90733b9eCDa3b49C250B2C3E3E42c96fC93324E' // From the transaction details
  
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

    setLoading(true)
    setError(null)

    try {
      console.log('💳 Purchasing license:', {
        tokenId,
        periods,
        wallet: walletAddress
      })

      // Get license terms from Origin Protocol with fallback
      let terms
      try {
        terms = await origin.getTerms(BigInt(tokenId))
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
              args: [BigInt(tokenId)]
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
            result = await origin.buyAccessSmart(BigInt(tokenId), periods)
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
            // Prepare transaction data for buyAccess(buyer, tokenId, periods)
            const txData = encodeFunctionData({
              abi: marketplaceABI,
              functionName: 'buyAccess',
              args: [walletAddress as `0x${string}`, BigInt(tokenId), periods]
            })
            
            console.log('📝 Transaction data prepared:', {
              to: MARKETPLACE_CONTRACT,
              data: txData,
              value: totalCost.toString(),
              buyer: walletAddress,
              tokenId,
              periods
            })
            
            // Send transaction directly
            const hash = await walletClient.sendTransaction({
              to: MARKETPLACE_CONTRACT as `0x${string}`,
              data: txData,
              value: totalCost,
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
            tokenId,
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
    if (!origin) return false

    try {
      const address = userAddress || walletAddress
      if (!address) return false

      const hasAccessResult = await (origin as any).hasAccess(BigInt(tokenId), address)
      return hasAccessResult
    } catch (error) {
      console.error('Failed to check access:', error)
      return false
    }
  }

  const getLicenseTerms = async (tokenId: string): Promise<LicenseTerms | null> => {
    try {
      let terms
      
      // Try Origin SDK first
      if (origin) {
        try {
          terms = await origin.getTerms(BigInt(tokenId))
          console.log('📋 Terms from Origin SDK:', terms)
        } catch (sdkError) {
          console.warn('⚠️ Origin SDK getTerms failed:', sdkError)
          throw sdkError
        }
      } else {
        throw new Error('Origin SDK not available')
      }
      
      return {
        price: terms.price,
        duration: terms.duration,
        royaltyBps: terms.royaltyBps,
        paymentToken: terms.paymentToken
      }
    } catch (error) {
      console.warn('⚠️ Failed to get license terms from SDK, trying direct contract...')
      
      // Fallback: Direct contract call to IP-NFT contract
      if (publicClient) {
        try {
          const result = await publicClient.readContract({
            address: IP_NFT_CONTRACT as `0x${string}`,
            abi: ipNftABI,
            functionName: 'getTerms',
            args: [BigInt(tokenId)]
          })
          
          return {
            price: result[0],
            duration: Number(result[1]),
            royaltyBps: Number(result[2]),
            paymentToken: result[3]
          }
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

  return {
    buyLicense,
    hasAccess,
    getLicenseTerms,
    getSubscriptionExpiry,
    renewAccess,
    loading,
    error,
    clearError: () => setError(null)
  }
}