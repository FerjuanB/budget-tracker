'use client'

import BottomSheet from './shared/BottomSheet'
import { useSheetStack } from './shared/useSheetStack'
import ActionSheet from './ActionSheet'
import QuickAddSheet from './QuickAddSheet'
import RecurringSheet from './RecurringSheet'

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

  const handleQuickAddSuccess = () => {
    close()
  }

  return (
    <>
      {/* The FAB itself */}
      <button
        onClick={() => open('actions')}
        className="fab-tap fixed bottom-6 right-6 z-40 w-16 h-16 rounded-[var(--radius-full)] text-white text-3xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        style={{
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
          onOcr={() => {
            // TODO: implement OcrSheet next (Phase D)
            alert('📷 OCR todavía no disponible — lo hacemos después de los recurrentes.')
            back()
          }}
          onRecurring={() => push('recurring')}
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
          onSuccess={handleQuickAddSuccess}
          onBack={back}
        />
      </BottomSheet>

      {/* Recurring Sheet */}
      <BottomSheet
        isOpen={current === 'recurring'}
        onClose={back}
        maxHeight={0.85}
      >
        <RecurringSheet onBack={back} />
      </BottomSheet>
    </>
  )
}
