'use client'

import { ReactNode } from 'react'

// Icon map: category name (lowercase substring match) → { icon, color }
// Argentine-centric categories with distinctive Lucide SVGs.
// Ordered from most-specific to least-specific to prevent false positives
// from substring overlap.
const CATEGORY_ICONS: Array<{ key: string; icon: ReactNode; color: string }> = [
  // ── Long keywords first (specificidad máxima) ──────────────
  { key: 'alimentación', color: '#C4782B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )},
  { key: 'supermercado', color: '#C4782B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )},
  { key: 'combustible', color: '#7D5A8C', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/>
      <path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9l-3-3"/>
      <path d="M3 22h12"/>
      <path d="M7 9h4"/>
    </svg>
  )},
  { key: 'transporte', color: '#7D5A8C', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  )},
  { key: 'suscripcion', color: '#B34A3C', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  )},
  { key: 'streaming', color: '#B34A3C', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="2"/>
      <polyline points="17 2 12 7 7 2"/>
    </svg>
  )},
  { key: 'vestimenta', color: '#C8553D', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
    </svg>
  )},
  { key: 'servicios', color: '#2D4A3E', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  )},
  { key: 'educación', color: '#5B3D6B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  )},
  // ── Mid-length keywords ─────────────────────────────────────
  { key: 'entretenimiento', color: '#C4782B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 9.5L19 4h-4l-3 3-3-3H5L3.5 9.5"/>
      <circle cx="12" cy="15" r="6"/>
      <path d="M12 9v6"/>
      <path d="M9 15h6"/>
    </svg>
  )},
  { key: 'restaurante', color: '#C4782B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  )},
  { key: 'salud', color: '#6B8E5F', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )},
  { key: 'farmacia', color: '#6B8E5F', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7.1-7.1l7.4 7.4a5 5 0 0 1-7.1 7.1z"/>
      <path d="m8.5 8.5 7 7"/>
    </svg>
  )},
  { key: 'mascota', color: '#C4782B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="4" cy="8" r="2"/>
      <path d="M9 10a4 4 0 0 0-4 4v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1a4 4 0 0 0-4-4H9z"/>
    </svg>
  )},
  { key: 'hogar', color: '#7A9B8E', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { key: 'alquiler', color: '#2D4A3E', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 12H9m8 4H7"/>
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <path d="M21 8H3"/>
    </svg>
  )},
  { key: 'impuesto', color: '#5B3D6B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
    </svg>
  )},
  { key: 'regalo', color: '#C8553D', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  )},
  // ── Short keywords (may collide, so last) ───────────────────
  { key: 'ocio', color: '#C4782B', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
    </svg>
  )},
  { key: 'viaje', color: '#7A9B8E', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12l9.5 9.5L22 11l-2-2m-7-7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
    </svg>
  )},
  { key: 'otros', color: '#8A7C6E', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
]

// Fallback icon — 4-dot grid (distinctive, not a generic "!" or "i")
const DEFAULT_ICON = {
  color: '#8A7C6E',
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="19" cy="12" r="1"/>
      <circle cx="5" cy="12" r="1"/>
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
 * Rounded-square category icon with Lucide SVG and colored tint background.
 * iOS App Icon style: visible tint + stroke-based icon.
 */
export function CategoryIcon({ categoryName, categoryColor, size = 40 }: CategoryIconProps) {
  const { icon, color } = resolveCategoryIcon(categoryName, categoryColor)
  
  return (
    <div
      className="category-icon flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-md)',
        background: `${color}26`, // 15% opacity — visible tint, not ghostly
        color: color,
      }}
    >
      <div style={{ width: size * 0.58, height: size * 0.58 }}>
        {icon}
      </div>
    </div>
  )
}
