'use client'

import { useState } from 'react'
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Form */}
            <ExpenseForm
              expenseToEdit={expenseToEdit}
              selectedPeriod={selectedPeriod}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  )
}
