import { useState, useEffect } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { toast } from 'sonner'
import { LicenseTerms } from '@/types/explore'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { encodeFunctionData, parseAbi } from 'viem'

// Extend window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

// Success result interface
interface PurchaseResult {
  success: boolean
  transactionHash?: string
  receipt?: any
  error?: string
  expiryDate?: Date
}

// Error categorization
const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase()
  return message.includes('network error') ||
         message.includes('timeout') ||
         message.includes('rate limit') ||
         message.includes('429') ||
         message.includes('too many requests') ||
         message.includes('http request failed') ||
         message.includes('connection') ||
         message.includes('fetch')
}

const isNonRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase()
  return message.includes('user rejected') ||
         message.includes('insufficient funds') ||
         message.includes('invalid address') ||
         message.includes('pgrst116') ||
         message.includes('execution reverted') ||
         message.includes('contract call failed') ||
         message.includes('abi encoding')
}

// Circuit breaker state
let rpcFailureCount = 0
let rpcLastFailure = 0
const RPC_CIRCUIT_BREAKER_THRESHOLD = 5
const RPC_CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minute

const isRpcCircuitOpen = (): boolean => {
  if (rpcFailureCount >= RPC_CIRCUIT_BREAKER_THRESHOLD) {
    return Date.now() - rpcLastFailure < RPC_CIRCUIT_BREAKER_TIMEOUT
  }
  return false
}

const recordRpcFailure = () => {
  rpcFailureCount++
  rpcLastFailure = Date.now()
}

const resetRpcCircuit = () => {
  rpcFailureCount = 0
  rpcLastFailure = 0
}

