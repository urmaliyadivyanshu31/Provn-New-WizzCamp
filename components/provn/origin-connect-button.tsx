"use client";

import React from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ProvnButton } from "./button";

export default function OriginConnectButton() {
  return (
    <div className="text-center space-y-2">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted
          const connected = ready && account && chain

          if (!ready) {
            return (
              <ProvnButton variant="secondary" disabled>
                Loading...
              </ProvnButton>
            )
          }

          if (!connected) {
            return (
              <ProvnButton 
                onClick={openConnectModal} 
                className="min-w-[200px] provn-origin-button"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                  Connect to Camp Network
                </span>
              </ProvnButton>
            )
          }

          if (chain.unsupported) {
            return (
              <ProvnButton onClick={openChainModal} variant="secondary">
                Wrong network
              </ProvnButton>
            )
          }

          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-provn-surface px-3 py-2 rounded-lg border border-provn-border">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-provn-text font-medium">
                  {account.displayName}
                </span>
              </div>
              
              <ProvnButton
                variant="secondary"
                size="sm"
                onClick={openAccountModal}
                className="text-xs"
              >
                Account
              </ProvnButton>
            </div>
          )
        }}
      </ConnectButton.Custom>
      
      <div className="text-xs text-provn-muted">
        Ready to connect with RainbowKit
      </div>
    </div>
  );
}
