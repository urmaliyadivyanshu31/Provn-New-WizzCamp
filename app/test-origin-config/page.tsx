"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useAuthState } from "@campnetwork/origin/react";
import { ProvnCard, ProvnCardContent } from "@/components/provn/card";
import { ProvnButton } from "@/components/provn/button";

export default function TestOriginConfig() {
  const { authenticated, loading } = useAuthState();
  const auth = useAuth();
  const { origin, walletAddress, viem } = auth;
  const [configStatus, setConfigStatus] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    if (authenticated && origin) {
      // Check Origin SDK configuration
      const status = {
        hasOrigin: !!origin,
        hasWalletClient: !!(origin as any).walletClient,
        hasViemClient: !!(origin as any).viemClient,
        hasMintFile: typeof origin.mintFile === 'function',
        hasSetViemClient: typeof origin.setViemClient === 'function',
        walletAddress,
        hasViem: !!viem,
        originKeys: Object.keys(origin),
        originMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(origin)),
      };
      setConfigStatus(status);
    }
  }, [authenticated, origin, walletAddress, viem]);

  const testOriginSDK = async () => {
    if (!origin) return;

    const results: any = {};

    try {
      // Test 1: Check if mintFile method exists
      results.mintFileExists = typeof origin.mintFile === 'function';
      
      // Test 2: Check if wallet client is configured
      results.hasWalletClient = !!(origin as any).walletClient;
      
      // Test 3: Check if viem client is configured
      results.hasViemClient = !!(origin as any).viemClient;
      
      // Test 4: Check environment variables
      results.envVars = {
        apiKey: !!process.env.NEXT_PUBLIC_CAMP_NETWORK_API_KEY,
        clientId: !!process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID,
        environment: !!process.env.NEXT_PUBLIC_CAMP_NETWORK_ENVIRONMENT,
        rpcUrl: !!process.env.NEXT_PUBLIC_RPC_URL,
        chainId: !!process.env.NEXT_PUBLIC_CHAIN_ID,
        paraApiKey: !!process.env.NEXT_PUBLIC_PARA_API_KEY,
      };



      // Test 5: Check network connection
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          results.currentChainId = chainId;
          results.expectedChainId = '0x' + (123420001114).toString(16);
          results.correctNetwork = chainId === results.expectedChainId;
        } catch (error) {
          results.networkError = error;
        }
      }

      // Test 6: Check wallet connection
      if (walletAddress) {
        results.walletConnected = true;
        results.walletAddress = walletAddress;
      } else {
        results.walletConnected = false;
      }

    } catch (error) {
      results.error = error;
    }

    setTestResults(results);
  };

  if (loading) {
    return (
      <ProvnCard className="max-w-4xl mx-auto">
        <ProvnCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provn-accent mx-auto mb-4"></div>
          <p className="text-provn-muted">Loading Camp Network...</p>
        </ProvnCardContent>
      </ProvnCard>
    );
  }

  if (!authenticated) {
    return (
      <ProvnCard className="max-w-4xl mx-auto">
        <ProvnCardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold text-provn-text mb-4">Origin SDK Configuration Test</h2>
          <p className="text-provn-muted mb-4">Please connect to Camp Network first to test the configuration.</p>
        </ProvnCardContent>
      </ProvnCard>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-provn-text">Origin SDK Configuration Test</h1>
      
      <ProvnCard>
        <ProvnCardContent className="p-6">
          <h2 className="text-xl font-semibold text-provn-text mb-4">Configuration Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(configStatus).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className={typeof value === 'boolean' ? (value ? 'text-green-600' : 'text-red-600') : 'text-provn-muted'}>
                  {typeof value === 'boolean' ? (value ? '✅' : '❌') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </ProvnCardContent>
      </ProvnCard>

      <ProvnCard>
        <ProvnCardContent className="p-6">
          <h2 className="text-xl font-semibold text-provn-text mb-4">Test Results</h2>
          <ProvnButton onClick={testOriginSDK} className="mb-4">
            Run Configuration Tests
          </ProvnButton>
          
          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              {Object.entries(testResults).map(([key, value]) => (
                <div key={key} className="border-b border-provn-border pb-2">
                  <div className="font-medium text-provn-text mb-1">{key}:</div>
                  <div className="text-sm text-provn-muted">
                    {typeof value === 'object' ? (
                      <pre className="bg-provn-surface p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ProvnCardContent>
      </ProvnCard>

      <ProvnCard>
        <ProvnCardContent className="p-6">
          <h2 className="text-xl font-semibold text-provn-text mb-4">Troubleshooting</h2>
          <div className="space-y-2 text-sm text-provn-muted">
            <p>• If wallet client is missing, try reconnecting your wallet</p>
            <p>• If viem client is missing, check the Origin SDK initialization</p>
            <p>• If environment variables are missing, create a .env.local file</p>
            <p>• If on wrong network, switch to BaseCAMP Network (Chain ID: 123420001114)</p>
            <p>• If mintFile method is missing, the Origin SDK may not be fully initialized</p>
          </div>
        </ProvnCardContent>
      </ProvnCard>
    </div>
  );
}
