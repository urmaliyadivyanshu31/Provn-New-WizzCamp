import { useState } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { toast } from 'sonner'

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
      // Convert amount to wei (wCAMP has 18 decimals)
      const amountWei = BigInt(Math.floor(amount * 1e18))
      
      // wCAMP token address on BaseCAMP
      const wCAMPAddress = '0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b'

      // Check if user has enough balance
      // TODO: Add balance check here

      // Send tip using Origin protocol
      // For now, we'll use a simple transfer mechanism
      // In production, this would integrate with the Origin SDK's tipping system
      
      console.log('🎁 Sending tip:', {
        to: creatorAddress,
        amount: amount,
        amountWei: amountWei.toString(),
        message
      })

      // Simulate tip transaction
      // In real implementation, this would call the Origin smart contract
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success(`Successfully sent ${amount} wCAMP tip!`)
      
      // TODO: Track tip in database
      await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress,
          amount,
          message,
          timestamp: new Date().toISOString()
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