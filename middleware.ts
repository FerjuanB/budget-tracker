import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes
  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/theme-demo']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // API auth routes are public
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Protected routes require authentication
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
