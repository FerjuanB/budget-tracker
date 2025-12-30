'use server'

import { auth } from './auth'

export const getSession = async () => {
  return await auth()
}

export const getAuthSession = async () => {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
    }
  }
}
