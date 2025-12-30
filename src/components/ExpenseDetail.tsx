'use client'

import { Expense } from '@/hooks/useBudgetData'

interface ExpenseDetailProps {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
}

export default function ExpenseDetail({ expense, onEdit, onDelete }: ExpenseDetailProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm p-5 w-full border border-gray-200 dark:border-gray-700 flex items-center gap-4 rounded-lg hover:shadow-md transition-shadow">
      {/* Icono de categoría */}
      <div className="flex-shrink-0">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ 
            backgroundColor: expense.category.color 
              ? `${expense.category.color}20` 
              : '#f3f4f6' 
          }}
        >
          <span role="img" aria-label={expense.category.name}>
            {expense.category.icon}
          </span>
        </div>
      </div>

      {/* Información del gasto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {expense.category.name}
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white truncate">
              {expense.expenseName}
            </p>
            {expense.comments && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {expense.comments}
              </p>
            )}
          </div>
          
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {formatDate(expense.date)}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
              {formatAmount(expense.amount)}
            </p>
          </div>
        </div>

        {/* Snapshot info (optional, can be removed if not needed) */}
        {expense.budgetBefore !== undefined && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Presupuesto antes: {formatAmount(Number(expense.budgetBefore))}
              </span>
              <span>→</span>
              <span>
                Después: {formatAmount(Number(expense.budgetAfter))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={onEdit}
          className="px-4 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium"
        >
          Editar
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
