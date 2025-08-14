"use client";

import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useAuth } from "@campnetwork/origin/react";
import { ProvnButton } from "@/components/provn/button";
import { ProvnCard, ProvnCardContent } from "@/components/provn/card";
import { Navigation } from "@/components/provn/navigation";
import type { Address } from "viem/accounts";

type LicenseTerms = {
  price: bigint;
  duration: number;
  royaltyBps: number;
  paymentToken: Address;
};

export default function SimpleMintPage() {
  const auth = useAuth();
  const address = auth.walletAddress;
  const { origin } = auth;
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isMinting, setIsMinting] = useState(false);

  // Add debugging for Origin SDK state
  console.log('🔍 Simple Mint Page - Origin SDK State:', {
    isAuthenticated: auth.isAuthenticated,
    walletAddress: auth.walletAddress,
    hasOrigin: !!auth.origin,
    originType: typeof auth.origin,
    originKeys: auth.origin ? Object.keys(auth.origin) : 'no origin',
    authObject: auth,
    authKeys: Object.keys(auth)
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔍 Drag over event triggered');
  };

  const handleFileSelect = (file: File) => {
    console.log('📁 File selected:', file.name, file.size, file.type);
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔍 Drop event triggered');
    console.log('🔍 DataTransfer files:', e.dataTransfer.files);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      console.log('📁 File dropped:', e.dataTransfer.files[0].name);
      handleFileSelect(e.dataTransfer.files[0]);
    } else {
      console.log('🔍 No files in drop event');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input event triggered:', e);
    console.log('📁 Files:', e.target.files);
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('📁 File input changed:', files[0].name);
      handleFileSelect(files[0]);
    } else {
      console.log('📁 No files selected');
    }
  };

  const handleMint = async () => {
    if (!name.trim() || !description.trim()) return toast.error("Please fill in all fields");
    if (!file) return toast.error("Please upload a file first");
    if (!auth.isAuthenticated) return toast.error("Please connect your wallet first");
    if (!auth.origin) return toast.error("Origin SDK not initialized");

    // Additional wallet validation
    if (!auth.walletAddress) {
      toast.error("Wallet not properly connected", {
        description: "Please disconnect and reconnect your wallet, then try again."
      });
      return;
    }

    // Add debugging before minting
    console.log('🔍 Before minting - checking Origin SDK:', {
      isAuthenticated: auth.isAuthenticated,
      walletAddress: auth.walletAddress,
      hasOrigin: !!auth.origin,
      originMethods: auth.origin ? Object.getOwnPropertyNames(auth.origin) : 'no origin',
      mintFileMethod: auth.origin && typeof auth.origin.mintFile === 'function' ? 'exists' : 'missing'
    });

    setIsMinting(true);

    try {
      // Upload to IPFS first (using the same logic as working sample)
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      });

      const result = await response.json();
      const ipfsUrl = `https://ipfs.io/ipfs/${result.IpfsHash}`;

      if (!ipfsUrl) {
        throw new Error("Failed to upload to IPFS");
      }

      console.log("Fetching file from IPFS:", ipfsUrl);
      const ipfsResponse = await fetch(ipfsUrl);
      const blob = await ipfsResponse.blob();
      const mintFile = new File([blob], file.name, { type: file.type });

      // Define license terms EXACTLY like working sample
      const license = {
        price: BigInt(0),
        duration: 2629800, // 30 days in seconds
        royaltyBps: 0,
        paymentToken: "0x0000000000000000000000000000000000000000" as Address,
      } as LicenseTerms;

      // Create metadata EXACTLY like working sample
      const metadata = {
        name: name,
        description: description,
        image: ipfsUrl,
        attributes: [
          {
            trait_type: "Type",
            value: "Video",
          },
          {
            trait_type: "File Size",
            value: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          },
        ],
      };

      console.log("Starting IP registration...", {
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + "MB",
        walletAddress: auth.walletAddress,
        hasOrigin: !!auth.origin,
        fileName: file.name,
        fileType: file.type
      });

      // Use auth.origin.mintFile() EXACTLY like the working sample - NO DELAYS, NO RETRY
      const mintResult = await auth.origin.mintFile(mintFile, metadata, license);
      
      console.log("✅ IP registration successful! Your NFT is now live.", {
        tokenId: mintResult,
        transactionUrl: `https://basecamp.cloud.blockscout.com/tx/${mintResult}`,
        ipfsUrl,
        fileDetails: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });
      
      // Show success toast with transaction details
      toast.success(
        <div className="space-y-2">
          <div className="font-semibold">IP-NFT Created Successfully! 🎉</div>
          <div className="text-sm space-y-1">
            <div>
              <span className="text-provn-muted">File: </span>
              <span className="text-provn-text">{file.name}</span>
            </div>
            <div>
              <span className="text-provn-muted">Token ID: </span>
              <span className="font-mono text-xs">{mintResult}</span>
            </div>
            <div>
              <span className="text-provn-muted">Transaction: </span>
              <a
                href={`https://basecamp.cloud.blockscout.com/tx/${mintResult}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-provn-accent hover:underline"
              >
                View on Blockscout ↗
              </a>
            </div>
            <div>
              <span className="text-provn-muted">Network: </span>
              <span className="text-provn-text">BaseCAMP Testnet</span>
            </div>
          </div>
        </div>,
        { duration: 10000 }
      );
      
      // Save to database for the platform
      try {
        await fetch('/api/minted-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: auth.walletAddress,
            ipnftId: mintResult || 'pending',
            transactionHash: mintResult || 'pending', // Origin SDK returns the token ID as the result
            title: name.trim(),
            description: description.trim(),
            fileType: file.type,
            fileSize: file.size,
            ipfsHash: result.IpfsHash,
            ipfsUrl: ipfsUrl,
            metadata: metadata,
            licenseTerms: license,
          })
        });
      } catch (dbError) {
        console.error('Failed to save to database:', dbError);
        // Don't fail the whole operation if DB save fails
      }

      // Clear form
      setName("");
      setDescription("");
      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview("");
      
    } catch (error) {
      console.error("Minting failed:", error);
      
      // Provide specific error messages like working sample
      let errorMessage = "IP registration failed. Please try again later.";
      let errorDescription = error instanceof Error ? error.message : "An error occurred";
      
      if (errorDescription.includes("signature") || errorDescription.includes("Failed to get signature")) {
        errorMessage = "Transaction signature failed.";
        errorDescription = "Please check your wallet connection and approve the transaction when prompted.";
      } else if (errorDescription.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
        errorDescription = "Make sure you're connected to the correct network.";
      } else if (errorDescription.includes("gas")) {
        errorMessage = "Insufficient gas fees.";
        errorDescription = "Please ensure you have enough gas for the transaction.";
      } else if (errorDescription.includes("user rejected") || errorDescription.includes("User rejected")) {
        errorMessage = "Transaction was rejected.";
        errorDescription = "You declined the transaction. Please try again and approve when prompted.";
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
    } finally { 
      setIsMinting(false); 
    }
  };

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="upload" />
      <Toaster theme="dark" />

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold text-provn-text">Simple IP-NFT Minting</h1>
          <p className="text-provn-muted">Upload a file and mint it as an IP-NFT on Camp Network</p>
        </div>

        <div className="mt-8 space-y-6">
          {/* File Upload */}
          <ProvnCard>
            <ProvnCardContent className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  preview ? "border-provn-accent" : "border-provn-border hover:border-provn-accent/50"
                }`}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {!preview ? (
                  <div className="space-y-4">
                    <div className="text-4xl">📁</div>
                    <p className="text-provn-text">Drag & drop a file here or click to browse</p>
                    <input
                      type="file"
                      onChange={handleFileInput}
                      className="opacity-0 absolute w-1 h-1" // Temporary debugging - make it tiny but clickable
                      id="file-input"
                      accept="image/*,video/*,audio/*,text/*,.pdf,.doc,.docx" // Add file type restrictions
                    />
                    {/* Temporarily removed label wrapper for debugging */}
                    <ProvnButton 
                      variant="secondary"
                      onMouseEnter={() => console.log('🔍 Button mouse enter')}
                      onMouseLeave={() => console.log('🔍 Button mouse leave')}
                      onMouseDown={() => console.log('🔍 Button mouse down')}
                      onMouseUp={() => console.log('🔍 Button mouse up')}
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('🔍 Browse button clicked');
                        console.log('🔍 Button element:', e.currentTarget);
                        console.log('🔍 Button disabled:', e.currentTarget.disabled);
                        console.log('🔍 Event type:', e.type);
                        console.log('🔍 Event target:', e.target);
                        
                        // Debug button position and size
                        const rect = e.currentTarget.getBoundingClientRect();
                        console.log('🔍 Button position:', {
                          top: rect.top,
                          left: rect.left,
                          width: rect.width,
                          height: rect.height,
                          visible: rect.width > 0 && rect.height > 0
                        });
                        
                        // Manually trigger file input
                        const fileInput = document.getElementById('file-input') as HTMLInputElement;
                        if (fileInput) {
                          console.log('🔍 Found file input, clicking it');
                          fileInput.click();
                        } else {
                          console.log('🔍 File input not found');
                        }
                      }}
                      className="cursor-pointer"
                    >
                      Browse Files
                    </ProvnButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-4xl">✅</div>
                    <p className="text-provn-text">{file?.name}</p>
                    <ProvnButton
                      variant="secondary"
                      onClick={() => {
                        setFile(null);
                        setPreview("");
                        setName("");
                        setDescription("");
                      }}
                    >
                      Remove File
                    </ProvnButton>
                  </div>
                )}
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Metadata Form */}
          {file && (
            <ProvnCard>
              <ProvnCardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-provn-text">IP Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2">IP Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter IP Name"
                    className="w-full px-4 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2">IP Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter IP Description"
                    rows={3}
                    className="w-full px-4 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent resize-none"
                  />
                </div>
              </ProvnCardContent>
            </ProvnCard>
          )}

          {/* Mint Button */}
          {file && name.trim() && description.trim() && (
            <div className="text-center">
              {!auth.isAuthenticated ? (
                <div className="text-center text-orange-600 bg-orange-50 p-3 rounded-lg">
                  Please connect your wallet to mint an IP-NFT
                </div>
              ) : (
                <ProvnButton
                  onClick={handleMint}
                  disabled={isMinting}
                  className="w-full"
                >
                  {isMinting ? "Minting..." : "Mint IP-NFT"}
                </ProvnButton>
              )}
            </div>
          )}

          {/* Wallet Connection Issues Help */}
          {address && auth.isAuthenticated && !origin && (
            <div className="text-center text-red-600 bg-red-50 p-3 rounded-lg">
              <p className="mb-2">Wallet connected but Origin SDK not ready</p>
              <ProvnButton 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  toast.info("Please refresh the page and reconnect your wallet");
                }}
              >
                Need Help?
              </ProvnButton>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}