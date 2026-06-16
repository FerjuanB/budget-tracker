'use client'

import ExpenseForm from './ExpenseForm'
import { Expense, BudgetPeriod } from '@/hooks/useBudgetData'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expenseToEdit?: Expense | null
  selectedPeriod?: BudgetPeriod | null
}

export default function ExpenseModal({
  isOpen,
  onClose,
  expenseToEdit,
  selectedPeriod,
}: ExpenseModalProps) {
  if (!isOpen) return null

  const handleSuccess = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="expense-modal-backdrop"
        onClick={onClose}
      />

      {/* Modal: bottom sheet on mobile, centered dialog on desktop */}
      <div
        className="expense-modal-wrapper"
        onClick={onClose}
      >
        <div
          className="expense-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle — visible on mobile only */}
          <div className="sheet-handle-bar sm:hidden" />

          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4 pt-2 sm:pt-0">
            <h2
              className="heading text-lg"
              style={{ color: 'var(--color-label-primary)' }}
            >
              {expenseToEdit ? 'Editar gasto' : 'Nuevo gasto'}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-colors"
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-quaternary)',
                color: 'var(--color-label-secondary)',
              }}
              aria-label="Cerrar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <ExpenseForm
            expenseToEdit={expenseToEdit}
            selectedPeriod={selectedPeriod}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  )
}
