'use client'

import ExpenseDetail from './ExpenseDetail'
import { Expense } from '@/hooks/useBudgetData'

interface ExpenseListProps {
  expenses: Expense[]
  isLoading: boolean
  filteredCategory: string
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expenseId: string) => void
}

export default function ExpenseList({
  expenses,
  isLoading,
  filteredCategory,
  onEditExpense,
  onDeleteExpense,
}: ExpenseListProps) {
  // Filter expenses by category
  const filteredExpenses = filteredCategory
    ? expenses.filter((expense) => expense.categoryId === filteredCategory)
    : expenses

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const isEmpty = filteredExpenses.length === 0

  return (
    <div className="mt-6">
      {isEmpty ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-orange-600 dark:text-orange-400 font-semibold text-lg">
            {filteredCategory ? 'No hay gastos en esta categoría' : 'No hay gastos registrados'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            {filteredCategory
              ? 'Intenta seleccionar otra categoría'
              : 'Comienza agregando tu primer gasto'}
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-blue-600 dark:text-blue-400 font-bold uppercase text-center text-lg pb-2 border-b-2 border-blue-400 dark:border-blue-500">
              Listado de gastos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
              {filteredExpenses.length} gasto{filteredExpenses.length !== 1 ? 's' : ''}{' '}
              {filteredCategory && (
                <>
                  en{' '}
                  <span className="font-semibold">
                    {filteredExpenses[0]?.category.name}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Expense list */}
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <ExpenseDetail
                key={expense.id}
                expense={expense}
                onEdit={() => onEditExpense(expense)}
                onDelete={() => onDeleteExpense(expense.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
