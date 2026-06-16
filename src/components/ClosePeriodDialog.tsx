'use client'

import { useState } from 'react'
import { useCurrentPeriod, useClosePeriod } from '@/hooks/useBudgetData'

interface ClosePeriodDialogProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Shared "Close Period" confirmation dialog.
 * Used both from the Hero pill and the Avatar menu.
 */
export default function ClosePeriodDialog({ isOpen, onClose }: ClosePeriodDialogProps) {
  const { data: currentPeriod } = useCurrentPeriod()
  const closePeriodMutation = useClosePeriod()

  const handleConfirm = async () => {
    if (!currentPeriod) return
    try {
      await closePeriodMutation.mutateAsync(currentPeriod.id)
      onClose()
      // Using alert for now — will be replaced with toast system later
      alert('Período cerrado exitosamente')
    } catch (error: any) {
      alert(error.message || 'Error al cerrar período')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-[var(--color-surface-primary)] rounded-[var(--radius-lg)] max-w-sm w-full p-6"
        style={{
          animation: 'dialog-appear 250ms var(--ease-spring) forwards',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <h3 className="heading text-lg mb-2">
          ¿Cerrar el período?
        </h3>
        <p className="text-[var(--color-label-secondary)] text-sm mb-5 leading-relaxed">
          Vas a archivar el período actual y empezar uno nuevo con presupuesto en $0.
          Los datos quedan guardados en el historial.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-[var(--radius-md)] text-sm font-semibold bg-[var(--color-label-quaternary)] text-[var(--color-label-primary)] transition-transform"
            style={{ transform: 'scale(1)', fontFamily: 'var(--font-heading)' }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={closePeriodMutation.isPending}
            className="flex-1 py-3 rounded-[var(--radius-md)] text-sm font-semibold bg-[var(--color-destructive)] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
            style={{ transform: 'scale(1)', fontFamily: 'var(--font-heading)' }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {closePeriodMutation.isPending ? 'Cerrando...' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
