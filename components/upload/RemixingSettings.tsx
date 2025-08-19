"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Settings, Heart, Briefcase, GraduationCap, Lock, Info, ChevronRight, Share2, Shuffle, MessageCircle } from "lucide-react"
import { RemixingConfiguration, LicenseTemplate, CustomRemixingSettings } from "@/types/remixing"
import { ProvnButton } from "@/components/provn/button"
import { toast } from "sonner"

interface RemixingSettingsProps {
  isOpen: boolean
  onClose: () => void
  onSave: (remixingConfig: RemixingConfiguration) => void
  initialConfig?: RemixingConfiguration
}

const ICON_MAP = {
  'repost': Share2,
  'remix': Shuffle, 
  'reaction': MessageCircle,
  'custom': Settings
}

export function RemixingSettings({ isOpen, onClose, onSave, initialConfig }: RemixingSettingsProps) {
  const [templates, setTemplates] = useState<LicenseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<LicenseTemplate | null>(null)
  const [currentConfig, setCurrentConfig] = useState<RemixingConfiguration>(
    initialConfig || {
      enabled: true,
      permissionLevel: 'basic',
      requiresAttribution: true,
      allowCommercialUse: false,
      allowDerivatives: true
    }
  )
  const [customMessage, setCustomMessage] = useState("")
  const [showCustomSettings, setShowCustomSettings] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/remixing/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.templates)
      } else {
        toast.error('Failed to load remixing templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load remixing templates')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: LicenseTemplate) => {
    setSelectedTemplate(template)
    setCurrentConfig({
      ...template.configuration,
      message: customMessage || template.configuration.message
    })
    
    if (template.id === 'custom') {
      setShowCustomSettings(true)
    } else {
      setShowCustomSettings(false)
    }
  }

  const handleSave = () => {
    const finalConfig = {
      ...currentConfig,
      template: selectedTemplate?.id,
      message: customMessage || currentConfig.message
    }
    
    onSave(finalConfig)
    onClose()
    toast.success('Remixing settings saved!')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-provn-surface border border-provn-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-provn-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-provn-accent/20 rounded-lg">
              <Settings className="w-5 h-5 text-provn-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-provn-text font-headline">Remixing Settings</h2>
              <p className="text-sm text-provn-muted font-headline">Configure how others can remix your content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-provn-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* Enable/Disable Toggle */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id="enable-remixing"
                checked={currentConfig.enabled}
                onChange={(e) => setCurrentConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-provn-accent bg-provn-surface-2 border-provn-border rounded focus:ring-provn-accent focus:ring-2"
              />
              <label htmlFor="enable-remixing" className="text-provn-text font-medium font-headline">
                Allow others to remix this content
              </label>
            </div>
            <p className="text-sm text-provn-muted ml-7 font-headline">
              When enabled, others can create derivative works based on your content
            </p>
          </div>

          {currentConfig.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Template Selection */}
              <div>
                <h3 className="text-lg font-semibold text-provn-text mb-3 font-headline">Choose Remixing Terms</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provn-accent"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => {
                      const IconComponent = ICON_MAP[template.id as keyof typeof ICON_MAP]
                      const isSelected = selectedTemplate?.id === template.id
                      
                      return (
                        <motion.button
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTemplateSelect(template)}
                          className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                            isSelected
                              ? 'border-provn-accent bg-provn-accent/10'
                              : 'border-provn-border hover:border-provn-accent/50 bg-provn-surface-2'
                          }`}
                        >
                          {template.popular && (
                            <div className="absolute -top-2 -right-2 bg-provn-accent text-white text-xs px-2 py-1 rounded-full font-headline">
                              Popular
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-provn-accent/20' : 'bg-provn-accent/10'
                            }`}>
                              <IconComponent className={`w-4 h-4 ${
                                isSelected ? 'text-provn-accent' : 'text-provn-muted'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold mb-1 font-headline ${
                                isSelected ? 'text-provn-accent' : 'text-provn-text'
                              }`}>
                                {template.name}
                              </h4>
                              <p className="text-sm text-provn-muted font-headline">
                                {template.shortDescription}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-provn-accent" />
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Template Details */}
              {selectedTemplate && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-provn-surface-2 rounded-lg p-4 space-y-4"
                >
                  <div>
                    <h4 className="font-semibold text-provn-text mb-2 font-headline">
                      {selectedTemplate.name} - Details
                    </h4>
                    <p className="text-sm text-provn-muted mb-4 font-headline">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  
                  {/* How to Use Section */}
                  <div>
                    <h5 className="font-medium text-provn-text mb-2 font-headline text-sm">
                      How buyers will use this license:
                    </h5>
                    <ol className="space-y-1 text-sm text-provn-muted font-headline">
                      {selectedTemplate.howToUse.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 bg-provn-accent/20 text-provn-accent rounded-full text-xs flex items-center justify-center font-bold mt-0.5">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  {/* License Terms */}
                  <div>
                    <h5 className="font-medium text-provn-text mb-2 font-headline text-sm">
                      License Terms:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className={`flex items-center gap-2 ${
                        currentConfig.requiresAttribution ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {currentConfig.requiresAttribution ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span className="font-headline">Attribution Required</span>
                      </div>
                      <div className={`flex items-center gap-2 ${
                        currentConfig.allowCommercialUse ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {currentConfig.allowCommercialUse ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span className="font-headline">Commercial Use</span>
                      </div>
                      <div className={`flex items-center gap-2 ${
                        currentConfig.allowDerivatives ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {currentConfig.allowDerivatives ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span className="font-headline">Modifications</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-provn-text mb-2 font-headline">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add any additional terms or instructions for remixers..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent resize-none font-headline"
                />
                <p className="text-xs text-provn-muted mt-1 font-headline">
                  {customMessage.length}/500 characters
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-600 font-headline">
                      <strong>Blockchain Protection:</strong> These settings are recorded on the blockchain 
                      and cannot be changed after minting. Choose carefully based on how you want others 
                      to use your content.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-provn-border bg-provn-surface-2">
          <ProvnButton variant="secondary" onClick={onClose}>
            Cancel
          </ProvnButton>
          <ProvnButton 
            onClick={handleSave}
            disabled={currentConfig.enabled && !selectedTemplate}
          >
            <Check className="w-4 h-4 mr-2" />
            Save Settings
          </ProvnButton>
        </div>
      </motion.div>
    </div>
  )
}