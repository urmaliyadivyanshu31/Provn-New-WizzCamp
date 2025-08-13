"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { ProvnButton } from "./button";
import { ProvnCard, ProvnCardContent } from "./card";
import { checkProfanity, sanitize } from "../../utils/utils";
import { ConfettiTrigger } from "./confetti";

interface MintFormData {
  title: string;
  description: string;
  tags: string;
  allowRemixing: boolean;
}

type LicenseTerms = {
  price: string;
  duration: number;
  royaltyBps: number;
  paymentToken: string;
};

export default function IpNFTMint({ file, videoId }: { file: File; videoId?: string }) {
  const [formData, setFormData] = useState<MintFormData>({
    title: "",
    description: "",
    tags: "",
    allowRemixing: true,
  });
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);

  // Auto-fill title from filename if empty
  useEffect(() => {
    if (!formData.title && file.name) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  }, [file.name, formData.title]);

  const uploadToIpfs = async (videoId: string): Promise<string> => {
    const response = await fetch('/api/ipnft/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('provn_auth_token')}`
      },
      body: JSON.stringify({
        videoId,
        title: formData.title,
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        allowRemixing: formData.allowRemixing,
        royaltyPercentage: 5
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to mint IpNFT');
    }

    return result.data.metadataHash;
  };

  const handleMint = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!videoId) {
      toast.error("Video ID is required");
      return;
    }

    // Check for profanity
    if (checkProfanity(formData.title) || checkProfanity(formData.description)) {
      toast.error("Content contains inappropriate language");
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      // Start minting process
      toast.info("Uploading metadata to IPFS...");
      const metadataHash = await uploadToIpfs(videoId);
      setIpfsUrl(`ipfs://${metadataHash}`);

      // Poll for minting status
      toast.info("Minting IP-NFT on blockchain...");
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        try {
          const statusResponse = await fetch(`/api/videos/${videoId}`);
          const statusResult = await statusResponse.json();
          
          if (statusResult.success && statusResult.data.tokenId) {
            // Minting complete
            setMintResult(`IP-NFT minted successfully! Token ID: ${statusResult.data.tokenId}`);
            toast.success("IP-NFT minted successfully!");
            
            // Show confetti animation
            setTimeout(() => {
              // Reset form after confetti
              setFormData({
                title: "",
                description: "",
                tags: "",
                allowRemixing: true,
              });
            }, 2000);
            break;
          }
          
          // Wait 10 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 10000));
          attempts++;
        } catch (pollError) {
          console.error('Polling error:', pollError);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error('Minting is taking longer than expected. Please check back later.');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mint IP-NFT";
      setError(errorMessage);
      toast.error("Failed to mint IP-NFT", {
        description: errorMessage,
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleInputChange = (field: keyof MintFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ConfettiTrigger trigger={!!mintResult} />
      <ProvnCard>
        <ProvnCardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-provn-text">Mint IP-NFT</h2>
            <p className="text-provn-muted mt-2">
              Create an IP-NFT to protect and monetize your content
            </p>
          </div>

          {/* File Info */}
          <div className="bg-provn-surface/50 p-4 rounded-lg">
            <h3 className="font-semibold text-provn-text mb-2">File Details</h3>
            <div className="text-sm text-provn-muted space-y-1">
              <p><strong>Name:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {file.type}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-provn-text mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-primary focus:border-transparent"
                placeholder="Enter a descriptive title for your content"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-provn-text mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-primary focus:border-transparent resize-none"
                placeholder="Describe your content, its purpose, and any relevant details"
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-provn-text mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-primary focus:border-transparent"
                placeholder="Enter tags separated by commas (e.g., music, electronic, ambient)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowRemixing"
                checked={formData.allowRemixing}
                onChange={(e) => handleInputChange('allowRemixing', e.target.checked)}
                className="w-4 h-4 text-provn-primary bg-provn-surface border-provn-border rounded focus:ring-provn-primary focus:ring-2"
              />
              <label htmlFor="allowRemixing" className="text-sm text-provn-text">
                Allow remixing and derivative works
              </label>
            </div>
          </div>

          {/* Mint Button */}
          <div className="text-center">
            <ProvnButton
              onClick={handleMint}
              disabled={isMinting || !formData.title.trim() || !formData.description.trim()}
              className="w-full"
              size="lg"
            >
              {isMinting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Minting...
                </span>
              ) : (
                "Mint IP-NFT"
              )}
            </ProvnButton>
          </div>

          {/* Results */}
          {mintResult && (
            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-lg text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-green-400 mb-2">Success!</h3>
              <p className="text-green-300 mb-4">{mintResult}</p>
              {ipfsUrl && (
                <div className="bg-green-500/20 p-3 rounded-lg mb-4">
                  <p className="text-green-200 text-sm">
                    <strong>IPFS URL:</strong> {ipfsUrl}
                  </p>
                </div>
              )}
              <div className="text-xs text-green-300 mb-4">
                Your content is now protected on the blockchain! 🚀
              </div>
              <ProvnButton
                onClick={() => {
                  setMintResult(null);
                  setIpfsUrl(null);
                  setError(null);
                }}
                className="bg-green-500 hover:bg-green-600"
              >
                Mint Another IP-NFT
              </ProvnButton>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <h3 className="font-semibold text-red-400 mb-2">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </ProvnCardContent>
      </ProvnCard>
    </div>
  );
}