'use client';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Created in state so each browser session gets one client that survives re-renders
  // but is never shared between users during server rendering.
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Most of this catalog changes rarely; serving cached pages instantly matters
        // more on a phone than being a few seconds fresher.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false
      }
    }
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
