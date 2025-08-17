"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExploreVideo } from "@/types/explore"
import { X, DollarSign, Heart, Loader2, Wallet, Network, RefreshCw } from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { useOriginTipping } from "@/hooks/useOriginTipping"
import { useAuth } from "@campnetwork/origin/react"
import { NetworkStatus } from "./NetworkStatus"
import { ensureEthersAvailable, createProvider, createContract, formatUnits } from "@/utils/ethers-utils"

interface TipModalProps {
  isOpen: boolean
  onClose: () => void
  video: ExploreVideo
  isAuthenticated: boolean
}

const PRESET_AMOUNTS = [0.01, 0.05, 0.1, 0.5, 1, 5]

export function TipModal({ isOpen, onClose, video, isAuthenticated }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(0.1)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isCustom, setIsCustom] = useState(false)
  const [message, setMessage] = useState("")
  const [userBalance, setUserBalance] = useState<string>("0")
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState<string>("")
  
  const { sendTip, loading, error } = useOriginTipping()

  const [userAddress, setUserAddress] = useState<string>("")

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setIsCustom(false)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setIsCustom(true)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(numValue)
    }
  }

  // Check user's wCAMP balance
  const checkUserBalance = async () => {
    if (!isAuthenticated) return
    
    setIsCheckingBalance(true)
    setBalanceError("")
    try {
      // Check window.ethereum directly for user info and balance
      if (!window.ethereum) return
      
      // Ensure ethers.js is available
      const ethersAvailable = await ensureEthersAvailable()
      if (!ethersAvailable) {
        console.error('Ethers.js not loaded')
        setUserBalance("0.0000")
        return
      }
      
      const provider = createProvider()
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      setUserAddress(address)
      
      // Check if we're on the correct network (BaseCAMP)
      const network = await provider.getNetwork()
      console.log('🔍 Current network:', {
        chainId: network.chainId.toString(),
        expectedChainId: '123420001114',
        isCorrectNetwork: network.chainId.toString() === '123420001114'
      })
      
      if (network.chainId.toString() !== '123420001114') {
        console.warn('⚠️ Not on BaseCAMP network, balance may not be accurate')
        setUserBalance("0.0000")
        return
      }
      
      // Query real wCAMP balance using Blockscout API
      try {
        const WCAMP_TOKEN_ADDRESS = '0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b'
        
        console.log('🔍 Fetching wCAMP balance for address:', address)
        console.log('🔍 Using Blockscout API for token balance')
        
        // First, get the address info from Blockscout API
        const addressResponse = await fetch(`https://basecamp.cloud.blockscout.com/api/v2/addresses/${address}`)
        
        if (!addressResponse.ok) {
          throw new Error(`Blockscout API error: ${addressResponse.status} ${addressResponse.statusText}`)
        }
        
        const addressData = await addressResponse.json()
        console.log('🔍 Address data from Blockscout:', addressData)
        
        // Try multiple Blockscout API endpoints for token balance
        let wcampBalance = "0"
        
        // Method 1: Get all tokens for the address
        try {
          const tokenResponse = await fetch(`https://basecamp.cloud.blockscout.com/api/v2/addresses/${address}/tokens`)
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json()
            console.log('🔍 All tokens from Blockscout:', tokenData)
            
            if (tokenData && tokenData.length > 0) {
              const wcampToken = tokenData.find((token: any) => 
                token.token.address_hash.toLowerCase() === WCAMP_TOKEN_ADDRESS.toLowerCase()
              )
              
              if (wcampToken) {
                wcampBalance = wcampToken.value
                console.log('🔍 Found wCAMP balance from tokens endpoint:', wcampBalance)
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch from tokens endpoint:', error)
        }
        
        // Method 2: If no balance found, try the specific token endpoint
        if (wcampBalance === "0") {
          try {
            const specificTokenResponse = await fetch(`https://basecamp.cloud.blockscout.com/api/v2/addresses/${address}/tokens?token_address=${WCAMP_TOKEN_ADDRESS}`)
            
            if (specificTokenResponse.ok) {
              const specificTokenData = await specificTokenResponse.json()
              console.log('🔍 Specific token data from Blockscout:', specificTokenData)
              
              if (specificTokenData && specificTokenData.length > 0) {
                const wcampToken = specificTokenData.find((token: any) => 
                  token.token.address_hash.toLowerCase() === WCAMP_TOKEN_ADDRESS.toLowerCase()
                )
                
                if (wcampToken) {
                  wcampBalance = wcampToken.value
                  console.log('🔍 Found wCAMP balance from specific token endpoint:', wcampBalance)
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch from specific token endpoint:', error)
          }
        }
        
        // Method 3: Try to get token info and calculate balance
        if (wcampBalance === "0") {
          try {
            const tokenInfoResponse = await fetch(`https://basecamp.cloud.blockscout.com/api/v2/tokens/${WCAMP_TOKEN_ADDRESS}`)
            
            if (tokenInfoResponse.ok) {
              const tokenInfo = await tokenInfoResponse.json()
              console.log('🔍 Token info from Blockscout:', tokenInfo)
              
              // Try to get balance from token transfers or other endpoints
              console.log('🔍 Attempting to find balance from token info...')
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch token info:', error)
          }
        }
        
        console.log('🔍 Final wCAMP balance found:', wcampBalance)
        
        // If Blockscout API didn't return a balance, try smart contract as fallback
        if (wcampBalance === "0") {
          console.log('🔍 No balance from Blockscout API, trying smart contract fallback...')
          
          try {
            const WCAMP_ABI = [
              "function balanceOf(address owner) view returns (uint256)",
              "function decimals() view returns (uint8)"
            ]
            
            const wcampContract = createContract(WCAMP_TOKEN_ADDRESS, WCAMP_ABI, provider)
            const contractBalance = await wcampContract.balanceOf(address)
            const decimals = await wcampContract.decimals()
            
            wcampBalance = contractBalance.toString()
            console.log('🔍 Balance from smart contract fallback:', wcampBalance)
            console.log('🔍 Token decimals from contract:', decimals)
          } catch (contractError) {
            console.warn('⚠️ Smart contract fallback also failed:', contractError)
          }
        }
        
        // Format the balance (assuming 18 decimals for wCAMP)
        const balanceInWei = BigInt(wcampBalance || "0")
        const formattedBalance = (balanceInWei / BigInt(10 ** 18)).toString()
        
        console.log('🔍 Balance in Wei:', wcampBalance)
        console.log('🔍 Formatted balance:', formattedBalance)
        
        setUserBalance(parseFloat(formattedBalance).toFixed(4))
        console.log('✅ Balance set successfully:', parseFloat(formattedBalance).toFixed(4))
        
      } catch (error: any) {
        console.error('❌ Failed to fetch wCAMP balance from Blockscout:', error)
        console.error('❌ Error details:', {
          message: error?.message || 'Unknown error',
          stack: error?.stack || 'No stack trace',
          code: error?.code || 'No error code'
        })
        setUserBalance("0.0000")
        setBalanceError(`Failed to fetch balance: ${error?.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Failed to check balance:', error)
      setUserBalance("0")
      setBalanceError(`Failed to check balance: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsCheckingBalance(false)
    }
  }

  // Check balance when modal opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      checkUserBalance()
    }
  }, [isOpen, isAuthenticated])

  const handleSendTip = async () => {
    if (!isAuthenticated) return
    
    const amount = isCustom ? parseFloat(customAmount) : selectedAmount
    if (amount <= 0) return

    try {
      const success = await sendTip(video.creator.walletAddress, amount, message)
      if (success) {
        onClose()
        // Reset form
        setSelectedAmount(0.1)
        setCustomAmount("")
        setMessage("")
        setIsCustom(false)
        // Refresh balance after successful tip
        checkUserBalance()
      }
    } catch (error) {
      console.error('Failed to send tip:', error)
    }
  }

  const finalAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-provn-surface border border-provn-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-provn-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-provn-text">Send Tip</h2>
                  <p className="text-sm text-provn-muted">Support @{video.creator.handle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-provn-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Creator Info */}
              <div className="flex items-center gap-3 p-4 bg-provn-surface-2 rounded-lg">
                {video.creator.avatarUrl ? (
                  <img
                    src={video.creator.avatarUrl}
                    alt={video.creator.handle}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-provn-accent to-provn-accent/80 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {video.creator.displayName?.[0]?.toUpperCase() || video.creator.handle[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-provn-text">
                    {video.creator.displayName || video.creator.handle}
                  </h3>
                  <p className="text-sm text-provn-muted">@{video.creator.handle}</p>
                </div>
              </div>

              {/* Network Status */}
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Network className="w-4 h-4 text-blue-500" />
                <NetworkStatus />
              </div>

              {/* User Balance */}
              {isAuthenticated && userAddress && (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Your Balance: {isCheckingBalance ? (
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
                          Fetching...
                        </span>
                      ) : (
                        `${userBalance} wCAMP`
                      )}
                    </span>
                  </div>
                  <button
                    onClick={checkUserBalance}
                    disabled={isCheckingBalance}
                    className="p-1 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50"
                    title="Refresh balance"
                  >
                    <RefreshCw className={`w-3 h-3 text-green-500 ${isCheckingBalance ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔍 Debug: Current state:', {
                        userAddress,
                        userBalance,
                        balanceError,
                        isCheckingBalance
                      })
                    }}
                    className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                    title="Debug info"
                  >
                    <span className="text-xs text-blue-500">?</span>
                  </button>
                </div>
              )}
              
              {/* Balance Error */}
              {balanceError && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-500">{balanceError}</p>
                </div>
              )}

              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-provn-text mb-3">
                  Tip Amount (wCAMP)
                </label>
                
                {/* Preset Amounts */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {PRESET_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountSelect(amount)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedAmount === amount && !isCustom
                          ? 'border-provn-accent bg-provn-accent/10 text-provn-accent'
                          : 'border-provn-border hover:border-provn-accent/50 text-provn-text'
                      }`}
                    >
                      {amount} wCAMP
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-provn-surface-2 border-2 rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:border-provn-accent transition-colors ${
                      isCustom ? 'border-provn-accent' : 'border-provn-border'
                    }`}
                    min="0.1"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-provn-muted text-sm">
                    wCAMP
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-provn-text mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message for the creator..."
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-provn-muted text-right mt-1">
                  {message.length}/200
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Summary */}
              {finalAmount > 0 && (
                <div className="p-4 bg-provn-accent/10 border border-provn-accent/20 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-provn-text">Total Amount:</span>
                    <span className="font-bold text-provn-accent">{finalAmount} wCAMP</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-provn-border">
              <ProvnButton
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </ProvnButton>
              <ProvnButton
                onClick={handleSendTip}
                disabled={!isAuthenticated || finalAmount <= 0 || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Send Tip
                  </>
                )}
              </ProvnButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}