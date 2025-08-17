import { useState } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { toast } from 'sonner'
import { ensureEthersAvailable, createProvider, createContract, parseUnits, formatUnits } from '@/utils/ethers-utils'

export function useOriginTipping() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { origin, isAuthenticated } = useAuth()

  const sendTip = async (creatorAddress: string, amount: number, message?: string): Promise<boolean> => {
    if (!isAuthenticated || !origin) {
      setError('Please connect your wallet first')
      return false
    }

    if (amount <= 0) {
      setError('Tip amount must be greater than 0')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🎁 Sending CAMP tip via Origin SDK:', {
        to: creatorAddress,
        amount: amount,
        message
      })

      // Real wCAMP token tipping implementation
      console.log('🚀 Executing real wCAMP tip transaction...')
      
      // Ensure ethers.js is available
      const ethersAvailable = await ensureEthersAvailable()
      if (!ethersAvailable) {
        throw new Error('Ethers.js not loaded. Please refresh the page and try again.')
      }
      
      // Get the signer from the connected wallet
      if (!window.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or another wallet.')
      }

      // Create provider and signer
      const provider = createProvider()
      const signer = provider.getSigner()
      
      // Check if we're on the correct network (BaseCAMP)
      const network = await provider.getNetwork()
      console.log('🔍 Current network:', {
        chainId: network.chainId.toString(),
        expectedChainId: '123420001114',
        isCorrectNetwork: network.chainId === BigInt(123420001114)
      })
      
      if (network.chainId !== BigInt(123420001114)) {
        // Try to switch to BaseCAMP network
        console.log('🔄 Attempting to switch to BaseCAMP network...')
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x75b7b8b2' }], // 123420001114 in hex
          })
          console.log('✅ Successfully switched to BaseCAMP network')
        } catch (switchError: any) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            console.log('➕ BaseCAMP network not found, adding it...')
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x75b7b8b2', // 123420001114 in hex
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
              console.log('✅ Successfully added BaseCAMP network')
            } catch (addError) {
              console.error('❌ Failed to add BaseCAMP network:', addError)
              throw new Error('Failed to add BaseCAMP network. Please add it manually in your wallet.')
            }
          } else {
            console.error('❌ Network switch failed:', switchError)
            throw new Error('Please switch to BaseCAMP network (Chain ID: 123420001114)')
          }
        }
        
        // Wait a moment for the network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify we're now on the correct network
        const newNetwork = await provider.getNetwork()
        console.log('🔍 Network after switch:', {
          chainId: newNetwork.chainId.toString(),
          expectedChainId: '123420001114',
          isCorrectNetwork: newNetwork.chainId === BigInt(123420001114)
        })
        
        if (newNetwork.chainId !== BigInt(123420001114)) {
          throw new Error('Failed to switch to BaseCAMP network. Please switch manually.')
        }
      }

      // wCAMP token contract address and ABI
      const WCAMP_TOKEN_ADDRESS = '0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b'
      const WCAMP_ABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ]

      // Create contract instance
      const wcampContract = createContract(WCAMP_TOKEN_ADDRESS, WCAMP_ABI, signer)
      
      // Check user's wCAMP balance
      const userAddress = await signer.getAddress()
      const balance = await wcampContract.balanceOf(userAddress)
      const amountWei = parseUnits(amount.toString(), 18)
      
      if (balance < amountWei) {
        throw new Error(`Insufficient wCAMP balance. You have ${formatUnits(balance, 18)} wCAMP`)
      }

      // Send the tip transaction
      console.log('🚀 Executing wCAMP tip transaction...')
      const tx = await wcampContract.transfer(creatorAddress, amountWei)
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      const receipt = await tx.wait()
      
      const tipResult = {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString()
      }
      
      console.log('✅ Real wCAMP tip transaction completed:', tipResult)

      console.log('✅ Tip sent successfully:', tipResult)

      // Show success message with transaction details
      const txHash = tipResult.transactionHash || 'Unknown'
      const shortHash = txHash.length > 10 ? `${txHash.slice(0, 10)}...` : txHash
      
      toast.success(`🎉 Successfully sent ${amount} wCAMP tip! Transaction: ${shortHash}`)
      
      // Track tip in database for analytics
      await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress,
          amount,
          message,
          timestamp: new Date().toISOString(),
          transactionHash: tipResult.transactionHash || 'unknown',
          blockNumber: tipResult.blockNumber || 0,
          gasUsed: tipResult.gasUsed || '0'
        })
      })

      return true
    } catch (err) {
      console.error('Failed to send tip:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to send tip'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getTipHistory = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/tips/history/${tokenId}`)
      const data = await response.json()
      return data.success ? data.tips : []
    } catch (error) {
      console.error('Failed to fetch tip history:', error)
      return []
    }
  }

  return {
    sendTip,
    getTipHistory,
    loading,
    error,
    clearError: () => setError(null)
  }
}