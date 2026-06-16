'use client'

import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import BottomSheet from './shared/BottomSheet'
import { useSheetStack } from './shared/useSheetStack'
import ActionSheet from './ActionSheet'
import QuickAddSheet from './QuickAddSheet'
import OcrSheet from './OcrSheet'

/**
 * Floating Action Button (FAB) — main entry point for adding expenses.
 *
 * Flow:
 *   Tap + → Action Sheet (3 options) → Quick Add / OCR / Add Budget
 *
 * Rendered as a React portal to guarantee visibility regardless of
 * parent overflow/transform/stacking context issues.
 */
export default function FloatingAddButton({
  onAddBudget,
}: {
  /** Called when user taps "Agregar presupuesto" in the action sheet. */
  onAddBudget?: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const { current, isOpen, open, push, back, close } = useSheetStack()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSuccess = () => {
    close()
  }

  if (!mounted) return null

  const content = (
    <>
      {/* The FAB button — positioned via CSS in globals.css */}
      <button
        onClick={() => open('actions')}
        className="fab-tap fab-fixed"
        aria-label="Agregar"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Action Sheet (first level) */}
      <BottomSheet
        isOpen={current === 'actions'}
        onClose={back}
        maxHeight={0.7}
      >
        <ActionSheet
          onQuickAdd={() => push('quick')}
          onOcr={() => push('ocr')}
          onBudget={() => {
            close()
            onAddBudget?.()
          }}
          onCancel={close}
        />
      </BottomSheet>

      {/* Quick Add Sheet */}
      <BottomSheet
        isOpen={current === 'quick'}
        onClose={back}
        maxHeight={0.9}
      >
        <QuickAddSheet
          onSuccess={handleSuccess}
          onBack={back}
        />
      </BottomSheet>

      {/* OCR Sheet */}
      <BottomSheet
        isOpen={current === 'ocr'}
        onClose={back}
        maxHeight={0.95}
      >
        <OcrSheet
          onSuccess={handleSuccess}
          onBack={back}
          onFallbackToManual={() => push('quick')}
        />
      </BottomSheet>
    </>
  )

  return createPortal(content, document.body)
}
