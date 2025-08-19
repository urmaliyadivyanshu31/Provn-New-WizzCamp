"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExploreVideo } from "@/types/explore"
import { LicenseTemplate, UserRemixingPreference } from "@/types/remixing"
import { 
  X, 
  Check, 
  Settings, 
  Share2, 
  Shuffle, 
  MessageCircle, 
  Coins,
  Info,
  ChevronRight,
  Clock,
  User
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { useOriginLicensing } from "@/hooks/useOriginLicensing"
import { toast } from "sonner"

interface RemixingModalProps {
  video: ExploreVideo
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
}

const ICON_MAP = {
  'repost': Share2,
  'remix': Shuffle,
  'reaction': MessageCircle,
  'custom': Settings
}

export function RemixingModal({ video, isOpen, onClose, isAuthenticated }: RemixingModalProps) {
  const [templates, setTemplates] = useState<LicenseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLicense, setSelectedLicense] = useState<LicenseTemplate | null>(null)
  const [licensePeriods, setLicensePeriods] = useState(1)
  const [userPreferences, setUserPreferences] = useState({
    intendedUse: '',
    creditLine: '',
    plannedDistribution: [] as string[],
    contactInfo: ''
  })
  const [step, setStep] = useState<'select' | 'configure' | 'purchase'>('select')
  
  const { buyLicense, loading: purchaseLoading } = useOriginLicensing()

  useEffect(() => {
    if (isOpen) {
      fetchLicenseTemplates()
    }
  }, [isOpen])

  const fetchLicenseTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/remixing/templates')
      const data = await response.json()
      
      if (data.success) {
        // Filter templates based on what the video creator allows
        const allowedTemplates = data.templates.filter((template: LicenseTemplate) => {
          if (!video.remixing.enabled) return false
          
          // Always show custom if creator allows custom settings
          if (template.id === 'custom' && video.remixing.permissionLevel === 'custom') {
            return true
          }
          
          // Show specific license types the creator has enabled
          return video.remixing.template === template.id || 
                 (video.remixing.permissionLevel === 'basic' && ['repost', 'reaction'].includes(template.id)) ||
                 (video.remixing.permissionLevel === 'advanced' && ['repost', 'remix', 'reaction'].includes(template.id))
        })
        
        setTemplates(allowedTemplates)
      } else {
        toast.error('Failed to load license options')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load license options')
    } finally {
      setLoading(false)
    }
  }

  const handleLicenseSelect = (template: LicenseTemplate) => {
    setSelectedLicense(template)
    setStep('configure')
  }

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!selectedLicense) {
      toast.error('Please select a license type')
      return
    }

    try {
      const success = await buyLicense(video.tokenId, licensePeriods)
      if (success) {
        toast.success(`${selectedLicense.name} purchased successfully!`)
        
        // Save user preferences for future reference
        await saveUserPreferences()
        
        onClose()
      }
    } catch (error) {
      console.error('Failed to purchase license:', error)
    }
  }

  const saveUserPreferences = async () => {
    if (!selectedLicense || !isAuthenticated) return

    try {
      const preference: UserRemixingPreference = {
        tokenId: video.tokenId,
        userId: 'current_user', // This should come from auth context
        licenseType: selectedLicense.id,
        selectedTemplate: selectedLicense.id,
        intendedUse: userPreferences.intendedUse,
        creditLine: userPreferences.creditLine,
        plannedDistribution: userPreferences.plannedDistribution,
        contactInfo: userPreferences.contactInfo,
        submittedAt: new Date().toISOString()
      }

      // TODO: Save to database via API
      console.log('User preference saved:', preference)
    } catch (error) {
      console.error('Failed to save user preferences:', error)
    }
  }

  const totalLicenseCost = 0.1 * licensePeriods // Fixed cost of 0.1 CAMP per period

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-provn-surface border border-provn-border rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-provn-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-provn-accent/20 rounded-lg">
              <Coins className="w-5 h-5 text-provn-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-provn-text font-headline">License this Content</h2>
              <p className="text-sm text-provn-muted font-headline">Choose how you want to use this video</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-provn-muted" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-3 bg-provn-surface-2 border-b border-provn-border">
          <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-2 ${step === 'select' ? 'text-provn-accent' : 'text-provn-muted'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                step === 'select' ? 'border-provn-accent bg-provn-accent text-white' : 
                ['configure', 'purchase'].includes(step) ? 'border-provn-accent bg-provn-accent text-white' : 'border-provn-muted'
              }`}>
                1
              </div>
              <span className="font-headline">Select License</span>
            </div>
            <ChevronRight className="w-4 h-4 text-provn-muted" />
            <div className={`flex items-center gap-2 ${step === 'configure' ? 'text-provn-accent' : 'text-provn-muted'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                step === 'configure' ? 'border-provn-accent bg-provn-accent text-white' : 
                step === 'purchase' ? 'border-provn-accent bg-provn-accent text-white' : 'border-provn-muted'
              }`}>
                2
              </div>
              <span className="font-headline">Configure</span>
            </div>
            <ChevronRight className="w-4 h-4 text-provn-muted" />
            <div className={`flex items-center gap-2 ${step === 'purchase' ? 'text-provn-accent' : 'text-provn-muted'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                step === 'purchase' ? 'border-provn-accent bg-provn-accent text-white' : 'border-provn-muted'
              }`}>
                3
              </div>
              <span className="font-headline">Purchase</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Step 1: License Selection */}
          {step === 'select' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-provn-text mb-2 font-headline">Available License Types</h3>
                <p className="text-sm text-provn-muted font-headline">
                  Choose the type of license that matches your intended use of this content.
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provn-accent"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-provn-muted">
                  <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h4 className="font-medium font-headline mb-2">No Licenses Available</h4>
                  <p className="text-sm font-headline">The creator has not enabled licensing for this content.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => {
                    const IconComponent = ICON_MAP[template.id as keyof typeof ICON_MAP]
                    
                    return (
                      <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLicenseSelect(template)}
                        className="p-4 rounded-lg border border-provn-border hover:border-provn-accent bg-provn-surface-2 text-left transition-all"
                      >
                        {template.popular && (
                          <div className="inline-block bg-provn-accent text-white text-xs px-2 py-1 rounded-full font-headline mb-2">
                            Popular
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-provn-accent/10 rounded-lg">
                            <IconComponent className="w-5 h-5 text-provn-accent" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-provn-text mb-1 font-headline">
                              {template.name}
                            </h4>
                            <p className="text-sm text-provn-muted mb-3 font-headline">
                              {template.description}
                            </p>
                            
                            <div className="text-xs text-provn-muted font-headline">
                              <div className="flex items-center gap-4">
                                <span>💰 0.1 CAMP per period</span>
                                <span>⏰ 30 days duration</span>
                                <span>✅ Attribution required</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-provn-muted" />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Configuration */}
          {step === 'configure' && selectedLicense && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-provn-text mb-2 font-headline">
                  Configure {selectedLicense.name}
                </h3>
                <p className="text-sm text-provn-muted font-headline">
                  Tell us about your intended use and set your preferences.
                </p>
              </div>

              {/* How to Use Steps */}
              <div className="bg-provn-surface-2 rounded-lg p-4">
                <h4 className="font-medium text-provn-text mb-3 font-headline">How to use this license:</h4>
                <ol className="space-y-2 text-sm text-provn-muted font-headline">
                  {selectedLicense.howToUse.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-provn-accent/20 text-provn-accent rounded-full text-xs flex items-center justify-center font-bold mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* User Input Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2 font-headline">
                    Intended Use *
                  </label>
                  <textarea
                    value={userPreferences.intendedUse}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, intendedUse: e.target.value }))}
                    placeholder="Describe how you plan to use this content..."
                    rows={3}
                    className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent resize-none font-headline"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2 font-headline">
                    Credit Line
                  </label>
                  <input
                    type="text"
                    value={userPreferences.creditLine}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, creditLine: e.target.value }))}
                    placeholder="How you'll credit the creator..."
                    className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent font-headline"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2 font-headline">
                    Contact Info (Optional)
                  </label>
                  <input
                    type="text"
                    value={userPreferences.contactInfo}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, contactInfo: e.target.value }))}
                    placeholder="Your email or social handle..."
                    className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent font-headline"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Purchase */}
          {step === 'purchase' && selectedLicense && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-provn-text mb-2 font-headline">
                  Purchase {selectedLicense.name}
                </h3>
                <p className="text-sm text-provn-muted font-headline">
                  Review your selection and complete the purchase.
                </p>
              </div>

              {/* License Summary */}
              <div className="bg-provn-surface-2 rounded-lg p-4">
                <h4 className="font-medium text-provn-text mb-3 font-headline">License Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-provn-muted font-headline">License Type:</span>
                    <p className="font-medium text-provn-text font-headline">{selectedLicense.name}</p>
                  </div>
                  <div>
                    <span className="text-provn-muted font-headline">Duration:</span>
                    <p className="font-medium text-provn-text font-headline">30 days</p>
                  </div>
                  <div>
                    <span className="text-provn-muted font-headline">Periods:</span>
                    <p className="font-medium text-provn-text font-headline">{licensePeriods}</p>
                  </div>
                  <div>
                    <span className="text-provn-muted font-headline">Total Cost:</span>
                    <p className="font-medium text-provn-accent font-headline">{totalLicenseCost} CAMP</p>
                  </div>
                </div>
              </div>

              {/* Period Selection */}
              <div>
                <label className="block text-sm font-medium text-provn-text mb-2 font-headline">
                  License Periods
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={licensePeriods}
                    onChange={(e) => setLicensePeriods(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                  />
                  <span className="text-provn-muted font-headline">× 30 days each</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-provn-border bg-provn-surface-2">
          <div className="flex gap-3">
            <ProvnButton variant="secondary" onClick={onClose}>
              Cancel
            </ProvnButton>
            {step !== 'select' && (
              <ProvnButton variant="secondary" onClick={() => setStep(step === 'configure' ? 'select' : 'configure')}>
                Back
              </ProvnButton>
            )}
          </div>
          
          <div className="flex gap-3">
            {step === 'select' && (
              <ProvnButton disabled={!selectedLicense}>
                {selectedLicense ? 'Select License' : 'Choose a License'}
              </ProvnButton>
            )}
            {step === 'configure' && (
              <ProvnButton 
                onClick={() => setStep('purchase')}
                disabled={!userPreferences.intendedUse.trim()}
              >
                Continue to Purchase
              </ProvnButton>
            )}
            {step === 'purchase' && (
              <ProvnButton
                onClick={handlePurchase}
                disabled={!isAuthenticated || purchaseLoading}
              >
                {purchaseLoading ? (
                  'Processing...'
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Purchase License ({totalLicenseCost} CAMP)
                  </>
                )}
              </ProvnButton>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}