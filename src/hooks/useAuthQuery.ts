'use client'

import { useQuery } from '@tanstack/react-query'
import { getSession, getCurrentUser } from '@/lib/auth/session'

// Types
export interface User {
  id: string
  name: string | null
  email: string
  createdAt: Date
  updatedAt: Date
}

// API Functions
const authApi = {
  getSession: async () => {
    const session = await getSession()
    return session
  },

  getCurrentUser: async (): Promise<User | null> => {
    const user = await getCurrentUser()
    return user as User | null
  },

  checkAuth: async (): Promise<boolean> => {
    const session = await getSession()
    return !!session?.user
  },
}

// Hooks
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: authApi.getSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: false, // Only fetch when explicitly needed
  })
}

export function useIsAuthenticated() {
  return useQuery({
    queryKey: ['isAuthenticated'],
    queryFn: authApi.checkAuth,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 30, // 30 seconds
  })
}

// Utility hook that combines session and user data
export function useAuth() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const { data: isAuthenticated, isLoading: authLoading } = useIsAuthenticated()

  return {
    session,
    user,
    isAuthenticated: isAuthenticated || false,
    isLoading: sessionLoading || userLoading || authLoading,
    isSignedIn: !!session?.user,
  }
}