"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Check, 
  ExternalLink,
  Calendar,
  DollarSign,
  Hash,
  Clock,
  Shield
} from "lucide-react";

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
  if (!isOpen) return null;

  const explorerUrl = `https://basecamp.cloud.blockscout.com/tx/${transactionHash}`;
  const formattedCost = (parseFloat(totalCost) / 10**18).toFixed(4);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-provn-surface border border-provn-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-2 sm:mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-provn-border bg-gradient-to-r from-green-500/10 to-green-400/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-provn-text font-headline">
                License Purchased!
              </h2>
              <p className="text-xs text-provn-muted">
                Transaction confirmed on BaseCAMP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-4 h-4 text-provn-muted hover:text-provn-text" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Content Info */}
          <div className="bg-provn-surface-2 rounded-lg p-3">
            <h3 className="font-semibold text-provn-text text-sm font-headline">
              Licensed Content
            </h3>
            <p className="text-provn-muted text-xs mt-1">{contentTitle}</p>
            <p className="text-provn-muted text-xs">by {creatorName}</p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-provn-text text-sm font-headline">
              Transaction Details
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-green-500" />
                <div>
                  <div className="text-provn-muted">Amount Paid</div>
                  <div className="text-provn-text font-medium">{formattedCost} CAMP</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-blue-500" />
                <div>
                  <div className="text-provn-muted">Periods</div>
                  <div className="text-provn-text font-medium">{periods}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-purple-500" />
                <div>
                  <div className="text-provn-muted">License Type</div>
                  <div className="text-provn-text font-medium">{licenseType}</div>
                </div>
              </div>
              
              {expiryDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-orange-500" />
                  <div>
                    <div className="text-provn-muted">Valid Until</div>
                    <div className="text-provn-text font-medium">
                      {expiryDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="bg-provn-surface-2 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-3 h-3 text-provn-accent" />
                <span className="text-xs text-provn-muted">Transaction Hash</span>
              </div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-provn-accent hover:text-provn-accent-press transition-colors"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="mt-2 font-mono text-xs text-provn-text bg-provn-bg rounded px-2 py-1 break-all">
              {transactionHash}
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-provn-text mb-2 font-headline">
              What's Next?
            </h4>
            <ul className="text-xs text-provn-muted space-y-1">
              <li>• You can now use this content according to your license terms</li>
              <li>• Attribution to the original creator is required</li>
              <li>• Your license will expire on {expiryDate?.toLocaleDateString() || 'the specified date'}</li>
              <li>• You can view all your licenses in your profile</li>
            </ul>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-provn-accent hover:bg-provn-accent-press text-white font-medium py-3 px-4 rounded-lg transition-all font-headline touch-manipulation active:scale-[0.98]"
          >
            Continue Exploring
          </button>
        </div>
      </motion.div>
    </div>
  );
}