"use client"

import React, { useState, useEffect } from 'react'
import { ProvnButton } from './button'
import { ProvnCard, ProvnCardContent } from './card'
import { ProvnBadge } from './badge'
import { useWalletAuth } from './wallet-connection'

interface ProfileData {
  handle: string
  displayName: string
  bio: string
  avatar?: string
  isPublic: boolean
}

interface ProfileSetupProps {
  onProfileCreated?: (profile: ProfileData) => void
  onSkip?: () => void
}

export function ProfileSetup({ onProfileCreated, onSkip }: ProfileSetupProps) {
  const { address, isConnected } = useWalletAuth()
  const [profileData, setProfileData] = useState<ProfileData>({
    handle: '',
    displayName: '',
    bio: '',
    isPublic: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<ProfileData>>({})
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [isCheckingHandle, setIsCheckingHandle] = useState(false)

  useEffect(() => {
    if (profileData.handle && profileData.handle.length >= 3) {
      checkHandleAvailability(profileData.handle)
    } else {
      setHandleAvailable(null)
    }
  }, [profileData.handle])

  const checkHandleAvailability = async (handle: string) => {
    setIsCheckingHandle(true)
    try {
      const response = await fetch(`/api/users/check-handle?handle=${encodeURIComponent(handle)}`)
      const data = await response.json()
      setHandleAvailable(data.available)
    } catch (error) {
      console.error('Failed to check handle availability:', error)
      setHandleAvailable(null)
    } finally {
      setIsCheckingHandle(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {}

    if (!profileData.handle.trim()) {
      newErrors.handle = 'Handle is required'
    } else if (profileData.handle.length < 3) {
      newErrors.handle = 'Handle must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.handle)) {
      newErrors.handle = 'Handle can only contain letters, numbers, and underscores'
    } else if (handleAvailable === false) {
      newErrors.handle = 'Handle is already taken'
    }

    if (!profileData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    } else if (profileData.displayName.length > 50) {
      newErrors.displayName = 'Display name must be 50 characters or less'
    }

    if (profileData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${address}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': address
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const createdProfile = await response.json()
        onProfileCreated?.(createdProfile)
      } else {
        const error = await response.json()
        alert(`Profile creation failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Profile creation error:', error)
      alert('Failed to create profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onSkip?.()
  }

  const updateProfileData = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <p className="text-provn-muted">Please connect your wallet to set up your profile.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-headline text-3xl font-bold text-provn-text">
          Set Up Your Profile
        </h1>
        <p className="text-provn-muted">
          Create your creator profile to start sharing content on Provn
        </p>
        <ProvnBadge variant="success" className="inline-flex">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </ProvnBadge>
      </div>

      {/* Profile Form */}
      <ProvnCard>
        <ProvnCardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Handle */}
            <div>
              <label htmlFor="handle" className="block text-provn-text font-medium mb-2">
                Handle *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="handle"
                  value={profileData.handle}
                  onChange={(e) => updateProfileData('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className={`w-full px-4 py-3 bg-provn-surface-2 border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent ${
                    errors.handle ? 'border-red-500' : 'border-provn-border'
                  }`}
                  placeholder="your_handle"
                  maxLength={30}
                />
                {isCheckingHandle && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-provn-accent border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {!isCheckingHandle && handleAvailable !== null && profileData.handle.length >= 3 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {handleAvailable ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </div>
                )}
              </div>
              {errors.handle && (
                <p className="text-red-500 text-sm mt-1">{errors.handle}</p>
              )}
              <p className="text-provn-muted text-xs mt-1">
                Your unique handle will be used in your profile URL: provn.app/@{profileData.handle || 'your_handle'}
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-provn-text font-medium mb-2">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => updateProfileData('displayName', e.target.value)}
                className={`w-full px-4 py-3 bg-provn-surface-2 border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent ${
                  errors.displayName ? 'border-red-500' : 'border-provn-border'
                }`}
                placeholder="Your Display Name"
                maxLength={50}
              />
              {errors.displayName && (
                <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
              )}
              <p className="text-provn-muted text-xs mt-1">
                {50 - profileData.displayName.length} characters remaining
              </p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-provn-text font-medium mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => updateProfileData('bio', e.target.value)}
                className={`w-full px-4 py-3 bg-provn-surface-2 border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent resize-none ${
                  errors.bio ? 'border-red-500' : 'border-provn-border'
                }`}
                placeholder="Tell others about yourself and your content..."
                rows={4}
                maxLength={500}
              />
              {errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
              )}
              <p className="text-provn-muted text-xs mt-1">
                {500 - profileData.bio.length} characters remaining
              </p>
            </div>

            {/* Profile Visibility */}
            <div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={profileData.isPublic}
                  onChange={(e) => updateProfileData('isPublic', e.target.checked)}
                  className="w-4 h-4 text-provn-accent bg-provn-surface-2 border border-provn-border rounded focus:ring-provn-accent focus:ring-2"
                />
                <label htmlFor="isPublic" className="text-provn-text font-medium">
                  Make my profile public
                </label>
              </div>
              <p className="text-provn-muted text-sm mt-2 ml-7">
                Public profiles can be discovered by other users and appear in search results
              </p>
            </div>

            {/* Blockchain Info */}
            <div className="bg-provn-surface border border-provn-border rounded-lg p-4">
              <h3 className="text-provn-text font-medium mb-2">Blockchain Integration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-provn-muted">Wallet Address:</span>
                  <span className="text-provn-text font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-provn-muted">Network:</span>
                  <span className="text-provn-text">BaseCAMP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-provn-muted">Profile NFT:</span>
                  <span className="text-provn-muted">Will be minted on profile creation</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <ProvnButton
                type="button"
                variant="secondary"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip for Now
              </ProvnButton>
              <ProvnButton
                type="submit"
                disabled={isSubmitting || handleAvailable === false || isCheckingHandle}
                className="min-w-[160px]"
              >
                {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
              </ProvnButton>
            </div>
          </form>
        </ProvnCardContent>
      </ProvnCard>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <ProvnCard>
          <ProvnCardContent className="p-6">
            <h3 className="text-provn-text font-semibold mb-2">Why Create a Profile?</h3>
            <ul className="text-provn-muted text-sm space-y-1">
              <li>• Build your creator brand</li>
              <li>• Get discovered by other users</li>
              <li>• Track your content performance</li>
              <li>• Earn from tips and licensing</li>
            </ul>
          </ProvnCardContent>
        </ProvnCard>

        <ProvnCard>
          <ProvnCardContent className="p-6">
            <h3 className="text-provn-text font-semibold mb-2">Profile Features</h3>
            <ul className="text-provn-muted text-sm space-y-1">
              <li>• Decentralized identity</li>
              <li>• On-chain reputation</li>
              <li>• Cross-platform compatibility</li>
              <li>• Creator analytics dashboard</li>
            </ul>
          </ProvnCardContent>
        </ProvnCard>
      </div>
    </div>
  )
}

export default ProfileSetup