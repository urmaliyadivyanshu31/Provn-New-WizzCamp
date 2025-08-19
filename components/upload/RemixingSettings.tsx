"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, DollarSign, Clock, Shield, Briefcase, Crown, Check } from "lucide-react"
import { RemixingConfiguration } from "@/types/remixing"
import { ProvnButton } from "@/components/provn/button"
import { toast } from "sonner"

interface RemixingSettingsProps {
  isOpen: boolean
  onClose: () => void
  onSave: (remixingConfig: RemixingConfiguration) => void
  initialConfig?: RemixingConfiguration
}

const PRESET_PRICES = [0, 0.1, 0.5, 1.0, 2.0, 5.0];
const PRESET_DURATIONS = [86400, 604800, 2592000, 7776000, 31536000]; // 1 day, 1 week, 1 month, 3 months, 1 year

const LICENSE_TYPES = [
  {
    id: 'basic',
    name: 'Basic License',
    description: 'Repost on social media',
    icon: Shield,
    color: 'text-blue-400',
    terms: { requiresAttribution: true, allowCommercialUse: false, allowDerivatives: false }
  },
  {
    id: 'commercial',
    name: 'Commercial License', 
    description: 'Use in videos & content',
    icon: Briefcase,
    color: 'text-purple-400',
    terms: { requiresAttribution: true, allowCommercialUse: true, allowDerivatives: true }
  },
  {
    id: 'full',
    name: 'Full Rights',
    description: 'Complete usage freedom',
    icon: Crown,
    color: 'text-yellow-400',
    terms: { requiresAttribution: false, allowCommercialUse: true, allowDerivatives: true }
  }
];

