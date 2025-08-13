"use client";

import { useAuth, useAuthState, useConnect, useProviders } from "@campnetwork/origin/react";
import { useState } from "react";
import { ProvnButton } from "@/components/provn/button";

export default function TestOriginPage() {
  const { authenticated, loading } = useAuthState();
  const { connect, disconnect } = useConnect();
  const { jwt, origin } = useAuth();
  const providers = useProviders();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connect();
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Disconnection error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-provn-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-provn-text mb-8">Origin SDK Integration Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Connection Status */}
          <div className="bg-provn-surface border border-provn-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-provn-text mb-4">Connection Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-provn-muted">Status:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  loading ? 'bg-yellow-500 text-black' :
                  authenticated ? 'bg-green-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {loading ? 'Loading' : authenticated ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-provn-muted">JWT Token:</span>
                <span className="text-provn-text text-xs">
                  {jwt ? '✅ Present' : '❌ Missing'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-provn-muted">Origin SDK:</span>
                <span className="text-provn-text text-xs">
                  {origin ? '✅ Available' : '❌ Not Available'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              {!authenticated ? (
                <ProvnButton
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect to Camp Network'}
                </ProvnButton>
              ) : (
                <ProvnButton
                  onClick={handleDisconnect}
                  variant="secondary"
                  className="w-full"
                >
                  Disconnect
                </ProvnButton>
              )}
            </div>
          </div>

          {/* Available Providers */}
          <div className="bg-provn-surface border border-provn-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-provn-text mb-4">Available Providers</h2>
            
            {providers.length > 0 ? (
              <div className="space-y-3">
                {providers.map((provider, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-provn-surface-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      {provider.info.icon && (
                        <img 
                          src={provider.info.icon} 
                          alt={provider.info.name}
                          className="w-6 h-6 rounded"
                        />
                      )}
                      <span className="text-provn-text font-medium">{provider.info.name}</span>
                    </div>
                    <span className="text-provn-muted text-xs">Available</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-provn-muted">No providers detected</p>
                <p className="text-provn-muted text-sm mt-2">
                  Make sure you have MetaMask or another wallet extension installed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="mt-8 bg-provn-surface border border-provn-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-provn-text mb-4">Environment Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-provn-muted">Camp Network Client ID:</span>
              <span className="text-provn-text font-mono">
                {process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-provn-muted">Camp Network API Key:</span>
              <span className="text-provn-text font-mono">
                {process.env.NEXT_PUBLIC_CAMP_NETWORK_API_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-provn-muted">Camp Network Environment:</span>
              <span className="text-provn-text font-mono">
                {process.env.NEXT_PUBLIC_CAMP_NETWORK_ENVIRONMENT ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-provn-muted">BaseCAMP Chain ID:</span>
              <span className="text-provn-text font-mono">
                {process.env.NEXT_PUBLIC_CHAIN_ID ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">How to Test</h2>
          
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Make sure you have MetaMask installed and unlocked</li>
            <li>Click "Connect to Camp Network" button</li>
            <li>Approve the connection in MetaMask</li>
            <li>You should see "Connected" status and JWT token available</li>
            <li>If successful, you can now mint IP-NFTs on the upload page</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This integration uses the official Origin SDK from Camp Network. 
              If connection fails, check that your MetaMask is on the correct network (BaseCAMP).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
