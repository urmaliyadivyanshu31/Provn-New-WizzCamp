'use client';

import React from 'react';
import { ProvnButton } from './provn/button';
import { ProvnCard, ProvnCardContent } from './provn/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}






class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Handle specific wallet extension errors
    if (error.message?.includes('ethereum') || error.message?.includes('Cannot redefine property')) {
      console.warn('🔧 Wallet extension conflict detected, attempting recovery...');
      
      // Attempt to reload the page after a short delay to allow extensions to settle
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 2000);
    }
    
    this.setState({
      error,
      errorInfo,
    });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={error!} retry={this.retry} />;
      }

      // Check if it's a wallet extension error
      const isWalletError = error?.message?.includes('ethereum') || 
                          error?.message?.includes('Cannot redefine property') ||
                          error?.message?.includes('evmAsk');

      return (
        <div className="min-h-screen bg-provn-bg flex items-center justify-center p-4">
          <ProvnCard className="max-w-lg w-full">
            <ProvnCardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="font-headline text-xl font-bold text-provn-text">
                  {isWalletError ? 'Wallet Extension Conflict' : 'Something went wrong'}
                </h1>
                <p className="text-provn-muted text-sm">
                  {isWalletError 
                    ? 'Multiple wallet extensions are conflicting. The page will reload automatically to resolve this.'
                    : 'An unexpected error occurred while loading the application.'
                  }
                </p>
              </div>

              {isWalletError ? (
                <div className="bg-provn-surface-2 rounded-lg p-4">
                  <p className="text-provn-muted text-xs">
                    💡 To prevent this in the future, try disabling unused wallet extensions or using only one at a time.
                  </p>
                </div>
              ) : (
                <div className="bg-provn-surface-2 rounded-lg p-4">
                  <p className="text-provn-muted text-xs font-mono">
                    {error?.message || 'Unknown error'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <ProvnButton
                  variant="secondary"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </ProvnButton>
                <ProvnButton onClick={this.retry}>
                  Try Again
                </ProvnButton>
              </div>
            </ProvnCardContent>
          </ProvnCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;