// Retry utility with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  // Check circuit breaker
  if (isRpcCircuitOpen()) {
    throw new Error('RPC circuit breaker is open. Too many recent failures.')
  }
  
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      
      // Success - reset circuit breaker
      if (rpcFailureCount > 0) {
        resetRpcCircuit()
        console.log('✅ RPC circuit breaker reset after successful call')
      }
      
      return result
    } catch (error) {
      lastError = error as Error
      
      // Record RPC failures
      if (isRetryableError(lastError)) {
        recordRpcFailure()
        console.warn(`🚫 RPC failure ${rpcFailureCount}/${RPC_CIRCUIT_BREAKER_THRESHOLD}:`, lastError.message)
      }
      
      // Don't retry for non-retryable errors
      if (isNonRetryableError(lastError)) {
        throw lastError
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Wait with exponential backoff for retryable errors
      if (isRetryableError(lastError)) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        console.warn(`⏳ Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await sleep(delay)
      } else {
        // Non-categorized errors get one retry with shorter delay
        const delay = Math.min(1000, baseDelay * Math.pow(2, attempt))
        console.warn(`⚠️ Unknown error, retrying after ${delay}ms:`, lastError.message)
        await sleep(delay)
      }
    }
  }
  
  throw lastError!
}

export function useOriginLicensing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsCache, setTermsCache] = useState<Record<string, LicenseTerms>>({})
  const { origin, isAuthenticated, walletAddress } = useAuth()
  const { data: walletClient } = useWalletClient({ chainId: 123420001114 }) // BaseCAMP chainId
  const { address } = useAccount()
  const publicClient = usePublicClient()
  
  // Actual Marketplace contract ABI with buyAccess() function
  const marketplaceABI = parseAbi([
    'function buyAccess(address buyer, uint256 tokenId, uint32 periods) external',
    'function subscriptionExpiry(uint256 tokenId, address buyer) external view returns (uint256)',
    'function hasAccess(address buyer, uint256 tokenId) external view returns (bool)',
    'function getTerms(uint256 tokenId) external view returns (uint128 price, uint32 duration, uint16 royaltyBps, address paymentToken)',
    'function setTerms(uint256 tokenId, uint128 price, uint32 duration, uint16 royaltyBps, address paymentToken) external',
    'function totalRevenue(address creator) external view returns (uint256)',
    'function totalRoyalty(address creator) external view returns (uint256)',
    'function ipToken() external view returns (address)',
    'function provnToken() external view returns (address)',
    'event AccessPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price, uint32 periods, uint256 expiry)'
  ])
  
  // IP-NFT contract ABI for getting license terms
  const ipNftABI = parseAbi([
    'function getTerms(uint256 tokenId) external view returns (uint128 price, uint32 duration, uint16 royaltyBps, address paymentToken)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function dataStatus(uint256 tokenId) external view returns (uint8)'
  ])
  
  // PROVN Token ABI for approvals
  const provnTokenABI = parseAbi([
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)'
  ])
  
  // Contract addresses - using actual Marketplace contract
  const MARKETPLACE_CONTRACT = '0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981'
  const IP_NFT_CONTRACT = '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1'
  const PROVN_TOKEN_CONTRACT = '0xa673B3E946A64037AdBAe22a0f56916dE43c678c'
  
  // Debug log to verify contract address
  console.log('🔧 Using Marketplace contract:', MARKETPLACE_CONTRACT)
  console.log('🔧 Using PROVN token contract:', PROVN_TOKEN_CONTRACT)
  
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

  const syncLicenseTerms = async (tokenId: string): Promise<boolean> => {
    if (!publicClient) {
      console.error('❌ Public client not available for sync')
      return false
    }

    // Get wallet client using the same logic as buyLicense
    let currentWalletClient
    try {
      if (walletClient) {
        currentWalletClient = walletClient
      } else if (typeof window !== 'undefined' && window.ethereum && isAuthenticated) {
        currentWalletClient = {
          sendTransaction: async (tx: any) => {
            const accounts = await window.ethereum!.request({ method: 'eth_accounts' })
            if (!accounts || accounts.length === 0) {
              throw new Error('No accounts available')
            }
            
            // Convert BigInt values to hex strings for JSON serialization
            const txParams = {
              from: accounts[0],
              to: tx.to,
              data: tx.data,
              gas: typeof tx.gas === 'bigint' ? '0x' + tx.gas.toString(16) : tx.gas,
              value: typeof tx.value === 'bigint' ? '0x' + tx.value.toString(16) : (tx.value || '0x0')
            }
            
            return await window.ethereum!.request({
              method: 'eth_sendTransaction',
              params: [txParams]
            })
          },
          account: { address: walletAddress }
        } as any
      } else {
        console.error('❌ No wallet client available for sync')
        return false
      }
    } catch (error) {
      console.error('❌ Failed to get wallet client for sync:', error)
      return false
    }

    try {
      const tokenIdBigInt = BigInt(tokenId)
      console.log('🔄 Syncing license terms for tokenId:', tokenId)

      // First get terms from IP-NFT contract
      const ipNftTerms = await publicClient.readContract({
        address: IP_NFT_CONTRACT as `0x${string}`,
        abi: ipNftABI,
        functionName: 'getTerms',
        args: [tokenIdBigInt]
      })

      // Then set them in Marketplace contract with PROVN token
      const txData = encodeFunctionData({
        abi: marketplaceABI,
        functionName: 'setTerms', 
        args: [tokenIdBigInt, ipNftTerms[0], ipNftTerms[1], ipNftTerms[2], PROVN_TOKEN_CONTRACT as `0x${string}`]
      })

      const hash = await currentWalletClient.sendTransaction({
        to: MARKETPLACE_CONTRACT as `0x${string}`,
        data: txData,
        gas: BigInt(150000)
      })

      await publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ License terms synced successfully:', hash)
      return true
    } catch (error) {
      console.warn('⚠️ Failed to sync license terms:', error)
      return false
    }
  }

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
        
        // Validate terms before proceeding
        if (!terms || !terms.price || terms.price <= 0) {
          // Try Marketplace contract as fallback
          if (publicClient) {
            try {
              const marketplaceTerms = await publicClient.readContract({
              address: MARKETPLACE_CONTRACT as `0x${string}`,
              abi: marketplaceABI,
              functionName: 'getTerms',
              args: [BigInt(tokenIdNum)]
            }) as readonly [bigint, number, number, `0x${string}`]
            
            terms = {
              price: marketplaceTerms[0],
              duration: Number(marketplaceTerms[1]),
              royaltyBps: Number(marketplaceTerms[2]),
              paymentToken: marketplaceTerms[3]
            }
              console.log('📋 License terms from Marketplace contract fallback:', terms)
            } catch (marketplaceError) {
              console.error('❌ Marketplace fallback failed:', marketplaceError)
              throw new Error('LicenseNotAvailable: No valid license terms found for this content')
            }
          } else {
            throw new Error('LicenseNotAvailable: No valid license terms found for this content')
          }
        }
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
            
            // Validate direct contract terms
            if (!terms.price || terms.price <= 0 || !terms.duration || terms.duration <= 0) {
              throw new Error('LicenseNotAvailable: License terms are not properly configured')
            }
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
      
      // CRITICAL FIX: Attempt to sync license terms from IP-NFT to ProvnMarketplace before purchase
      console.log('🔄 Attempting to sync license terms to ProvnMarketplace...')
      try {
        await syncLicenseTerms(tokenIdNum)
        console.log('✅ License terms sync successful')
      } catch (syncError) {
        console.warn('⚠️ License terms sync failed, but continuing with purchase (contract now reads from IP-NFT directly):', syncError)
      }
      
      let result
      
      // Enhanced wallet client check and retrieval
      const getWalletClient = () => {
        if (walletClient) {
          console.log('✅ Using wagmi walletClient:', walletClient)
          return walletClient
        }
        
        // Try to get from window.ethereum if available
        if (typeof window !== 'undefined' && window.ethereum && isAuthenticated) {
          console.log('🔄 Falling back to window.ethereum')
          // Return a basic wallet interface compatible with viem
          return {
            sendTransaction: async (tx: any) => {
              const accounts = await window.ethereum.request({ method: 'eth_accounts' })
              if (!accounts || accounts.length === 0) {
                throw new Error('No accounts available')
              }
              
              // Convert BigInt values to hex strings for JSON serialization
              const txParams = {
                from: accounts[0],
                to: tx.to,
                data: tx.data,
                gas: typeof tx.gas === 'bigint' ? '0x' + tx.gas.toString(16) : tx.gas,
                value: typeof tx.value === 'bigint' ? '0x' + tx.value.toString(16) : (tx.value || '0x0')
              }
              
              console.log('📝 Sending transaction with converted params:', txParams)
              
              return await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams]
              })
            },
            account: { address: walletAddress }
          } as any
        }
        
        throw new Error('No wallet client available')
      }

      // Method 1: Try Origin SDK with proper wallet client setup
      let currentWalletClient
      try {
        currentWalletClient = getWalletClient()
        console.log('🔌 Wallet client retrieved successfully')
      } catch (walletError) {
        console.error('❌ Wallet client not available:', walletError)
        throw new Error('Wallet client not available. Please ensure your wallet is properly connected and try refreshing the page.')
      }

      // Check and handle PROVN token approval if needed
      if (publicClient && terms.paymentToken === PROVN_TOKEN_CONTRACT) {
        console.log('💳 Checking PROVN token approval...')
        try {
          // Check current allowance
          const allowance = await publicClient.readContract({
            address: PROVN_TOKEN_CONTRACT as `0x${string}`,
            abi: provnTokenABI,
            functionName: 'allowance',
            args: [walletAddress as `0x${string}`, MARKETPLACE_CONTRACT as `0x${string}`]
          }) as bigint
          
          console.log('📊 Current allowance:', allowance.toString(), 'Required:', totalCost.toString())
          
          if (allowance < totalCost) {
            console.log('🔄 Approving PROVN tokens for marketplace...')
            
            // Prepare approval transaction
            const approvalTxData = encodeFunctionData({
              abi: provnTokenABI,
              functionName: 'approve',
              args: [MARKETPLACE_CONTRACT as `0x${string}`, totalCost]
            })
            
            const approvalHash = await currentWalletClient.sendTransaction({
              to: PROVN_TOKEN_CONTRACT as `0x${string}`,
              data: approvalTxData,
              gas: BigInt(60000), // Standard approval gas limit
              value: BigInt(0)
            })
            
            console.log('⏳ Waiting for PROVN approval confirmation:', approvalHash)
            
            // Wait for approval confirmation
            await publicClient.waitForTransactionReceipt({ hash: approvalHash })
            console.log('✅ PROVN token approval confirmed')
          } else {
            console.log('✅ Sufficient PROVN allowance already exists')
          }
        } catch (approvalError) {
          console.warn('⚠️ Failed to check/set PROVN approval:', approvalError)
          // Continue with purchase attempt - the contract will fail with a clear error if approval is needed
        }
      }

      if (currentWalletClient && typeof origin.setViemClient === 'function') {
        try {
          origin.setViemClient(currentWalletClient)
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
          
          if (!currentWalletClient) {
            throw new Error('Wallet not connected for direct contract call')
          }
          
          try {
            // Prepare transaction data for buyAccess(buyer, tokenId, periods)
            const txData = encodeFunctionData({
              abi: marketplaceABI,
              functionName: 'buyAccess',
              args: [walletAddress as `0x${string}`, BigInt(tokenIdNum), periods]
            })
            
            console.log('📝 Transaction data prepared:', {
              to: MARKETPLACE_CONTRACT,
              data: txData,
              buyer: walletAddress,
              tokenId: tokenIdNum,
              tokenIdBigInt: BigInt(tokenIdNum).toString(),
              periods
            })
            
            // Calculate transaction value - for PROVN token payments, this should be 0 (ERC-20 payment)
            // The actual PROVN payment happens via token approval + transferFrom inside the contract
            const txValue = BigInt(0) // ETH value is 0 for ERC-20 token payments
            
            // Send transaction directly
            const hash = await currentWalletClient.sendTransaction({
              to: MARKETPLACE_CONTRACT as `0x${string}`,
              data: txData,
              gas: BigInt(300000), // Provide gas limit
              value: txValue
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
        // Fallback: Direct contract interaction without Origin SDK
        console.log('🔄 Origin SDK not available, using direct contract interaction...')
        
        try {
          // Prepare transaction data for buyAccess(buyer, tokenId, periods)
          const txData = encodeFunctionData({
            abi: marketplaceABI,
            functionName: 'buyAccess',
            args: [walletAddress as `0x${string}`, BigInt(tokenIdNum), periods]
          })
          
          console.log('📝 Direct transaction data prepared:', {
            to: MARKETPLACE_CONTRACT,
            data: txData,
            buyer: walletAddress,
            tokenId: tokenIdNum,
            tokenIdBigInt: BigInt(tokenIdNum).toString(),
            periods
          })
          
          // Calculate transaction value - for PROVN token payments, this should be 0 (ERC-20 payment)
          const txValue = BigInt(0) // ETH value is 0 for ERC-20 token payments
          
          // Send transaction directly
          const hash = await currentWalletClient.sendTransaction({
            to: MARKETPLACE_CONTRACT as `0x${string}`,
            data: txData,
            gas: BigInt(300000), // Provide gas limit
            value: txValue
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
      
      console.log('✅ License purchase result:', result)

      toast.success(`Successfully purchased ${periods} period(s) license!`)
      
              // Track purchase in our backend
        try {
          const expiryDate = new Date(Date.now() + (terms.duration * periods * 1000)).toISOString()
          await fetch('/api/licenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token_id: tokenIdNum,
              licensee_address: walletAddress,
              license_type: 'basic',
              price_paid: (Number(totalCost) / 10**18).toString(), // Convert from wei to PROVN
              periods,
              duration_seconds: terms.duration * periods,
              expires_at: expiryDate,
              transaction_hash: result.hash,
              block_number: result.receipt?.blockNumber ? Number(result.receipt.blockNumber) : null
            })
          })
          console.log('✅ License purchase tracked in backend')
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
      
      // Extract more meaningful error messages with specific handling for licensing errors
      let errorMessage = 'Failed to purchase license'
      
      if (err instanceof Error) {
        const message = err.message.toLowerCase()
        
        if (message.includes('licensenotavailable') || message.includes('license not available')) {
          errorMessage = 'This content is not available for licensing. The creator may need to set up license terms.'
        } else if (message.includes('invalidperiods') || message.includes('invalid periods')) {
          errorMessage = 'Invalid license period selected. Please try a different period.'
        } else if (message.includes('noactivelicense') || message.includes('no active license')) {
          errorMessage = 'You need an active license for the original content to create derivatives.'
        } else if (message.includes('insufficient funds') || message.includes('insufficientbalance')) {
          errorMessage = 'Insufficient PROVN tokens for this purchase'
        } else if (message.includes('user rejected') || message.includes('user denied')) {
          errorMessage = 'Transaction was rejected by user'
        } else if (message.includes('walletclient not connected')) {
          errorMessage = 'Wallet connection lost. Please reconnect and try again.'
        } else if (message.includes('abiencodinglength') || message.includes('abi encoding')) {
          errorMessage = 'Contract integration error. Please try reconnecting your wallet.'
        } else if (message.includes('buyaccesssmart not available')) {
          errorMessage = 'Using alternative purchase method...'
        } else if (message.includes('http request failed') || message.includes('network error')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.'
        } else if (message.includes('execution reverted')) {
          // Extract revert reason if available
          if (message.includes('licensenotavailable')) {
            errorMessage = 'License terms not set up for this content'
          } else if (message.includes('invalidprice')) {
            errorMessage = 'Invalid license price configuration'
          } else {
            errorMessage = 'Transaction failed: Contract rejected the purchase'
          }
        } else if (message.includes('unable to fetch license terms')) {
          errorMessage = 'License terms could not be loaded. This content may not be available for licensing.'
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

    // Validate tokenId format
    if (!tokenId || typeof tokenId !== 'string') {
      console.error('❌ Invalid tokenId in hasAccess:', tokenId)
      return false
    }
    
    const tokenIdNum = tokenId.trim()
    if (!/^\d+$/.test(tokenIdNum)) {
      console.error('❌ Invalid tokenId format in hasAccess:', {
        tokenId,
        cleaned: tokenIdNum,
        isNumeric: /^\d+$/.test(tokenIdNum)
      })
      return false
    }

    try {
      return await retryWithBackoff(async () => {
        // First try Origin SDK with correct parameter order
        if (origin) {
          try {
            // Note: Origin SDK hasAccess takes (address, tokenId) not (tokenId, address)
            const hasAccessResult = await (origin as any).hasAccess(address, BigInt(tokenIdNum))
            return hasAccessResult
          } catch (sdkError) {
            console.warn('⚠️ Origin SDK hasAccess failed, trying direct contract:', sdkError)
          }
        }

        // Fallback to direct contract call
        const hasAccess = await publicClient.readContract({
          address: MARKETPLACE_CONTRACT as `0x${string}`,
          abi: marketplaceABI,
          functionName: 'hasAccess',
          args: [address as `0x${string}`, BigInt(tokenIdNum)]
        })
        
        return hasAccess
      }, 2, 2000) // 2 retries, 2s base delay for rate limiting
    } catch (error) {
      console.error('Failed to check access after retries:', error)
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
      const terms = await retryWithBackoff(async () => {
        // Try Origin SDK first
        if (origin) {
          try {
            const tokenBigInt = BigInt(tokenIdNum)
            console.log('🔢 getLicenseTerms converting tokenId:', {
              original: tokenId,
              cleaned: tokenIdNum,
              bigInt: tokenBigInt.toString()
            })
            const result = await origin.getTerms(tokenBigInt)
            console.log('📋 Terms fetched from Origin SDK for tokenId:', tokenIdNum, result)
            return result
          } catch (sdkError) {
            console.warn('⚠️ Origin SDK getTerms failed:', sdkError)
            throw sdkError
          }
        } else {
          throw new Error('Origin SDK not available')
        }
      }, 2, 2000)
      
      // Validate terms before processing
      if (!terms || !terms.price || terms.price <= 0 || !terms.duration || terms.duration <= 0) {
        console.warn('⚠️ Invalid terms from Origin SDK - price or duration is zero/null')
        throw new Error('Invalid license terms: missing price or duration')
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
      
      // Fallback: Direct contract call to Marketplace contract
      if (publicClient) {
        try {
          const result = await publicClient.readContract({
            address: MARKETPLACE_CONTRACT as `0x${string}`,
            abi: marketplaceABI,
            functionName: 'getTerms',
            args: [BigInt(tokenIdNum)]
          }) as readonly [bigint, number, number, `0x${string}`]
          
          const licenseTerms = {
            price: result[0],
            duration: Number(result[1]),
            royaltyBps: Number(result[2]),
            paymentToken: result[3]
          };
          
          // Validate terms from direct contract call
          if (!licenseTerms.price || licenseTerms.price <= 0 || !licenseTerms.duration || licenseTerms.duration <= 0) {
            console.warn('⚠️ Invalid terms from Marketplace contract - price or duration is zero/null')
            throw new Error('Invalid license terms from Marketplace contract: missing price or duration')
          }
          
          // Cache the result
          setTermsCache(prev => ({ ...prev, [tokenIdNum]: licenseTerms }));
          
          return licenseTerms
        } catch (directError) {
          console.error('❌ Direct Marketplace contract getTerms failed:', directError)
        }
      }
      
      console.error('All methods failed to get license terms:', error)
      return null
    }
  }

  const getSubscriptionExpiry = async (tokenId: string, userAddress?: string): Promise<Date | null> => {
    if (!origin) return null

    // Validate tokenId format
    if (!tokenId || typeof tokenId !== 'string') {
      console.error('❌ Invalid tokenId in getSubscriptionExpiry:', tokenId)
      return null
    }
    
    const tokenIdNum = tokenId.trim()
    if (!/^\d+$/.test(tokenIdNum)) {
      console.error('❌ Invalid tokenId format in getSubscriptionExpiry:', {
        tokenId,
        cleaned: tokenIdNum,
        isNumeric: /^\d+$/.test(tokenIdNum)
      })
      return null
    }

    try {
      const address = userAddress || walletAddress
      if (!address) return null

      const expiry = await retryWithBackoff(async () => {
        // Try Origin SDK first
        if (origin && typeof (origin as any).subscriptionExpiry === 'function') {
          return await (origin as any).subscriptionExpiry(BigInt(tokenIdNum), address)
        } else if (publicClient) {
          // Fallback to direct Marketplace contract call
          return await publicClient.readContract({
            address: MARKETPLACE_CONTRACT as `0x${string}`,
            abi: marketplaceABI,
            functionName: 'subscriptionExpiry',
            args: [BigInt(tokenIdNum), address as `0x${string}`]
          })
        } else {
          throw new Error('No client available for subscription expiry check')
        }
      }, 2, 2000)
      
      return new Date(Number(expiry) * 1000)
    } catch (error) {
      console.error('Failed to get subscription expiry after retries:', error)
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
          errorMessage = 'Insufficient PROVN tokens for renewal'
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

  // Creator revenue tracking
  const getTotalRevenue = async (creatorAddress: string): Promise<string> => {
    if (!publicClient) return '0'
    
    try {
      const revenue = await publicClient.readContract({
        address: MARKETPLACE_CONTRACT as `0x${string}`,
        abi: marketplaceABI,
        functionName: 'totalRevenue',
        args: [creatorAddress as `0x${string}`]
      }) as bigint
      
      return revenue.toString()
    } catch (error) {
      console.error('Failed to get creator revenue:', error)
      return '0'
    }
  }

  const getTotalRoyalty = async (creatorAddress: string): Promise<string> => {
    if (!publicClient) return '0'
    
    try {
      const royalty = await publicClient.readContract({
        address: MARKETPLACE_CONTRACT as `0x${string}`,
        abi: marketplaceABI,
        functionName: 'totalRoyalty',
        args: [creatorAddress as `0x${string}`]
      }) as bigint
      
      return royalty.toString()
    } catch (error) {
      console.error('Failed to get creator royalty:', error)
      return '0'
    }
  }


  return {
    // Core licensing functions
    buyLicense,
    hasAccess,
    getLicenseTerms,
    getSubscriptionExpiry,
    renewAccess,
    syncLicenseTerms,
    
    // Creator revenue functions
    getTotalRevenue,
    getTotalRoyalty,
    
    // State
    loading,
    error,
    clearError: () => setError(null)
  }
}