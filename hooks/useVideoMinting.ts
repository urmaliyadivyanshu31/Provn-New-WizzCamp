import { useState, useEffect } from 'react'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { type Address } from 'viem'

export function useVideoMinting() {
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

  async function fetchTransactionHash(walletAddress: string): Promise<string | null> {
    try {
      // Fetch recent transactions from BaseCAMP API
      const response = await fetch(
        `https://basecamp.cloud.blockscout.com/api/v2/addresses/${walletAddress}/transactions?filter=validated&type=contract_call`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 BaseCAMP API response:', data);
        
        // Get the most recent transaction
        if (data.items && data.items.length > 0) {
          const recentTx = data.items[0];
          return recentTx.hash;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch transaction hash:', error);
    }
    return null;
  }

  async function fetchMetadata(tokenId: string, walletAddress: string): Promise<{ videoUrl: string; metadataHash: string; transactionHash?: string } | null> {
    try {
      if (!origin) return null;
      
      // Get token URI from Origin SDK
      const tokenURI = await (origin as any).tokenURI(BigInt(tokenId));
      console.log('🔍 Token URI:', tokenURI);
      
      // Fetch transaction hash separately
      const transactionHash = await fetchTransactionHash(walletAddress);
      
      if (tokenURI) {
        // Extract IPFS hash from URI
        const metadataHash = tokenURI.replace('https://ivory-total-ox-210.mypinata.cloud/ipfs/', '').replace('https://gateway.pinata.cloud/ipfs/', '');
        
        // Fetch metadata
        const response = await fetch(tokenURI);
        const metadata = await response.json();
        console.log('🔍 Metadata:', metadata);
        
        return {
          videoUrl: metadata.animation_url || '',
          metadataHash,
          transactionHash: transactionHash || undefined
        };
      }
    } catch (error) {
      console.warn('Failed to fetch metadata:', error);
    }
    return null;
  }

  async function uploadToIPFS(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (!result.IpfsHash) {
        throw new Error("Failed to get IPFS URL after upload");
      }

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      // Don't set success here, let the main function handle it
      return ipfsUrl;
    } catch (error) {
      console.error("IPFS upload error:", error);
      setError("Failed to upload video to IPFS");
      throw error;
    }
  } 

  const mintVideoWithOrigin = async (
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
      // Step 1: Upload to IPFS
      setSuccess("📤 Uploading video to IPFS...");
      let ipfsUrl = "";
      try {
        const rest = await uploadToIPFS(file);
        if (!rest) {
          throw new Error('Failed to upload video to IPFS')
        }
        ipfsUrl = rest;
        setSuccess("✅ Video uploaded to IPFS successfully!");
      } catch (error) {
        return; 
      }
      
      // Step 2: Prepare for minting
      setSuccess("⛓️ Preparing blockchain transaction...");
      
      const licenseTerms = {
        price: BigInt(parseFloat(license.price || '0') * 1e18),
        duration: parseInt(license.duration || '2629800'),
        royaltyBps: parseInt(license.royalty || '0') * 100,
        paymentToken: (license.paymentToken || '0x0000000000000000000000000000000000000000') as Address,
      }

      const parentTokenId = parentId === '' ? BigInt(0) : BigInt(parentId)
      
      const tokenId = await origin.mintFile(
        file,
        {
          ...metadata,
          animation_url: ipfsUrl, // Use animation_url for videos instead of image
          owner: address,
          price: license.price,
          mimeType: file.type,
          size: file.size,
        },
        licenseTerms,
        parentTokenId
      )

      setSuccess(`🎉 IP-NFT minted successfully on BaseCAMP! Token ID: ${tokenId}`)
      return { tokenId, ipfsUrl }
    } catch (err) {
      console.error('Video minting error:', err)
      setError(err instanceof Error ? err.message : 'Failed to mint video IP NFT')
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
    mintVideoWithOrigin,
    fetchMetadata,

    // Clear functions
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null),
  }
}