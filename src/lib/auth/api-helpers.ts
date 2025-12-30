import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export async function getAuthenticatedUser() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }
  
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}
