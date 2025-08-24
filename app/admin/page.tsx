'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProvnButton } from '@/components/provn/button'
import { ProvnCard, ProvnCardContent } from '@/components/provn/card'
import { 
  Shield, 
  Users, 
  Key,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  Trash2,
  RefreshCcw,
  Settings,
  TrendingUp,
  UserCheck,
  Ban,
  Search,
  Filter,
  Download
} from 'lucide-react'
import { useAuth } from '@campnetwork/origin/react'
import Link from 'next/link'

interface AdminStats {
  totalWhitelistRequests: number
  pendingRequests: number
  totalVipAccesses: number
  activeVipAccesses: number
  totalAccessAttempts: number
  blockedAttempts: number
}

interface WhitelistRequest {
  id: string
  email?: string
  twitterUsername?: string
  walletAddress?: string
  submissionType: 'email' | 'twitter'
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  ipAddress: string
  metadata?: any
}

interface VipAccess {
  id: string
  accessToken: string
  walletAddress: string
  createdBy: string
  createdAt: string
  expiresAt: string
  usedAt?: string
  active: boolean
  usageCount: number
  maxUsage: number
  notes?: string
}

export default function AdminDashboard() {
  const { walletAddress, isAuthenticated } = useAuth()
  const [isAdminVerified, setIsAdminVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [adminKey, setAdminKey] = useState('')
  
  // Data states
  const [stats, setStats] = useState<AdminStats>({
    totalWhitelistRequests: 0,
    pendingRequests: 0,
    totalVipAccesses: 0,
    activeVipAccesses: 0,
    totalAccessAttempts: 0,
    blockedAttempts: 0
  })
  
  const [whitelistRequests, setWhitelistRequests] = useState<WhitelistRequest[]>([])
  const [vipAccesses, setVipAccesses] = useState<VipAccess[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'whitelist' | 'vip' | 'security'>('overview')
  
  // VIP creation form
  const [vipForm, setVipForm] = useState({
    walletAddress: '',
    expiryHours: 24,
    notes: '',
    maxUsage: 1
  })
  const [vipCreating, setVipCreating] = useState(false)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    checkAdminAccess()
  }, [walletAddress, isAuthenticated])

  useEffect(() => {
    if (isAdminVerified && adminKey && walletAddress) {
      loadDashboardData()
      const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isAdminVerified, adminKey, walletAddress])

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`])
  }

  const checkAdminAccess = async () => {
    addDebugInfo(`checkAdminAccess called - isAuthenticated: ${isAuthenticated}, walletAddress: ${walletAddress?.slice(0, 6)}...`)
    
    if (!isAuthenticated || !walletAddress) {
      addDebugInfo('Not authenticated or no wallet address')
      setIsLoading(false)
      return
    }

    // Check if user is admin (you may want to implement proper admin check)
    const adminWallets = process.env.NEXT_PUBLIC_ADMIN_WALLETS?.split(',') || []
    addDebugInfo(`Admin wallets configured: ${adminWallets.length}`)
    
    if (adminWallets.length > 0 && !adminWallets.includes(walletAddress.toLowerCase())) {
      addDebugInfo('Wallet not in admin list')
      setIsLoading(false)
      return
    }

    addDebugInfo('Admin access granted')
    // Set the correct admin key for the recognized admin wallet
    setAdminKey('sk_provn_admin_2024_7669aB66996022A0d2fAFcdB1c4Dc20FB3dc1961_secure')
    setIsAdminVerified(true)
    setIsLoading(false)
  }

  const loadDashboardData = async () => {
    if (!adminKey || !walletAddress) {
      addDebugInfo('❌ Missing adminKey or walletAddress')
      console.error('❌ Missing adminKey or walletAddress:', { adminKey: !!adminKey, walletAddress })
      return
    }

    addDebugInfo(`🔄 Loading dashboard data with key: ${adminKey.substring(0, 4)}***`)
    console.log('🔄 Loading dashboard data with key:', adminKey.substring(0, 4) + '***')

    try {
      const headers = {
        'x-admin-wallet': walletAddress,
        'x-admin-key': adminKey,
        'Content-Type': 'application/json'
      }

      // Load stats, whitelist requests, and VIP accesses in parallel
      const [statsRes, whitelistRes, vipRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/whitelist', { headers }),
        fetch('/api/admin/vip-access', { headers })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        console.log('✅ Stats API response:', statsData)
        setStats(statsData.data || {
          totalWhitelistRequests: 0,
          pendingRequests: 0,
          totalVipAccesses: 0,
          activeVipAccesses: 0,
          totalAccessAttempts: 0,
          blockedAttempts: 0
        })
      } else {
        console.error('❌ Stats API failed:', statsRes.status, statsRes.statusText)
        const errorData = await statsRes.text()
        console.error('Error details:', errorData)
      }

      if (whitelistRes.ok) {
        const whitelistData = await whitelistRes.json()
        // Map snake_case database fields to camelCase interface
        const mappedWhitelistRequests = (whitelistData.data?.requests || []).map((request: any) => ({
          id: request.id,
          email: request.email,
          twitterUsername: request.twitter_username,
          walletAddress: request.wallet_address,
          submissionType: request.submission_type,
          status: request.status,
          submittedAt: request.submitted_at,
          ipAddress: request.ip_address,
          metadata: request.metadata
        }))
        setWhitelistRequests(mappedWhitelistRequests)
      }

      if (vipRes.ok) {
        const vipData = await vipRes.json()
        // Map snake_case API response to camelCase interface
        const mappedVipAccesses = (vipData.data?.vipAccesses || []).map((vip: any) => ({
          id: vip.id,
          accessToken: vip.access_token,
          walletAddress: vip.wallet_address,
          createdBy: vip.created_by,
          createdAt: vip.created_at,
          expiresAt: vip.expires_at,
          usedAt: vip.used_at,
          active: vip.active,
          usageCount: vip.usage_count,
          maxUsage: vip.max_usage,
          notes: vip.notes
        }))
        setVipAccesses(mappedVipAccesses)
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const handleCreateVipAccess = async () => {
    if (!vipForm.walletAddress || !adminKey || !walletAddress) return

    setVipCreating(true)
    
    try {
      const response = await fetch('/api/admin/vip-access', {
        method: 'POST',
        headers: {
          'x-admin-wallet': walletAddress,
          'x-admin-key': adminKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vipForm)
      })

      const result = await response.json()

      if (result.success) {
        // Show success and copy URL to clipboard
        if (result.vipUrl) {
          await navigator.clipboard.writeText(result.vipUrl)
          alert(`VIP access created! URL copied to clipboard:\n${result.vipUrl}`)
        }
        
        // Reset form and refresh data
        setVipForm({
          walletAddress: '',
          expiryHours: 24,
          notes: '',
          maxUsage: 1
        })
        loadDashboardData()
      } else {
        alert(`Failed to create VIP access: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to create VIP access. Please try again.')
    } finally {
      setVipCreating(false)
    }
  }

  const handleRevokeVipAccess = async (vipId: string) => {
    if (!adminKey || !walletAddress) return
    
    if (!confirm('Are you sure you want to revoke this VIP access?')) return

    try {
      const response = await fetch(`/api/admin/vip-access?id=${vipId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-wallet': walletAddress,
          'x-admin-key': adminKey
        }
      })

      const result = await response.json()

      if (result.success) {
        alert('VIP access revoked successfully')
        loadDashboardData()
      } else {
        alert(`Failed to revoke VIP access: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to revoke VIP access. Please try again.')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could show a toast notification here
      console.log('Copied to clipboard')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleWhitelistAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!adminKey || !walletAddress) return
    
    const confirmMessage = action === 'approve' 
      ? 'Are you sure you want to approve this whitelist request?'
      : 'Are you sure you want to reject this whitelist request?'
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch('/api/admin/whitelist', {
        method: 'PATCH',
        headers: {
          'x-admin-wallet': walletAddress,
          'x-admin-key': adminKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId, action })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Request ${action}d successfully`)
        loadDashboardData() // Refresh the data
      } else {
        alert(`Failed to ${action} request: ${result.error}`)
      }
    } catch (error) {
      alert(`Failed to ${action} request. Please try again.`)
    }
  }

  const filteredWhitelistRequests = whitelistRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.twitterUsername?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const filteredVipAccesses = vipAccesses.filter(vip => {
    return searchTerm === '' || 
      vip.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vip.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-provn-bg flex items-center justify-center">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/5 via-transparent to-orange-100/5"></div>
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #ff6d01 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-40 left-10 w-96 h-96 bg-gradient-radial from-orange-400/3 via-orange-400/1 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-10 w-80 h-80 bg-gradient-radial from-amber-400/2 via-amber-400/0.5 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <RefreshCcw className="w-8 h-8 text-provn-accent mx-auto mb-4" />
          <p className="text-provn-muted">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !walletAddress) {
    return (
      <div className="min-h-screen bg-provn-bg flex items-center justify-center">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/5 via-transparent to-orange-100/5"></div>
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #ff6d01 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-40 left-10 w-96 h-96 bg-gradient-radial from-orange-400/3 via-orange-400/1 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-10 w-80 h-80 bg-gradient-radial from-amber-400/2 via-amber-400/0.5 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <ProvnCard className="relative z-10 max-w-md w-full bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-2xl shadow-black/20 ring-1 ring-white/5">
          <ProvnCardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-provn-accent mx-auto mb-4" />
            <h1 className="font-headline text-2xl font-bold text-provn-text mb-4">
              Admin Access Required
            </h1>
            <p className="text-provn-muted mb-6">
              Please connect your wallet to access the admin dashboard.
            </p>
            <Link href="/">
              <ProvnButton>Return to Home</ProvnButton>
            </Link>
          </ProvnCardContent>
        </ProvnCard>
      </div>
    )
  }

  if (!isAdminVerified) {
    return (
      <div className="min-h-screen bg-provn-bg flex items-center justify-center">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/5 via-transparent to-orange-100/5"></div>
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #ff6d01 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-40 left-10 w-96 h-96 bg-gradient-radial from-orange-400/3 via-orange-400/1 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-10 w-80 h-80 bg-gradient-radial from-amber-400/2 via-amber-400/0.5 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <ProvnCard className="relative z-10 max-w-md w-full bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-2xl shadow-black/20 ring-1 ring-white/5">
          <ProvnCardContent className="p-8">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-provn-warning mx-auto mb-4" />
              <h1 className="font-headline text-2xl font-bold text-provn-text mb-2">
                Admin Authentication
              </h1>
              <p className="text-provn-muted">
                Enter your admin key to access the dashboard
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-provn-text mb-2">
                  Admin Key
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key..."
                  className="w-full px-4 py-3 bg-provn-bg/50 backdrop-blur-sm border border-provn-border/50 rounded-xl text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-provn-accent/50 transition-all duration-200"
                />
              </div>
              
              <ProvnButton
                onClick={() => {
                  if (adminKey) {
                    setIsAdminVerified(true)
                    loadDashboardData()
                  }
                }}
                disabled={!adminKey}
                className="w-full mb-2"
              >
                Access Dashboard
              </ProvnButton>
              
              {/* Debug test button */}
              <ProvnButton
                variant="secondary"
                onClick={async () => {
                  if (!adminKey || !walletAddress) return
                  
                  console.log('🧪 Testing API directly...')
                  try {
                    const response = await fetch('/api/admin/stats', {
                      headers: {
                        'x-admin-key': adminKey,
                        'x-admin-wallet': walletAddress,
                        'Content-Type': 'application/json'
                      }
                    })
                    
                    const data = await response.json()
                    console.log('✅ Direct API test result:', data)
                    alert(`API Test Result:\\nStatus: ${response.status}\\nData: ${JSON.stringify(data, null, 2)}`)
                  } catch (error) {
                    console.error('❌ Direct API test failed:', error)
                    alert(`API Test Failed: ${error}`)
                  }
                }}
                disabled={!adminKey}
                className="w-full text-xs"
              >
                🧪 Test API Connection
              </ProvnButton>
              
              {/* Debug info display */}
              {debugInfo.length > 0 && (
                <div className="mt-4 p-3 bg-provn-surface/80 backdrop-blur-sm border border-provn-border/30 rounded-lg text-xs text-provn-text font-mono">
                  <div className="text-provn-accent mb-2 font-semibold">Debug Info:</div>
                  {debugInfo.map((info, idx) => (
                    <div key={idx} className="text-provn-muted">{info}</div>
                  ))}
                  <div className="text-provn-warning mt-2">
                    adminKey: {adminKey ? 'SET' : 'MISSING'} | walletAddress: {walletAddress || 'MISSING'}
                  </div>
                </div>
              )}
            </div>
          </ProvnCardContent>
        </ProvnCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/10 via-transparent to-orange-100/10"></div>
        
        {/* Dot pattern layer 1 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #ff6d01 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        
        {/* Dot pattern layer 2 - offset */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 75% 75%, #ff6d01 0.8px, transparent 0.8px)`,
            backgroundSize: "40px 40px",
          }}
        />
        
        {/* Geometric texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #ff6d01 1px, transparent 1px),
              linear-gradient(-45deg, #ff6d01 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px, 80px 80px",
            backgroundPosition: "0 0, 40px 40px",
          }}
        />
        
        {/* Ambient light spots */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-orange-400/5 via-orange-400/2 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-radial from-amber-400/4 via-amber-400/1 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-provn-surface/95 backdrop-blur-sm border-b border-provn-border/50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-provn-accent mr-3" />
                <div>
                  <h1 className="font-headline text-2xl font-bold text-provn-text">
                    Provn Admin Dashboard
                  </h1>
                  <p className="text-provn-muted text-sm">
                    Whitelist & VIP Access Management
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-provn-muted">Admin Wallet</p>
                  <p className="text-sm font-mono text-provn-text">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </div>
                
                <ProvnButton
                  variant="secondary"
                  size="sm"
                  onClick={loadDashboardData}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Refresh
                </ProvnButton>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <ProvnCardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-provn-accent/10 rounded-xl mr-4">
                      <Users className="w-6 h-6 text-provn-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-provn-text">
                        {stats.totalWhitelistRequests}
                      </p>
                      <p className="text-provn-muted text-sm">Total Requests</p>
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <ProvnCardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-amber-500/10 rounded-xl mr-4">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-provn-text">
                        {stats.pendingRequests}
                      </p>
                      <p className="text-provn-muted text-sm">Pending Review</p>
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <ProvnCardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-provn-accent/10 rounded-xl mr-4">
                      <Key className="w-6 h-6 text-provn-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-provn-text">
                        {stats.totalVipAccesses}
                      </p>
                      <p className="text-provn-muted text-sm">VIP Accesses</p>
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <ProvnCardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-emerald-500/10 rounded-xl mr-4">
                      <Activity className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-provn-text">
                        {stats.activeVipAccesses}
                      </p>
                      <p className="text-provn-muted text-sm">Active VIPs</p>
                    </div>
                  </div>
                </ProvnCardContent>
              </ProvnCard>
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex space-x-1 bg-provn-surface/80 backdrop-blur-sm border border-provn-border/30 rounded-xl p-1 mb-8 shadow-lg"
          >
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'whitelist', label: 'Whitelist Requests', icon: Users },
              { id: 'vip', label: 'VIP Access', icon: Key },
              { id: 'security', label: 'Security Logs', icon: Shield }
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-provn-accent text-provn-bg shadow-lg'
                    : 'text-provn-muted hover:text-provn-text hover:bg-provn-surface/50'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Quick Actions */}
                <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl">
                  <ProvnCardContent className="p-6">
                    <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ProvnButton
                        onClick={() => setActiveTab('vip')}
                        className="flex items-center justify-center hover:scale-[1.02] transition-transform duration-200"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Create VIP Access
                      </ProvnButton>
                      
                      <ProvnButton
                        variant="secondary"
                        onClick={() => setActiveTab('whitelist')}
                        className="flex items-center justify-center hover:scale-[1.02] transition-transform duration-200"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Review Requests
                      </ProvnButton>
                      
                      <ProvnButton
                        variant="secondary"
                        onClick={() => setActiveTab('security')}
                        className="flex items-center justify-center hover:scale-[1.02] transition-transform duration-200"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Security Logs
                      </ProvnButton>
                    </div>
                  </ProvnCardContent>
                </ProvnCard>

                {/* Recent Activity */}
                <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl">
                  <ProvnCardContent className="p-6">
                    <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {whitelistRequests.slice(0, 5).map((request, index) => (
                        <motion.div 
                          key={request.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between py-3 px-4 rounded-lg border border-provn-border/30 hover:border-provn-accent/30 hover:bg-provn-surface/30 transition-all duration-200 last:border-0"
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              request.status === 'pending' ? 'bg-amber-500' :
                              request.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <p className="text-provn-text text-sm font-medium">
                                {request.email || `@${request.twitterUsername}`}
                              </p>
                              <p className="text-provn-muted text-xs">
                                {new Date(request.submittedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                            request.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {request.status}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </ProvnCardContent>
                </ProvnCard>
              </motion.div>
            )}

            {activeTab === 'vip' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* VIP Creation Form */}
                <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl">
                  <ProvnCardContent className="p-6">
                    <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">
                      Create VIP Access
                    </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-provn-text mb-2">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={vipForm.walletAddress}
                      onChange={(e) => setVipForm({ ...vipForm, walletAddress: e.target.value })}
                      placeholder="0x..."
                      className="w-full px-4 py-2 bg-provn-bg border border-provn-border rounded-[10px] text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-provn-text mb-2">
                      Expiry (Hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={vipForm.expiryHours}
                      onChange={(e) => setVipForm({ ...vipForm, expiryHours: parseInt(e.target.value) || 24 })}
                      className="w-full px-4 py-2 bg-provn-bg border border-provn-border rounded-[10px] text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-provn-text mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={vipForm.notes}
                      onChange={(e) => setVipForm({ ...vipForm, notes: e.target.value })}
                      placeholder="Optional notes..."
                      className="w-full px-4 py-2 bg-provn-bg border border-provn-border rounded-[10px] text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <ProvnButton
                    onClick={handleCreateVipAccess}
                    disabled={!vipForm.walletAddress || vipCreating}
                    className="flex items-center"
                  >
                    {vipCreating ? (
                      <>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Create VIP Access
                      </>
                    )}
                  </ProvnButton>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* VIP Access List */}
            <ProvnCard>
              <ProvnCardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline text-lg font-semibold text-provn-text">
                    VIP Access Tokens
                  </h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      className="px-3 py-2 bg-provn-bg border border-provn-border rounded-[8px] text-provn-text text-sm placeholder-provn-muted focus:outline-none focus:ring-1 focus:ring-provn-accent"
                    />
                    <Search className="w-4 h-4 text-provn-muted" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-provn-border">
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Wallet</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Created</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Expires</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Usage</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Status</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVipAccesses.map((vip) => (
                        <tr key={vip.id} className="border-b border-provn-border/50 hover:bg-provn-surface-2/50">
                          <td className="py-3">
                            <div className="flex items-center">
                              <span className="font-mono text-provn-text text-sm">
                                {vip.walletAddress.slice(0, 6)}...{vip.walletAddress.slice(-4)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(vip.walletAddress)}
                                className="ml-2 text-provn-muted hover:text-provn-text"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-provn-muted text-sm">
                            {new Date(vip.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-provn-muted text-sm">
                            {new Date(vip.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-provn-muted text-sm">
                            {vip.usageCount}/{vip.maxUsage}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              vip.active && new Date(vip.expiresAt) > new Date()
                                ? 'bg-provn-success/20 text-provn-success'
                                : 'bg-provn-error/20 text-provn-error'
                            }`}>
                              {vip.active && new Date(vip.expiresAt) > new Date() ? 'Active' : 'Expired'}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => copyToClipboard(`${window.location.origin}/vip-access?token=${vip.accessToken}`)}
                                className="text-provn-accent hover:text-provn-accent-press"
                                title="Copy VIP URL"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              {vip.active && (
                                <button
                                  onClick={() => handleRevokeVipAccess(vip.id)}
                                  className="text-provn-error hover:text-provn-error/80"
                                  title="Revoke Access"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ProvnCardContent>
            </ProvnCard>
              </motion.div>
            )}

            {/* Other tab content would go here... */}
        {activeTab === 'whitelist' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <ProvnCard>
              <ProvnCardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-provn-muted" />
                    <input
                      type="text"
                      placeholder="Search by email or Twitter..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-provn-bg border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-provn-bg border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Whitelist Requests Table */}
            <ProvnCard>
              <ProvnCardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline text-lg font-semibold text-provn-text">
                    Whitelist Requests ({filteredWhitelistRequests.length})
                  </h3>
                  <ProvnButton
                    variant="secondary"
                    size="sm"
                    onClick={loadDashboardData}
                    className="flex items-center"
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Refresh
                  </ProvnButton>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-provn-border">
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Contact</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Wallet Address</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Type</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Submitted</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Status</th>
                        <th className="text-left py-3 text-provn-muted text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWhitelistRequests.map((request) => (
                        <tr key={request.id} className="border-b border-provn-border/50 hover:bg-provn-surface-2/50">
                          <td className="py-3">
                            <div className="flex items-center">
                              <div>
                                <div className="text-provn-text text-sm font-medium">
                                  {request.email || `@${request.twitterUsername}`}
                                </div>
                                {request.metadata && (
                                  <div className="text-provn-muted text-xs">
                                    ID: {request.id.slice(0, 8)}...
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => copyToClipboard(request.email || request.twitterUsername || '')}
                                className="ml-2 text-provn-muted hover:text-provn-text"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            {request.walletAddress ? (
                              <div className="flex items-center">
                                <span className="font-mono text-provn-text text-sm">
                                  {request.walletAddress.slice(0, 6)}...{request.walletAddress.slice(-4)}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(request.walletAddress || '')}
                                  className="ml-2 text-provn-muted hover:text-provn-text"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-provn-muted text-xs">Not provided</span>
                            )}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              request.submissionType === 'email' 
                                ? 'bg-blue-400/20 text-blue-400' 
                                : 'bg-purple-400/20 text-purple-400'
                            }`}>
                              {request.submissionType === 'email' ? '📧 Email' : '🐦 Twitter'}
                            </span>
                          </td>
                          <td className="py-3 text-provn-muted text-sm">
                            {new Date(request.submittedAt).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'pending' ? 'bg-provn-warning/20 text-provn-warning' :
                              request.status === 'approved' ? 'bg-provn-success/20 text-provn-success' :
                              'bg-provn-error/20 text-provn-error'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex space-x-2">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleWhitelistAction(request.id, 'approve')}
                                    className="text-provn-success hover:text-provn-success/80"
                                    title="Approve Request"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleWhitelistAction(request.id, 'reject')}
                                    className="text-provn-error hover:text-provn-error/80"
                                    title="Reject Request"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => copyToClipboard(request.id)}
                                className="text-provn-muted hover:text-provn-text"
                                title="Copy Request ID"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredWhitelistRequests.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-provn-muted mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-provn-text mb-2">
                      No whitelist requests found
                    </h3>
                    <p className="text-provn-muted">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria' 
                        : 'No whitelist requests have been submitted yet'
                      }
                    </p>
                  </div>
                )}
              </ProvnCardContent>
            </ProvnCard>
          </div>
        )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl">
                  <ProvnCardContent className="p-8">
                    <div className="text-center">
                      <div className="p-4 bg-provn-accent/5 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <Shield className="w-10 h-10 text-provn-accent" />
                      </div>
                      <h3 className="font-headline text-2xl font-bold text-provn-text mb-4">
                        Security Logs
                      </h3>
                      <p className="text-provn-muted max-w-md mx-auto">
                        Advanced security monitoring and audit trail features are currently in development.
                      </p>
                      <div className="mt-6 px-4 py-2 bg-provn-accent/10 rounded-lg inline-block">
                        <p className="text-provn-accent text-sm font-medium">Coming in Q4 2025</p>
                      </div>
                    </div>
                  </ProvnCardContent>
                </ProvnCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}