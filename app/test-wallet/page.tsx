"use client"

import React, { useState, useEffect } from 'react'
import { useWalletAuth } from '@/components/provn/wallet-connection'

export default function TestWalletPage() {
  const { authenticated, address, connect, disconnect, openModal } = useWalletAuth()
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testWalletConnection = async () => {
    addResult('Testing wallet connection...')
    
    try {
      // Test 1: Check if window.ethereum exists
      if (typeof window !== 'undefined' && window.ethereum) {
        addResult('✅ window.ethereum found')
        
        // Test 2: Check if wallet is already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          addResult(`✅ Wallet already connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
        } else {
          addResult('❌ No accounts found - wallet not connected')
        }
        
        // Test 3: Check chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        addResult(`Chain ID: ${chainId}`)
        
      } else {
        addResult('❌ window.ethereum not found')
      }
    } catch (error) {
      addResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testCampSDK = async () => {
    addResult('Testing Camp Network Origin SDK...')
    addResult(`authenticated: ${authenticated}`)
    addResult(`address: ${address || 'null'}`)
    
    try {
      // Test the connect function
      addResult('Attempting to connect via Camp SDK...')
      const result = await connect()
      addResult(`Connect result: ${JSON.stringify(result)}`)
    } catch (error) {
      addResult(`❌ Connect error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-provn-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-provn-text mb-8">Wallet Connection Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-provn-text">Test Controls</h2>
            
            <button
              onClick={testWalletConnection}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Native Wallet Connection
            </button>
            
            <button
              onClick={testCampSDK}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Camp Network Origin SDK
            </button>
            
            <button
              onClick={openModal}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Open Camp Modal
            </button>
            
            <button
              onClick={clearResults}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
          
          {/* Current State */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-provn-text">Current State</h2>
            
            <div className="bg-provn-surface p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-provn-muted">Authenticated:</span>
                <span className={authenticated ? 'text-green-400' : 'text-red-400'}>
                  {authenticated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-provn-muted">Address:</span>
                <span className="text-provn-text">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-provn-muted">window.ethereum:</span>
                <span className={typeof window !== 'undefined' && window.ethereum ? 'text-green-400' : 'text-red-400'}>
                  {typeof window !== 'undefined' && window.ethereum ? '✅ Found' : '❌ Not found'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Test Results */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-provn-text mb-4">Test Results</h2>
          
          <div className="bg-provn-surface p-4 rounded-lg max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-provn-muted">No test results yet. Run some tests to see results here.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono text-provn-text">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
