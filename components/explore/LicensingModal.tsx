"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Shield, 
  Briefcase, 
  Crown,
  DollarSign,
  Check,
  Loader2,
  AlertCircle,
  Clock
} from "lucide-react";
import { ExploreVideo } from "@/types/explore";
import { trackLicenseEvent } from "@/components/analytics/GoogleAnalytics";
import { useOriginLicensing } from "@/hooks/useOriginLicensing";
import { useAuth } from "@campnetwork/origin/react";

interface LicensingModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: ExploreVideo;
  isAuthenticated: boolean;
}

const LICENSE_OPTIONS = [
  {
    id: "basic",
    name: "Basic License",
    description: "Repost on social media",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    id: "commercial", 
    name: "Commercial License",
    description: "Use in videos & content",
    icon: Briefcase,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10", 
    borderColor: "border-purple-500/20",
    popular: true
  },
  {
    id: "full",
    name: "Full Rights",
    description: "Complete usage freedom", 
    icon: Crown,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20"
  }
];

export function LicensingModal({ isOpen, onClose, video, isAuthenticated }: LicensingModalProps) {
  const { walletAddress } = useAuth();
  const { buyLicense, getLicenseTerms, loading } = useOriginLicensing();
  const [licenseTerms, setLicenseTerms] = useState<any>(null);
  const [periods, setPeriods] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if current user is the video creator
  const isOwnVideo = walletAddress && video.creator.walletAddress && 
    walletAddress.toLowerCase() === video.creator.walletAddress.toLowerCase();

  // Don't render modal if remixing is disabled or user owns the video
  if (!video.remixing?.enabled || isOwnVideo) {
    return null;
  }
  
  // Fetch license terms from Origin SDK
  useEffect(() => {
    if (isOpen && video.tokenId) {
      getLicenseTerms(video.tokenId).then(terms => {
        if (terms) {
          setLicenseTerms(terms);
        }
      });
    }
  }, [isOpen, video.tokenId, getLicenseTerms]);

  // Use licensing terms from Origin SDK or fallback to video data
  const actualPrice = licenseTerms ? Number(licenseTerms.price) / (10**18) : video.licensing.price; // Convert from Wei to CAMP
  const actualDuration = licenseTerms ? licenseTerms.duration : video.licensing.duration;
  const licensePricePerPeriod = actualPrice * periods;

  const formatCAMP = (amount: number) => {
    // Handle free content
    if (amount === 0) return "Free";
    // Ensure proper decimal formatting for CAMP tokens
    return `${amount.toFixed(amount < 1 ? 2 : 1)} CAMP`;
  };

  const handlePurchase = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsProcessing(true);

    // Track license purchase attempt
    trackLicenseEvent('purchase_attempt', video.tokenId, licensePricePerPeriod, actualDuration);

    try {
      // Use Origin SDK to purchase license
      const success = await buyLicense(video.tokenId, periods);
      
      if (success) {
        // Track successful purchase
        trackLicenseEvent('purchase_success', video.tokenId, licensePricePerPeriod, actualDuration);
        
        // Show success and close modal
        onClose();
      }
    } catch (error) {
      console.error("License purchase failed:", error);
      
      // Track failed purchase
      trackLicenseEvent('purchase_failed', video.tokenId, licensePricePerPeriod, actualDuration);
    } finally {
      setIsProcessing(false);
    }
  }, [isAuthenticated, video.tokenId, periods, licensePricePerPeriod, actualDuration, buyLicense, onClose]);

  if (!isOpen) return null;

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
                License Content
              </h2>
              <p className="text-xs text-provn-muted font-headline">
                by {video.creator.displayName}
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
            {/* Video Preview */}
            <div className="flex items-center gap-3 p-3 bg-provn-surface-2 rounded-lg">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-provn-text text-sm truncate font-headline">
                  {video.title}
                </h3>
                <p className="text-xs text-provn-muted font-headline">
                  IP-Protected Content
                </p>
              </div>
            </div>

            {/* License Terms Display */}
            <div className="bg-provn-surface-2 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-provn-text mb-2 font-headline">
                License Terms
              </h3>
              <div className="space-y-2 text-xs text-provn-muted">
                <div className="flex justify-between">
                  <span>Price per period:</span>
                  <span className="font-medium text-provn-text">
                    {formatCAMP(actualPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration per period:</span>
                  <span className="font-medium text-provn-text">
                    {actualDuration ? Math.floor(actualDuration / 86400) + ' days' : '30 days'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>License type:</span>
                  <span className="font-medium text-provn-text">
                    {video.remixing?.template || 'Basic License'}
                  </span>
                </div>
              </div>
            </div>

            {/* Period Selection */}
            <div>
              <label className="block text-sm font-headline text-provn-text mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Number of Periods
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPeriods(Math.max(1, periods - 1))}
                  disabled={periods <= 1}
                  className="w-8 h-8 rounded-lg bg-provn-surface-2 border border-provn-border text-provn-text hover:bg-provn-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-semibold text-provn-text font-headline">
                    {periods}
                  </span>
                  <p className="text-xs text-provn-muted font-headline">
                    {periods === 1 ? 'period' : 'periods'}
                  </p>
                </div>
                <button
                  onClick={() => setPeriods(periods + 1)}
                  className="w-8 h-8 rounded-lg bg-provn-surface-2 border border-provn-border text-provn-text hover:bg-provn-accent hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-provn-text font-headline">
                    Total License Cost
                  </p>
                  <p className="text-xs text-provn-muted font-headline">
                    {periods} {periods === 1 ? 'period' : 'periods'} • {actualDuration ? Math.floor(actualDuration * periods / 86400) : periods * 30} days total
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-provn-accent font-headline">
                    {formatCAMP(licensePricePerPeriod)}
                  </div>
                  <div className="text-xs text-green-400 font-headline">
                    No platform fee
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1 sm:pt-2">
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2.5 text-sm text-provn-muted hover:text-provn-text transition-colors font-headline touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={!isAuthenticated || isProcessing}
                className="flex-1 bg-provn-accent hover:bg-provn-accent-press disabled:bg-provn-muted disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-all font-headline touch-manipulation min-h-[40px] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    {licensePricePerPeriod === 0 ? "Get Free License" : "Purchase License"}
                  </>
                )}
              </button>
            </div>

            {!isAuthenticated && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-headline">Please connect your wallet to purchase a license</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 border-t border-provn-border">
              <p className="text-xs text-provn-muted font-headline">
                Powered by Origin SDK • Secure CAMP payments
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}