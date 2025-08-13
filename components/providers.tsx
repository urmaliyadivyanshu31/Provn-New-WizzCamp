"use client"

import React from 'react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CampProvider } from '@campnetwork/origin/react'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Create a new QueryClient instance
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <CampProvider
          apiKey={process.env.NEXT_PUBLIC_CAMP_NETWORK_API_KEY || '4f1a2c9c-008e-4a2e-8712-055fa04f9ffa'}
          clientId={process.env.NEXT_PUBLIC_CAMP_NETWORK_CLIENT_ID || 'fce77d7a-8085-47ca-adff-306a933e76aa'}
          environment={process.env.NEXT_PUBLIC_CAMP_NETWORK_ENVIRONMENT || 'testnet'}
        >
          {children}
        </CampProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
