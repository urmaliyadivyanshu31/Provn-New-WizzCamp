export type RemixingPermissionLevel = 'none' | 'basic' | 'advanced' | 'custom'

export type LicenseType = 
  | 'repost'
  | 'remix' 
  | 'reaction'
  | 'custom'

export type RemixingTemplate = LicenseType

export interface RemixingConfiguration {
  enabled: boolean
  permissionLevel: RemixingPermissionLevel
  template?: RemixingTemplate
  customSettings?: CustomRemixingSettings
  requiresAttribution: boolean
  allowCommercialUse: boolean
  allowDerivatives: boolean
  message?: string
  price?: number // License price in CAMP tokens
  duration?: number // License duration in seconds (from Origin SDK)
}

export interface CustomRemixingSettings {
  creditRequirement: string
  usageRestrictions: string[]
  geographicRestrictions: string[]
  timeRestrictions?: {
    startDate?: string
    endDate?: string
  }
  royaltyRequirement?: {
    percentage: number
    minAmount?: number
  }
  approvalRequired: boolean
  contactInfo?: string
}

export interface LicenseTemplate {
  id: LicenseType
  name: string
  description: string
  shortDescription: string
  icon: string
  howToUse: string[]
  configuration: RemixingConfiguration
  popular?: boolean
}

export interface UserRemixingPreference {
  tokenId: string
  userId: string
  licenseType: LicenseType
  selectedTemplate?: LicenseType
  customConfiguration?: Partial<RemixingConfiguration>
  intendedUse: string
  creditLine?: string
  plannedDistribution: string[]
  contactInfo?: string
  submittedAt: string
}

export interface RemixingPermission {
  tokenId: string
  userId: string
  granted: boolean
  grantedAt?: string
  expiresAt?: string
  conditions: string[]
  permissionId: string
}