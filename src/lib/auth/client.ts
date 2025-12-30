'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export const useAuth = () => {
  const { data: session, status } = useSession()

  return {
    session,
    status,
    signIn: (email: string, password: string) =>
      signIn('credentials', {
        email,
        password,
        redirect: false,
      }),
    signOut: () => signOut(),
    isAuthenticated: status === 'authenticated',
  }
}