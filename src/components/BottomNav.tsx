'use client'

import { useState, ReactNode } from 'react'

export type TabKey = 'home' | 'history' | 'categories'

interface TabConfig {
  key: TabKey
  label: string
  icon: ReactNode
}

const TABS: TabConfig[] = [
  {
    key: 'home',
    label: 'Inicio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    key: 'history',
    label: 'Historial',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    key: 'categories',
    label: 'Categorías',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
]

interface BottomNavProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

/**
 * iOS-style bottom navigation bar.
 * 
 * For Phase 1: tab switching is client-side state, not Next.js routing.
 * This keeps the implementation simple and allows us to validate
 * the visual before committing to route structure.
 * 
 * The FAB button in FloatingAddButton.tsx is positioned to float above this.
 */
export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3"
      style={{
        background: 'rgba(249, 249, 249, 0.85)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid var(--color-separator)',
        paddingTop: 8,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        maxWidth: 500,
        margin: '0 auto',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex flex-col items-center gap-0.5 py-1 transition-colors"
            style={{
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--color-accent)' : 'var(--color-label-secondary)',
              fontSize: 10,
              fontWeight: 500,
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
          >
            <div
              className="transition-transform"
              style={{
                width: 24,
                height: 24,
                transform: isActive ? 'scale(1)' : 'scale(1)',
                color: 'currentColor',
              }}
            >
              {tab.icon}
            </div>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
