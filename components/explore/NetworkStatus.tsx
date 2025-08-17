"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Network, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@campnetwork/origin/react'
import { ensureEthersAvailable, createProvider } from '@/utils/ethers-utils'

interface NetworkStatusProps {
  className?: string
}

export function NetworkStatus({ className = "" }: NetworkStatusProps) {
  const [currentChainId, setCurrentChainId] = useState<string>("")
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [ethersLoading, setEthersLoading] = useState(true)
  const { origin, isAuthenticated } = useAuth()

  const BASE_CAMP_CHAIN_ID = "123420001114"
  const BASE_CAMP_CHAIN_ID_HEX = "0x75b7b8b2"

  const checkNetwork = async () => {
    if (!isAuthenticated || !origin) {
      setError("Please connect your wallet first")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError("")
      
      // Check window.ethereum directly for network info
      if (!window.ethereum) {
        setError("No wallet detected")
        setIsLoading(false)
        return
      }
      
      // Ensure ethers.js is available
      const ethersAvailable = await ensureEthersAvailable()
      if (!ethersAvailable) {
        setError("Ethers.js not loaded. Please refresh the page.")
        setIsLoading(false)
        return
      }
      
      const provider = createProvider()
      const network = await provider.getNetwork()
      const chainId = network.chainId.toString()
      
      setCurrentChainId(chainId)
      setIsCorrectNetwork(chainId === BASE_CAMP_CHAIN_ID)
      
    } catch (err) {
      setError("Failed to check network")
      console.error("Network check error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const switchToBaseCAMP = async () => {
    if (!window.ethereum) return
    
    try {
      setIsLoading(true)
      setError("")
      
      // Try to switch to BaseCAMP network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CAMP_CHAIN_ID_HEX }]
      })
      
      // Wait a moment and recheck
      setTimeout(checkNetwork, 1000)
      
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: BASE_CAMP_CHAIN_ID_HEX,
              chainName: 'BaseCAMP',
              nativeCurrency: {
                name: 'CAMP',
                symbol: 'CAMP',
                decimals: 18
              },
              rpcUrls: [
                'https://rpc.basecamp.t.raas.gelato.cloud',
                'https://rpc-campnetwork.xyz'
              ],
              blockExplorerUrls: ['https://basecamp.cloud.blockscout.com/']
            }]
          })
          
          // Wait a moment and recheck
          setTimeout(checkNetwork, 1000)
          
        } catch (addError) {
          setError("Failed to add BaseCAMP network")
          console.error("Add network error:", addError)
        }
      } else {
        setError("Failed to switch network")
        console.error("Switch network error:", switchError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initializeEthers = async () => {
      if (isAuthenticated) {
        setEthersLoading(true)
        const ethersAvailable = await ensureEthersAvailable()
        if (ethersAvailable) {
          setEthersLoading(false)
          checkNetwork()
        } else {
          setEthersLoading(false)
          setError("Failed to load ethers.js")
        }
      } else {
        setIsLoading(false)
        setEthersLoading(false)
      }
    }
    
    initializeEthers()
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork)
      return () => {
        window.ethereum.removeListener('chainChanged', checkNetwork)
      }
    }
  }, [isAuthenticated])

  if (ethersLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-blue-500">Loading ethers.js...</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-blue-500">Checking network...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-500 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    )
  }

  if (isCorrectNetwork) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 text-sm text-green-500 ${className}`}
      >
        <CheckCircle className="w-4 h-4" />
        <span>BaseCAMP Network</span>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-3 text-sm ${className}`}
    >
      <div className="flex items-center gap-2 text-orange-500">
        <AlertCircle className="w-4 h-4" />
        <span>Wrong Network</span>
      </div>
      
      <button
        onClick={switchToBaseCAMP}
        disabled={isLoading}
        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
      >
        {isLoading ? "Switching..." : "Switch to BaseCAMP"}
      </button>
      
      <div className="text-xs text-gray-400">
        Current: {currentChainId}
      </div>
    </motion.div>
  )
}