export function RemixingSettings({ isOpen, onClose, onSave, initialConfig }: RemixingSettingsProps) {
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? true)
  const [selectedPrice, setSelectedPrice] = useState(initialConfig?.price ?? 0)
  const [customPrice, setCustomPrice] = useState("")
  const [selectedDuration, setSelectedDuration] = useState(initialConfig?.duration ?? 2592000) // Default: 1 month
  const [customDuration, setCustomDuration] = useState("")
  const [selectedLicenseType, setSelectedLicenseType] = useState(initialConfig?.template ?? 'basic')

  const handleSave = () => {
    const price = customPrice ? parseFloat(customPrice) : selectedPrice;
    const licenseType = LICENSE_TYPES.find(type => type.id === selectedLicenseType);
    
    const duration = customDuration ? parseInt(customDuration) * 86400 : selectedDuration; // Convert days to seconds if custom
    
    const finalConfig: RemixingConfiguration = {
      enabled,
      price,
      duration,
      template: selectedLicenseType as any,
      permissionLevel: enabled ? 'basic' : 'none',
      requiresAttribution: licenseType?.terms.requiresAttribution ?? true,
      allowCommercialUse: licenseType?.terms.allowCommercialUse ?? false,
      allowDerivatives: licenseType?.terms.allowDerivatives ?? false,
      message: `${licenseType?.name} - ${licenseType?.description}`
    };
    
    onSave(finalConfig);
    onClose();
    toast.success('Licensing settings saved!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-provn-surface border border-provn-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm mx-2 sm:mx-4 overflow-hidden max-h-[calc(100vh-2rem)] my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-provn-border">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-provn-text font-headline">
              Licensing Settings
            </h2>
            <p className="text-xs text-provn-muted font-headline">Configure your content licensing</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-4 h-4 text-provn-muted hover:text-provn-text" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Enable Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enable-licensing"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 text-provn-accent bg-provn-surface-2 border-provn-border rounded focus:ring-provn-accent focus:ring-2"
            />
            <label htmlFor="enable-licensing" className="text-provn-text font-medium font-headline text-sm">
              Allow others to license this content
            </label>
          </div>

          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* License Price */}
              <div>
                <label className="block text-sm font-headline text-provn-text mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  Price (CAMP Tokens)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customPrice || selectedPrice || ""}
                    onChange={(e) => {
                      setCustomPrice(e.target.value);
                      setSelectedPrice(0);
                    }}
                    placeholder="0.00"
                    className="w-full p-3 pr-16 border border-provn-border rounded-lg bg-provn-surface-2 text-provn-text placeholder-provn-muted focus:outline-none focus:ring-1 focus:ring-provn-accent focus:border-provn-accent transition-all font-headline"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-provn-muted font-headline">
                    CAMP
                  </span>
                </div>
                
                {/* Quick Prices */}
                <div className="flex gap-1 sm:gap-1.5 mt-2">
                  {PRESET_PRICES.map((price) => (
                    <button
                      key={price}
                      onClick={() => {
                        setSelectedPrice(price);
                        setCustomPrice(price.toString());
                      }}
                      className="flex-1 py-2 px-1.5 text-xs rounded border border-provn-border hover:border-provn-accent hover:bg-provn-accent/5 text-provn-muted hover:text-provn-text transition-all font-headline touch-manipulation min-h-[32px] active:scale-95"
                    >
                      {price === 0 ? 'Free' : price.toString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* License Duration */}
              <div>
                <label className="block text-sm font-headline text-provn-text mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  License Duration
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={customDuration || (selectedDuration / 86400) || ""}
                    onChange={(e) => {
                      setCustomDuration(e.target.value);
                      setSelectedDuration(0);
                    }}
                    placeholder="30"
                    className="w-full p-3 pr-16 border border-provn-border rounded-lg bg-provn-surface-2 text-provn-text placeholder-provn-muted focus:outline-none focus:ring-1 focus:ring-provn-accent focus:border-provn-accent transition-all font-headline"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-provn-muted font-headline">
                    Days
                  </span>
                </div>
                
                {/* Quick Durations */}
                <div className="grid grid-cols-3 gap-1 sm:gap-1.5 mt-2">
                  {PRESET_DURATIONS.map((duration) => {
                    const days = duration / 86400;
                    const label = days === 1 ? '1 Day' : 
                                 days === 7 ? '1 Week' : 
                                 days === 30 ? '1 Month' : 
                                 days === 90 ? '3\nMonths' : '1 Year';
                    return (
                      <button
                        key={duration}
                        onClick={() => {
                          setSelectedDuration(duration);
                          setCustomDuration(days.toString());
                        }}
                        className="py-2 px-1.5 text-xs rounded border border-provn-border hover:border-provn-accent hover:bg-provn-accent/5 text-provn-muted hover:text-provn-text transition-all font-headline touch-manipulation min-h-[32px] active:scale-95 whitespace-pre-line leading-tight"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* License Type */}
              <div>
                <label className="block text-sm font-headline text-provn-text mb-2">
                  License Type
                </label>
                <div className="space-y-2">
                  {LICENSE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedLicenseType === type.id;
                    
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedLicenseType(type.id)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-provn-accent bg-provn-accent/10'
                            : 'border-provn-border hover:border-provn-accent/50 bg-provn-surface-2'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-provn-accent/20' : 'bg-provn-accent/10'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              isSelected ? 'text-provn-accent' : type.color
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold text-sm mb-1 font-headline ${
                              isSelected ? 'text-provn-accent' : 'text-provn-text'
                            }`}>
                              {type.name}
                            </h4>
                            <p className="text-xs text-provn-muted font-headline">
                              {type.description}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-provn-accent" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1 sm:pt-2">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2.5 text-sm text-provn-muted hover:text-provn-text transition-colors font-headline touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-provn-accent hover:bg-provn-accent-press text-white font-medium py-2.5 px-4 rounded-lg transition-all font-headline touch-manipulation min-h-[40px] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Settings
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-2 border-t border-provn-border">
            <p className="text-xs text-provn-muted font-headline">
              {enabled ? `${customPrice || selectedPrice || 0} CAMP per license • ${customDuration || (selectedDuration / 86400) || 30} days` : 'Licensing disabled'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}