'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/lib/queryClient'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
  session?: any
}

export function QueryProvider({ children, session }: QueryProviderProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </SessionProvider>
    </QueryClientProvider>
  )
}