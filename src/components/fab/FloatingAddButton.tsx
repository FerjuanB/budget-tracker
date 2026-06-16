'use client'

import BottomSheet from './shared/BottomSheet'
import { useSheetStack } from './shared/useSheetStack'
import ActionSheet from './ActionSheet'
import QuickAddSheet from './QuickAddSheet'
import OcrSheet from './OcrSheet'

/**
 * Floating Action Button (FAB) — main entry point for adding expenses.
 * 
 * Flow:
 *   Tap + → Action Sheet (choose type) → Quick Add / OCR / Recurring
 * 
 * Option 2 design (Action Sheet pattern, not radial fan).
 */
export default function FloatingAddButton() {
  const { current, isOpen, open, push, back, close } = useSheetStack()

  const handleSuccess = () => {
    close()
  }

  return (
    <>
      {/* The FAB itself */}
      {/* Positioned 92px from bottom (above BottomNav ~72px + 20px gap) + safe-area */}
      <button
        onClick={() => open('actions')}
        className="fab-tap fixed right-5 z-40 w-14 h-14 rounded-[var(--radius-full)] text-white text-3xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        style={{
          bottom: 'calc(92px + env(safe-area-inset-bottom))',
          background: 'var(--color-accent)',
          boxShadow: '0 8px 24px rgba(0, 122, 255, 0.35)',
          fontFamily: 'var(--font-heading)',
        }}
        aria-label="Agregar"
      >
        +
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
          onRecurring={() => {
            // Placeholder — to be reimplemented with cron generation
            alert('🔁 Recurrentes próximamente — lo hacemos en otra sesión.')
            back()
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
        />
      </BottomSheet>
    </>
  )
}
