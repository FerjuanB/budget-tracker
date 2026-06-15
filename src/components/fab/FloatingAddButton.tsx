'use client'

import BottomSheet from './shared/BottomSheet'
import { useSheetStack } from './shared/useSheetStack'
import ActionSheet from './ActionSheet'
import QuickAddSheet from './QuickAddSheet'

/**
 * Floating Action Button (FAB) — main entry point for adding expenses.
 * 
 * Flow:
 *   Tap + → Action Sheet (choose type) → Quick Add / OCR / Recurring
 * 
 * Option 2 design (Action Sheet pattern, not radial fan).
 * Recurring sheet temporarily removed — will be reimplemented later with cron.
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
            // TODO: implement OcrSheet (Phase D)
            alert('📷 OCR próximamente — siguiente feature.')
            back()
          }}
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
          onSuccess={handleQuickAddSuccess}
          onBack={back}
        />
      </BottomSheet>
    </>
  )
}
