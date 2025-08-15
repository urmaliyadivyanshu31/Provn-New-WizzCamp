import { useState, useEffect } from 'react'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { type Address } from 'viem'

export function useCampfireIntegration() {
  const auth = useAuth()
  const { authenticated: isConnected } = useAuthState()
  const { origin, jwt, recoverProvider } = auth
  const address = auth.walletAddress

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Clear messages after some time
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  async function uploadToIPFS(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (!result.IpfsHash) {
        throw new Error("Failed to get IPFS URL after upload");
      }

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      setSuccess("File uploaded to IPFS successfully!");
      return ipfsUrl;
    } catch (error) {
      console.error("IPFS upload error:", error);
      setError("Failed to upload file to IPFS");
      throw error;
    }
  } 

  const mintIPWithOrigin = async (
    file: File,
    metadata: any,
    license: {
      price: string
      duration: string
      royalty: string
      paymentToken: string
    },
    parentId: string
  ) => {
    await recoverProvider()

    if (!origin || !jwt) {
      setError('Please connect your wallet first')
      return null
    }
    setLoading(true)
    setError(null)
    
    try {
      let ipfsUrl = "";
      try {
        const rest = await uploadToIPFS(file);
        if (!rest) {
          throw new Error('Failed to upload file to IPFS')
        }
        ipfsUrl = rest;
      } catch (error) {
        return; 
      }
      
      const licenseTerms = {
        price: BigInt(parseFloat(license.price || '1') * 1e18),
        duration: parseInt(license.duration || '2345000'),
        royaltyBps: parseInt(license.royalty || '0') * 100,
        paymentToken: (license.paymentToken || '0x0000000000000000000000000000000000000000') as Address,
      }

      const parentTokenId = parentId === '' ? BigInt(0) : BigInt(parentId)
      
      const tokenId = await origin.mintFile(
        file,
        {
          ...metadata,
          image: ipfsUrl,
          owner: address,
          price: license.price,
          mimeType: file.type,
          size: file.size,
        },
        licenseTerms,
        parentTokenId
      )

      setSuccess(`Successfully minted IP NFT with ID: ${tokenId}`)
      return tokenId
    } catch (err) {
      console.error('Minting error:', err)
      setError(err instanceof Error ? err.message : 'Failed to mint IP NFT')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    loading,
    error,
    success,
    isConnected,
    address,

    // Functions
    mintIPWithOrigin,

    // Clear functions
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null),
  }
}