'use client'

import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache time: 5 minutes
        gcTime: 1000 * 60 * 5,
        // Stale time: 2 minutes
        staleTime: 1000 * 60 * 2,
        // Retry failed queries 3 times
        retry: 3,
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus
        refetchOnWindowFocus: true,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Refetch on mount
        refetchOnMount: true,
      },
      mutations: {
        // Retry failed mutations 1 time
        retry: 1,
        // Retry delay
        retryDelay: 1000,
      },
    },
  })
}

// Create a singleton instance
let client: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient()
  } else {
    // Client: use singleton pattern for HMR
    if (!client) {
      client = createQueryClient()
    }
    return client
  }
}