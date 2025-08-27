"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import { LicenseSuccessModal } from "@/components/explore/LicenseSuccessModal";

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
  const { buyLicense, getLicenseTerms, loading, error, clearError } = useOriginLicensing();
  const [licenseTerms, setLicenseTerms] = useState<any>(null);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [hasValidTerms, setHasValidTerms] = useState(false);
  const [periods, setPeriods] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [transactionStep, setTransactionStep] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    transactionHash: string;
    expiryDate?: Date;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Check if current user is the video creator
  const isOwnVideo = walletAddress && video.creator.walletAddress && 
    walletAddress.toLowerCase() === video.creator.walletAddress.toLowerCase();

  // Check if licensing is available based on actual data
  const hasLicenseConfig = video.licensing?.price >= 0 && 
                          video.licensing?.duration > 0 && 
                          (video.remixing?.enabled !== false); // Allow licensing if not explicitly disabled

  // Debug logging (only when modal opens)
  useEffect(() => {
    if (isOpen) {
      console.log('📺 LicensingModal opened:', {
        remixingEnabled: video.remixing?.enabled,
        hasLicenseConfig,
        licensingPrice: video.licensing?.price,
        licensingDuration: video.licensing?.duration,
        isOwnVideo,
        walletAddress,
        creatorWallet: video.creator.walletAddress,
        tokenId: video.tokenId,
        tokenIdType: typeof video.tokenId,
        tokenIdLength: video.tokenId?.length,
        isNumeric: /^\d+$/.test(video.tokenId?.toString() || ''),
        videoObject: {
          tokenId: video.tokenId,
          title: video.title,
          ipInfo: video.ipInfo
        }
      });
    }
  }, [isOpen, video.remixing?.enabled, hasLicenseConfig, isOwnVideo, walletAddress, video.creator.walletAddress, video.tokenId]);
  
  // Reset states when modal opens or video changes
  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setPurchaseSuccess(false);
      setTransactionStep(null);
      setTermsError(null);
      setHasValidTerms(false);
      clearError();
    } else {
      // Reset license terms when modal closes
      setLicenseTerms(null);
      setTermsLoading(false);
      setTermsError(null);
      setHasValidTerms(false);
    }
  }, [isOpen, clearError]);
  
  // Fetch license terms only when needed with comprehensive validation
  useEffect(() => {
    if (isOpen && video.tokenId && !termsLoading && !licenseTerms) {
      console.log('🔍 Fetching license terms for tokenId:', video.tokenId);
      setTermsLoading(true);
      setTermsError(null);
      setHasValidTerms(false);
      
      getLicenseTerms(video.tokenId).then(terms => {
        if (terms) {
          // Validate that terms are usable for purchases
          const price = Number(terms.price) || 0;
          const duration = Number(terms.duration) || 0;
          
          console.log('📋 License terms validation:', {
            price,
            duration,
            hasPrice: price >= 0,
            hasDuration: duration > 0,
            termsObject: terms
          });
          
          if (price >= 0 && duration > 0) {
            setLicenseTerms(terms);
            setHasValidTerms(true);
            console.log('✅ Valid license terms fetched successfully');
          } else {
            setTermsError('License terms are incomplete or invalid');
            console.warn('⚠️ Invalid license terms: missing price or duration');
          }
        } else {
          setTermsError('No license terms found for this content');
          console.warn('⚠️ No license terms returned from contract');
        }
        setTermsLoading(false);
      }).catch(error => {
        console.error('❌ Failed to fetch license terms:', error);
        setTermsError('Failed to load license terms. This content may not be available for licensing.');
        setTermsLoading(false);
      });
    }
  }, [isOpen, video.tokenId, termsLoading, licenseTerms, getLicenseTerms]);

  // Use licensing terms from Origin SDK or fallback to video data (memoized)
  const { actualPrice, actualDuration, licensePricePerPeriod, hasActualTerms } = useMemo(() => {
    // If we have valid contract terms, use them
    if (licenseTerms && Number(licenseTerms.price) > 0 && licenseTerms.duration > 0) {
      const price = Number(licenseTerms.price) / (10**18);
      const duration = licenseTerms.duration;
      const totalPrice = price * periods;
      
      return {
        actualPrice: price,
        actualDuration: duration,
        licensePricePerPeriod: totalPrice,
        hasActualTerms: true
      };
    }
    
    // Fallback to database/video data if contract terms are empty/invalid
    const price = video.licensing.price || 0;
    const duration = video.licensing.duration || 0;
    const totalPrice = price * periods;
    
    // Check if we have valid fallback terms
    const hasFallbackTerms = (price >= 0 && duration > 0 && hasLicenseConfig);
    
    console.log('💾 Using database fallback terms:', {
      price,
      duration,
      hasLicenseConfig,
      hasFallbackTerms,
      videoPricing: video.licensing?.price,
      videoDuration: video.licensing?.duration
    });
    
    return {
      actualPrice: price,
      actualDuration: duration,
      licensePricePerPeriod: totalPrice,
      hasActualTerms: hasFallbackTerms
    };
  }, [licenseTerms, video.licensing.price, video.licensing.duration, periods, hasLicenseConfig]);

  const formatPROVN = useCallback((amount: number) => {
    // Handle free content
    if (amount === 0) return "Free";
    // Ensure proper decimal formatting for PROVN tokens
    return `${amount.toFixed(amount < 1 ? 2 : 1)} PROVN`;
  }, []);

  const handlePurchase = useCallback(async () => {
    console.log('🎬 LicensingModal: handlePurchase called', {
      isAuthenticated,
      tokenId: video.tokenId,
      periods,
      price: licensePricePerPeriod
    });
    
    if (!isAuthenticated) {
      console.log('❌ LicensingModal: Not authenticated, returning early');
      return;
    }

    console.log('🚀 LicensingModal: Starting purchase process...');
    setIsProcessing(true);
    setPurchaseSuccess(false);
    clearError();
    setTransactionStep('Preparing transaction...');

    // Track license purchase attempt
    trackLicenseEvent('purchase_attempt', video.tokenId, licensePricePerPeriod, actualDuration);

    try {
      setTransactionStep('Confirming payment...');
      
      console.log('🔄 LicensingModal: Calling buyLicense with:', {
        tokenId: video.tokenId,
        periods,
        type: typeof video.tokenId
      });
      
      // Use Origin SDK to purchase license
      const result = await buyLicense(video.tokenId, periods);
      
      console.log('✅ LicensingModal: buyLicense result:', result);
      
      if (result.success) {
        setTransactionStep('Purchase successful!');
        setPurchaseSuccess(true);
        
        // Set success data and show success modal
        if (result.transactionHash) {
          setSuccessData({
            transactionHash: result.transactionHash,
            expiryDate: result.expiryDate
          });
          setShowSuccessModal(true);
        }
        
        // Track successful purchase
        trackLicenseEvent('purchase_success', video.tokenId, licensePricePerPeriod, actualDuration);
        
        // Auto-close modal after success delay if no success modal
        if (!result.transactionHash) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      }
    } catch (error) {
      console.error("License purchase failed:", error);
      setTransactionStep(null);
      
      // Track failed purchase
      trackLicenseEvent('purchase_failed', video.tokenId, licensePricePerPeriod, actualDuration);
    } finally {
      setIsProcessing(false);
    }
  }, [isAuthenticated, video.tokenId, periods, licensePricePerPeriod, actualDuration, buyLicense, onClose, clearError]);
  
  // Don't render modal if user owns the video or licensing is not configured
  if (!isOpen || isOwnVideo) {
    return null;
  }

  return (
    <AnimatePresence>
      <div 
        key="licensing-modal-backdrop"
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      >
        <motion.div
          key="licensing-modal-content"
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
              {termsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-provn-accent" />
                  <span className="ml-2 text-xs text-provn-muted">Loading terms...</span>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-provn-muted">
                  <div className="flex justify-between">
                    <span>Price per period:</span>
                    <span className="font-medium text-provn-text">
                      {formatPROVN(actualPrice)}
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
              )}
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
                    {formatPROVN(licensePricePerPeriod)}
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
                disabled={isProcessing}
                className="px-3 sm:px-4 py-2.5 text-sm text-provn-muted hover:text-provn-text transition-colors font-headline touch-manipulation disabled:opacity-50"
              >
                {purchaseSuccess ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={(e) => {
                  console.log('💆 Purchase button clicked!', {
                    isAuthenticated,
                    isProcessing,
                    purchaseSuccess,
                    hasValidTerms,
                    hasActualTerms,
                    termsError,
                    disabled: !isAuthenticated || isProcessing || purchaseSuccess || !hasActualTerms
                  });
                  e.preventDefault();
                  e.stopPropagation();
                  handlePurchase();
                }}
                disabled={!isAuthenticated || isProcessing || purchaseSuccess || termsLoading || !hasActualTerms}
                className={`flex-1 font-medium py-2.5 px-4 rounded-lg transition-all font-headline touch-manipulation min-h-[40px] active:scale-[0.98] flex items-center justify-center gap-2 ${
                  purchaseSuccess 
                    ? 'bg-green-500 text-white' 
                    : hasActualTerms
                    ? 'bg-provn-accent hover:bg-provn-accent-press disabled:bg-provn-muted disabled:cursor-not-allowed text-white'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                {purchaseSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    License Purchased!
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {transactionStep?.includes('Preparing') ? 'Preparing...' : 
                     transactionStep?.includes('Confirming') ? 'Confirm in Wallet...' : 
                     'Processing...'}
                  </>
                ) : termsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Terms...
                  </>
                ) : !hasActualTerms ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    {termsError ? 'Terms Unavailable' : 'No License Available'}
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    {licensePricePerPeriod === 0 ? "Get Free License" : "Purchase License"}
                  </>
                )}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs font-headline">{error}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={clearError}
                        className="text-xs text-red-300 hover:text-red-200 underline"
                      >
                        Dismiss
                      </button>
                      {!isProcessing && (
                        <button
                          onClick={handlePurchase}
                          className="text-xs text-red-300 hover:text-red-200 underline"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {purchaseSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-headline">License purchased successfully! You can now use this content.</span>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {isProcessing && transactionStep && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-headline">{transactionStep}</span>
                </div>
              </div>
            )}

            {/* Terms Error Display */}
            {termsError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs font-headline">{termsError}</span>
                    <div className="mt-1 text-xs text-red-300">
                      This content owner needs to set up license terms before it can be licensed.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms Loading/Error State */}
            {!termsLoading && !licenseTerms && !termsError && !isAuthenticated && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-headline">Please connect your wallet to purchase a license</span>
                </div>
              </div>
            )}

            {!termsLoading && !licenseTerms && !termsError && isAuthenticated && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-headline">Unable to load license terms. Please try again.</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 border-t border-provn-border">
              <p className="text-xs text-provn-muted font-headline">
                Powered by Origin SDK • Secure PROVN payments
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Success Modal */}
      {successData && (
        <LicenseSuccessModal
          key="license-success-modal"
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            onClose(); // Close the main licensing modal too
          }}
          transactionHash={successData.transactionHash}
          tokenId={video.tokenId}
          periods={periods}
          totalCost={(licensePricePerPeriod * (10**18)).toString()}
          licenseType={video.remixing?.template || 'Basic License'}
          expiryDate={successData.expiryDate}
          creatorName={video.creator.displayName}
          contentTitle={video.title}
        />
      )}
    </AnimatePresence>
  );
}