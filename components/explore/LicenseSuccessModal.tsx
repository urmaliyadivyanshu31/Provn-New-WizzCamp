"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Check, 
  ExternalLink,
  DollarSign,
  Download,
  Copy,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@campnetwork/origin/react";

interface LicenseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash: string;
  tokenId: string;
  periods: number;
  totalCost: string;
  licenseType: string;
  expiryDate?: Date;
  creatorName: string;
  contentTitle: string;
}

export function LicenseSuccessModal({
  isOpen,
  onClose,
  transactionHash,
  tokenId,
  periods,
  totalCost,
  licenseType,
  expiryDate,
  creatorName,
  contentTitle
}: LicenseSuccessModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);
  const { walletAddress } = useAuth();

  if (!isOpen) return null;

  const explorerUrl = `https://basecamp.cloud.blockscout.com/tx/${transactionHash}`;
  const formattedCost = (parseFloat(totalCost) / 10**18).toFixed(4);
  
  // Calculate actual duration in days
  const durationInDays = periods * 7; // Assuming 7 days per period based on the SDK response

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Fetch the video content and trigger download
      const response = await fetch(`/api/video/${tokenId}`);
      const data = await response.json();
      
      if (data.success && data.video?.videoUrl) {
        // Create a download link for the IPFS content
        const link = document.createElement('a');
        link.href = data.video.videoUrl;
        link.download = `${contentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_IP-NFT_${tokenId}.mp4`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Download started! Check your downloads folder.");
      } else {
        throw new Error('Video content not found');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Download failed. Please try again later.");
      // Don't open any URL if download fails
      console.log('Video download failed, no fallback URL available');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyTransactionHash = async () => {
    try {
      await navigator.clipboard.writeText(transactionHash);
      setHashCopied(true);
      toast.success("Transaction hash copied!");
      setTimeout(() => setHashCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-provn-surface border border-provn-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm mx-2 sm:mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-provn-border">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-provn-text font-headline">
                License Purchased
              </h2>
              <p className="text-xs text-provn-muted font-headline">
                by {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'You'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors touch-manipulation"
            >
              <X className="w-4 h-4 text-provn-muted hover:text-provn-text" />
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Success Indicator */}
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-400 text-sm font-headline">
                  Purchase Successful
                </h3>
                <p className="text-xs text-provn-muted font-headline">
                  {contentTitle}
                </p>
              </div>
            </div>

            {/* License Details */}
            <div className="bg-provn-surface-2 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-provn-text mb-2 font-headline">
                License Details
              </h3>
              <div className="space-y-2 text-xs text-provn-muted font-headline">
                <div className="flex justify-between">
                  <span>Amount paid:</span>
                  <span className="font-medium text-provn-text font-headline">
                    {formattedCost} PROVN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Valid for:</span>
                  <span className="font-medium text-provn-text font-headline">
                    {durationInDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span className="font-medium text-provn-text font-headline">
                    {expiryDate?.toLocaleDateString() || 'Check wallet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Hash */}
            <div className="bg-provn-surface-2 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-provn-muted font-headline">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyTransactionHash}
                    className="text-xs text-provn-accent hover:text-provn-accent-press transition-colors flex items-center gap-1 font-headline"
                  >
                    {hashCopied ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-provn-accent hover:text-provn-accent-press transition-colors flex items-center gap-1 font-headline"
                  >
                    Explorer
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="font-mono text-xs text-provn-text bg-provn-bg rounded px-2 py-1 break-all font-headline">
                {transactionHash}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1 sm:pt-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 bg-provn-accent hover:bg-provn-accent-press disabled:bg-provn-muted disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-all font-headline touch-manipulation min-h-[40px] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <Download className="w-4 h-4 animate-pulse" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Content
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2.5 text-sm text-provn-muted hover:text-provn-text transition-colors font-headline touch-manipulation"
              >
                Close
              </button>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-provn-border">
              <p className="text-xs text-provn-muted font-headline">
                Licensed content ready for remixing
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}