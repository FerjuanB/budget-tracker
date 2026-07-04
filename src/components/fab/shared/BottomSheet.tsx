'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** Max height as fraction of viewport (0-1). Default 0.9 */
  maxHeight?: number
  /** If true, clicking backdrop closes the sheet */
  dismissible?: boolean
  /** Custom z-index (default 50) */
  zIndex?: number
}

/**
 * iOS-style bottom sheet with drag-to-close, backdrop blur, and smooth spring animations.
 * Renders via portal to avoid stacking context issues.
 */
export default function BottomSheet({
  isOpen,
  onClose,
  children,
  maxHeight = 0.9,
  dismissible = true,
  zIndex = 50,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const dragCurrentY = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0)
      setIsAnimatingOut(false)
    }
  }, [isOpen])

  // Lock body scroll when open
  useEffect(() => {
    if (!mounted || !isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen, mounted])

  // Close animation
  const handleClose = () => {
    setIsAnimatingOut(true)
    setTimeout(() => {
      setIsAnimatingOut(false)
      onClose()
    }, 280)
  }

  // Touch drag handler
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow drag if at top of scroll
    const sheet = sheetRef.current
    if (sheet && sheet.scrollTop > 20) return
    dragStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    const currentY = e.touches[0].clientY
    dragCurrentY.current = currentY
    const deltaY = currentY - dragStartY.current
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (dragCurrentY.current !== null && dragStartY.current !== null) {
      const deltaY = dragCurrentY.current - dragStartY.current
      if (deltaY > 120) {
        handleClose()
      } else {
        setDragOffset(0)
      }
    }
    dragStartY.current = null
    dragCurrentY.current = null
  }

  if (!mounted || (!isOpen && !isAnimatingOut)) return null

  const visible = isOpen && !isAnimatingOut

  const sheetContent = (
    <div
      className="fixed inset-0"
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div
        className={`sheet-backdrop absolute inset-0 transition-opacity ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDuration: 'var(--duration-normal)' }}
        onClick={dismissible ? handleClose : undefined}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute bottom-0 left-0 right-0 overflow-y-auto overflow-x-hidden bg-[var(--color-surface-elevated)] rounded-t-[var(--radius-xl)]"
        style={{
          maxHeight: `${maxHeight * 100}vh`,
          boxShadow: 'var(--shadow-sheet)',
          transform: visible
            ? `translateY(${dragOffset}px)`
            : 'translateY(100%)',
          transition: dragOffset === 0 ? `transform var(--duration-normal) var(--ease-spring)` : 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Handle visual bar (drag cue) */}
        <div className="sheet-handle-bar" />
        {/* Content */}
        <div className="pb-[max(env(safe-area-inset-bottom),24px)] px-5">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(sheetContent, document.body)
}
