'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ClosePeriodDialog from '@/components/ClosePeriodDialog'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)

  // Redirect to signin if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [menuOpen])

  if (status === 'loading') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background)' }}
      >
        <div className="text-center">
          <div 
            className="inline-block h-8 w-8 rounded-full animate-spin"
            style={{ 
              border: '3px solid var(--color-label-quaternary)',
              borderTopColor: 'var(--color-accent)',
            }}
          />
          <p 
            className="mt-4 text-sm"
            style={{ color: 'var(--color-label-secondary)', fontFamily: 'var(--font-heading)' }}
          >
            Cargando...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut({ callbackUrl: '/auth/signin' })
  }

  // Generate initials from name or fallback to first letter of email
  const getInitials = () => {
    if (session.user?.name) {
      return session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }
    if (session.user?.email) {
      return session.user.email.slice(0, 2).toUpperCase()
    }
    return 'US'
  }

  return (
    <div 
      className="min-h-screen"
      style={{ background: 'var(--color-surface-secondary)' }}
    >
      {/* Minimal Header */}
      <header 
        className="sticky top-0 z-20 px-5 pt-3 pb-2 flex items-center justify-between"
        style={{ 
          background: 'var(--color-surface-secondary)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ color: 'var(--color-accent)' }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span 
            className="text-[15px]"
            style={{ 
              fontFamily: 'var(--font-heading)', 
              fontWeight: 700,
              color: 'var(--color-label-primary)',
            }}
          >Bat-Expenses
          </span>
        </Link>

        {/* Avatar */}
        <button
          ref={avatarRef}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center justify-center transition-transform active:scale-95"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
        background: 'linear-gradient(135deg, #2D4A3E, #5B3D6B)',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-heading)',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Menú de usuario"
        >
          {getInitials()}
        </button>

        {/* Avatar Menu Popover */}
        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute top-[52px] right-5 min-w-[200px] overflow-hidden"
            style={{
              background: 'var(--color-surface-primary)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'menu-appear 200ms var(--ease-spring) forwards',
            }}
          >
            {/* Profile */}
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-label-primary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-quaternary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Perfil
            </button>

            {/* Settings */}
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-label-primary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-quaternary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Configuración
            </button>

            {/* Separator */}
            <div 
              className="mx-3 my-1"
              style={{ height: 1, background: 'var(--color-separator)' }}
            />

            {/* Close period (danger, duplicated entry point) */}
            <button
              onClick={() => {
                setMenuOpen(false)
                setShowCloseDialog(true)
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-destructive)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-quaternary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Cerrar período
            </button>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-label-primary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-quaternary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      {/* Main content — mobile-first, no heavy wrapper */}
      <main className="mx-auto max-w-[500px] pb-24">
        {children}
      </main>

      {/* Shared Close Period Dialog */}
      <ClosePeriodDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
      />
    </div>
  )
}
