'use client'

import { Expense } from '@/hooks/useBudgetData'
import { CategoryIcon } from './CategoryIcon'

interface ExpenseDetailProps {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
}

export default function ExpenseDetail({ expense, onEdit, onDelete }: ExpenseDetailProps) {
  // Compact date format: "Hoy, 14:32" / "Ayer" / "15 jun"
  const formatCompactDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.floor((todayOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `Hoy, ${hours}:${minutes}`
    }
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    
    // Same year: "15 jun"
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    }
    // Older: "15 jun 2024"
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

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
        ${formatAmount(expense.amount)}
      </div>
    </div>
  )
}
