'use client'

import { Expense } from '@/hooks/useBudgetData'
import { CategoryIcon } from './CategoryIcon'
import { formatCompactDate } from '@/lib/formatters'

interface ExpenseDetailProps {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
}

export default function ExpenseDetail({ expense, onEdit, onDelete }: ExpenseDetailProps) {

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3.5 transition-colors cursor-pointer"
      style={{ 
        borderBottom: '1px solid var(--color-separator)',
      }}
      onClick={onEdit}
      onMouseDown={(e) => e.currentTarget.style.background = 'var(--color-surface-quaternary)'}
      onMouseUp={(e) => e.currentTarget.style.background = ''}
      onMouseLeave={(e) => e.currentTarget.style.background = ''}
    >
      <CategoryIcon
        categoryName={expense.category.name}
        categoryColor={expense.category.color}
      />

      <div className="flex-1 min-w-0">
        <div
          className="font-medium truncate"
          style={{
            fontSize: 14,
            color: 'var(--color-label-primary)',
          }}
        >
          {expense.expenseName}
        </div>
        <div
          className="truncate mt-0.5"
          style={{
            fontSize: 12,
            color: 'var(--color-label-secondary)',
          }}
        >
          {expense.category.name} · {formatCompactDate(expense.date)}
        </div>
      </div>

      <div
        className="amount flex-shrink-0 text-right"
        style={{
          fontSize: 15,
          color: 'var(--color-label-primary)',
        }}
      >
        ${formatAmount(Number(expense.amount))}
      </div>
    </div>
  )
}
