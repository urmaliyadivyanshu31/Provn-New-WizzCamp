"use client"

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Users, PlayCircle } from 'lucide-react'

interface RevenueCalculatorProps {
  className?: string
}

// Usage rights types based on the platform
const USAGE_RIGHTS = [
  {
    id: 'personal',
    name: 'Personal',
    description: 'Personal use only',
    multiplier: 0.5,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  {
    id: 'commercial',
    name: 'Commercial', 
    description: 'Commercial use allowed',
    multiplier: 1.0,
    color: 'text-provn-accent',
    bgColor: 'bg-provn-accent/10',
    borderColor: 'border-provn-accent/20'
  },
  {
    id: 'full',
    name: 'Full Rights',
    description: 'Complete usage freedom',
    multiplier: 2.0,
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  }
]

export function RevenueCalculator({ className = "" }: RevenueCalculatorProps) {
  const [selectedUsageRight, setSelectedUsageRight] = useState(USAGE_RIGHTS[1]) // Default to Commercial
  const [licenseFee, setLicenseFee] = useState(0.1) // PROVN tokens
  const [royaltyRate, setRoyaltyRate] = useState(5) // Percentage
  const [expectedLicenses, setExpectedLicenses] = useState(10) // Per month
  
  // Calculate revenue based on PROVN tokenomics (using CAMP price as reference: $3.78)
  const provnToUsd = 3.78
  
  const calculations = useMemo(() => {
    const adjustedFee = licenseFee * selectedUsageRight.multiplier
    const monthlyLicenseRevenue = adjustedFee * expectedLicenses * provnToUsd
    const monthlyRoyaltyRevenue = (monthlyLicenseRevenue * royaltyRate) / 100
    const totalMonthlyRevenue = monthlyLicenseRevenue + monthlyRoyaltyRevenue
    
    return {
      licenseFeeUsd: adjustedFee * provnToUsd,
      monthlyLicenseRevenue,
      monthlyRoyaltyRevenue, 
      totalMonthlyRevenue,
      yearlyRevenue: totalMonthlyRevenue * 12
    }
  }, [licenseFee, royaltyRate, expectedLicenses, selectedUsageRight])

  return (
    <div className={`bg-gradient-to-br from-provn-surface to-provn-surface-2 border border-provn-border/50 rounded-2xl p-8 backdrop-blur-sm ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-provn-text mb-2 font-headline">Revenue Calculator</h3>
        <p className="text-sm text-provn-muted">Calculate your potential earnings from video licensing</p>
      </div>

      <div className="space-y-6">
        {/* Usage Rights Selection */}
        <div>
          <label className="text-sm font-medium text-provn-text mb-3 block">Usage Rights Type</label>
          <div className="grid grid-cols-1 gap-2">
            {USAGE_RIGHTS.map((right) => (
              <button
                key={right.id}
                onClick={() => setSelectedUsageRight(right)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedUsageRight.id === right.id
                    ? `${right.bgColor} ${right.borderColor} ${right.color}`
                    : 'bg-provn-surface-2 border-provn-border text-provn-muted hover:border-provn-accent/30'
                }`}
              >
                <div className="font-medium">{right.name}</div>
                <div className="text-xs opacity-75">{right.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* License Fee Slider */}
        <div>
          <label className="text-sm font-medium text-provn-text mb-2 block">
            License Fee: {licenseFee.toFixed(1)} PROVN (${(licenseFee * selectedUsageRight.multiplier * provnToUsd).toFixed(2)})
          </label>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={licenseFee}
            onChange={(e) => setLicenseFee(parseFloat(e.target.value))}
            className="w-full slider-enhanced"
          />
        </div>

        {/* Expected Licenses Slider */}
        <div>
          <label className="text-sm font-medium text-provn-text mb-2 block">
            Expected Monthly Licenses: {expectedLicenses}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={expectedLicenses}
            onChange={(e) => setExpectedLicenses(parseInt(e.target.value))}
            className="w-full slider-enhanced"
          />
        </div>

        {/* Royalty Rate */}
        <div>
          <label className="text-sm font-medium text-provn-text mb-2 block">
            Derivative Royalty Rate: {royaltyRate}%
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={royaltyRate}
            onChange={(e) => setRoyaltyRate(parseInt(e.target.value))}
            className="w-full slider-enhanced"
          />
        </div>

        {/* Revenue Breakdown */}
        <div className="border-t border-provn-border pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-provn-surface-2/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-provn-accent" />
                <span className="text-xs text-provn-muted">License Revenue</span>
              </div>
              <div className="text-lg font-bold text-provn-text font-headline">
                ${calculations.monthlyLicenseRevenue.toFixed(0)}/mo
              </div>
            </div>
            
            <div className="bg-provn-surface-2/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-provn-muted">Royalty Revenue</span>
              </div>
              <div className="text-lg font-bold text-green-400 font-headline">
                ${calculations.monthlyRoyaltyRevenue.toFixed(0)}/mo
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-r from-provn-accent/10 to-purple-500/10 border border-provn-accent/20 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm text-provn-muted mb-1">Total Monthly Revenue</div>
              <div className="text-3xl font-bold text-provn-accent font-headline">
                ${calculations.totalMonthlyRevenue.toFixed(0)}
              </div>
              <div className="text-xs text-provn-muted mt-1">
                ${calculations.yearlyRevenue.toFixed(0)}/year potential
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-provn-text">{expectedLicenses}</div>
              <div className="text-xs text-provn-muted">Licenses</div>
            </div>
            <div>
              <div className="text-sm font-bold text-provn-text">{selectedUsageRight.multiplier}x</div>
              <div className="text-xs text-provn-muted">Multiplier</div>
            </div>
            <div>
              <div className="text-sm font-bold text-provn-text">{royaltyRate}%</div>
              <div className="text-xs text-provn-muted">Royalties</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}