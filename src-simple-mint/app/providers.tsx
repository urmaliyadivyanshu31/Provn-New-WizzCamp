'use client';


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { CampProvider } from "@campnetwork/origin/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
        <CampProvider clientId="9123887d-94f0-4427-a2f7-cd04d16c1fc3">
            {children}
        </CampProvider>
    </QueryClientProvider>
  );
} 