"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExploreVideo } from "@/types/explore";
import {
  X,
  ExternalLink,
  Flag,
  Shield,
  Eye,
  Heart,
  Share2,
  DollarSign,
  Copy,
  CheckCircle,
  AlertTriangle,
  Award,
  Clock,
  Hash,
  Calendar,
  User,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface VideoDetailsModalProps {
  video: ExploreVideo;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

export function VideoDetailsModal({ video, isOpen, onClose, isAuthenticated }: VideoDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCAMP = (amount: number) => {
    return `${amount.toFixed(amount < 1 ? 2 : 1)} CAMP`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleViewOnExplorer = () => {
    if (video.ipInfo.transactionHash) {
      window.open(`https://basecamp.cloud.blockscout.com/tx/${video.ipInfo.transactionHash}`, '_blank');
    }
  };

  const handleReport = () => {
    toast.info('Report functionality coming soon');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-provn-surface border border-provn-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-2 sm:mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-provn-border">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-provn-text font-headline">
                Content Details
              </h2>
              <p className="text-xs text-provn-muted font-headline">
                IP-NFT Information & Stats
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
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-provn-accent/20 flex items-center justify-center">
                    <Hash className="w-6 h-6 text-provn-accent" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-provn-text text-sm truncate font-headline">
                  {video.title}
                </h3>
                <p className="text-xs text-provn-muted font-headline">
                  by @{video.creator.handle}
                </p>
                <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  video.ipInfo.status === 'verified'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {video.ipInfo.status === 'verified' ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Verified IP
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      Pending
                    </>
                  )}
                </div>
              </div>
            </div>



            {/* IP-NFT Details */}
            <div>
              <label className="block text-sm font-headline text-provn-text mb-2 flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-400" />
                IP-NFT Details
              </label>
              <div className="space-y-2">
                {/* Token ID */}
                <div className="bg-provn-surface-2 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-provn-muted font-headline">Token ID</span>
                    <button
                      onClick={() => copyToClipboard(video.tokenId, 'Token ID')}
                      className="p-1 hover:bg-provn-surface rounded transition-colors"
                    >
                      <Copy className="w-3 h-3 text-provn-muted" />
                    </button>
                  </div>
                  <div className="font-mono text-xs text-provn-text font-headline">
                    #{video.tokenId.length > 16 
                      ? `${video.tokenId.slice(0, 8)}...${video.tokenId.slice(-6)}`
                      : video.tokenId
                    }
                  </div>
                </div>

                {/* Content Type & Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-provn-surface-2 rounded-lg p-3">
                    <div className="text-xs text-provn-muted font-headline mb-1">Content Type</div>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      video.ipInfo.type === 'original'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      <Award className="w-3 h-3" />
                      {video.ipInfo.type === 'original' ? 'Original' : 'Remix'}
                    </div>
                  </div>
                  <div className="bg-provn-surface-2 rounded-lg p-3">
                    <div className="text-xs text-provn-muted font-headline mb-1">Minted</div>
                    <div className="flex items-center gap-1 text-xs text-provn-text font-headline">
                      <Calendar className="w-3 h-3" />
                      {formatDate(video.ipInfo.mintDate)}
                    </div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="bg-provn-surface-2 rounded-lg p-3">
                  <div className="text-xs text-provn-muted font-headline mb-1">Creator</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-provn-accent/20 flex items-center justify-center">
                      <User className="w-3 h-3 text-provn-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-provn-text font-headline">
                        {video.creator.displayName}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-provn-muted font-headline">
                          {formatAddress(video.creator.walletAddress)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(video.creator.walletAddress, 'Creator address')}
                          className="p-0.5 hover:bg-provn-surface rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-provn-muted hover:text-provn-accent" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Licensing Info - Only show if remixing is enabled and price is set */}
            {video.remixing.enabled && video.licensing?.price && video.licensing.price > 0 && (
              <div>
                <label className="block text-sm font-headline text-provn-text mb-2 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  License Available
                </label>
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-provn-text font-headline capitalize">
                        {video.remixing.template || 'Basic'} License
                      </div>
                      <div className="text-xs text-provn-muted font-headline">
                        30 days usage rights
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-provn-accent font-headline">
                        {formatCAMP(video.licensing.price)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {video.remixing.requiresAttribution && (
                      <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full font-headline">
                        Attribution
                      </span>
                    )}
                    {video.remixing.allowCommercialUse && (
                      <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full font-headline">
                        Commercial OK
                      </span>
                    )}
                    {video.remixing.allowDerivatives && (
                      <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded-full font-headline">
                        Modifications OK
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 sm:pt-2">
              <button
                onClick={handleViewOnExplorer}
                disabled={!video.ipInfo.transactionHash}
                className="flex items-center justify-center gap-2 py-2.5 px-3 text-sm border border-provn-border text-provn-muted hover:text-provn-text hover:border-provn-accent/50 rounded-lg transition-all font-headline touch-manipulation disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                Explorer
              </button>
              <button
                onClick={handleReport}
                className="flex items-center justify-center gap-2 py-2.5 px-3 text-sm border border-provn-border text-provn-muted hover:text-provn-text hover:border-provn-accent/50 rounded-lg transition-all font-headline touch-manipulation"
              >
                <Flag className="w-4 h-4" />
                Report
              </button>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-provn-border">
              <p className="text-xs text-provn-muted font-headline">
                Powered by Origin SDK • BaseCAMP Network
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}