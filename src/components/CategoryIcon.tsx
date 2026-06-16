'use client'

import { ReactNode } from 'react'

// Icon map: category name (lowercase substring match) → { icon, color }
// Based on Argentine common categories (no emojis, Lucide SVG icons)
// Ordered from most-specific to least-specific to prevent false positives
// from substring overlap (e.g. if a category name contains multiple keys,
// the longer/more-specific one wins).
const CATEGORY_ICONS: Array<{ key: string; icon: ReactNode; color: string }> = [
  // 1. Longer words first (less likely to collide as substring)
  { key: 'alimentación', color: '#C4782B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )},
  { key: 'transporte', color: '#7D5A8C', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  )},
  { key: 'suscripcion', color: '#B34A3C', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )},
  { key: 'vestimenta', color: '#C8553D', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
    </svg>
  )},
  { key: 'servicios', color: '#2D4A3E', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
      <polyline points="9 6 12 3 15 6"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )},
  { key: 'educación', color: '#5B3D6B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )},
  // 2. Mid-length words
  { key: 'salud', color: '#6B8E5F', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="12" y1="11" x2="12" y2="17"/>
      <line x1="9" y1="14" x2="15" y2="14"/>
    </svg>
  )},
  { key: 'hogar', color: '#7A9B8E', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22v-6h12v6"/>
      <path d="M3 22V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"/>
      <path d="M15 14h4a2 2 0 0 1 2 2v6"/>
      <path d="M7 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  )},
  // 3. Short/generic words last (more likely to collide)
  { key: 'ocio', color: '#C4782B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  )},
  { key: 'otros', color: '#8A7C6E', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )},
]

// Fallback icon (generic)
const DEFAULT_ICON = {
  color: '#8A7C6E',
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
}

/**
 * Resolves the icon + color for a category name.
 * Case-insensitive substring matching against ordered keys (most-specific first
 * to prevent false positives from shorter keys contained in longer ones).
 */
export function resolveCategoryIcon(categoryName: string, categoryColor?: string | null) {
  const normalized = categoryName.toLowerCase()
  const match = CATEGORY_ICONS.find((entry) => normalized.includes(entry.key))
  const resolved = match || DEFAULT_ICON
  
  // Prefer user-defined color if available, fall back to our mapped color
  const color = categoryColor || resolved.color
  
  return {
    icon: resolved.icon,
    color,
  }
}

interface CategoryIconProps {
  categoryName: string
  categoryColor?: string | null
  size?: number
}

/**
 * Rounded-square category icon with Lucide SVG and colored background.
 * Matches the iOS HIG style from the mockup.
 */
export function CategoryIcon({ categoryName, categoryColor, size = 40 }: CategoryIconProps) {
  const { icon, color } = resolveCategoryIcon(categoryName, categoryColor)
  
  return (
    <div
      className="category-icon flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-sm)',
        background: `${color}18`, // 9% opacity (18 in hex = ~9%)
        color: color,
      }}
    >
      <div style={{ width: size * 0.55, height: size * 0.55 }}>
        {icon}
      </div>
    </div>
  )
}
