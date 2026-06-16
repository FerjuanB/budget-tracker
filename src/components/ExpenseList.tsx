'use client'

import ExpenseDetail from './ExpenseDetail'
import { Expense, BudgetAddition } from '@/hooks/useBudgetData'
import { CategoryIcon } from './CategoryIcon'
import { formatCompactDay } from '@/lib/formatters'

interface ExpenseListProps {
  expenses: Expense[]
  budgetAdditions?: BudgetAddition[]
  isLoading: boolean
  filteredCategory: string
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expenseId: string) => void
  readOnly?: boolean
}

type ListItem =
  | { kind: 'expense'; data: Expense; sortDate: string }
  | { kind: 'budget'; data: BudgetAddition; sortDate: string }

// Budget addition type config (minimal, iOS-style)
const BUDGET_TYPE_CONFIG = {
  INCOME: {
    label: 'Ingreso',
    color: '#6B8E5F',
    sign: '+',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
      </svg>
    ),
  },
  ADJUSTMENT: {
    label: 'Ajuste',
    color: '#2D4A3E',
    sign: '+',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  DEDUCTION: {
    label: 'Deducción',
    color: '#B34A3C',
    sign: '-',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
        <polyline points="17 18 23 18 23 12"/>
      </svg>
    ),
  },
}

function BudgetAdditionRow({ addition }: { addition: BudgetAddition }) {
  const config = BUDGET_TYPE_CONFIG[addition.type]
  
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3.5"
      style={{ borderBottom: '1px solid var(--color-separator)' }}
    >
      {/* Circular income/adjustment/deduction icon */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          background: `${config.color}18`,
          color: config.color,
        }}
      >
        <div style={{ width: 22, height: 22 }}>
          {config.icon}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="font-medium truncate"
          style={{
            fontSize: 14,
            color: 'var(--color-label-primary)',
          }}
        >
          {addition.source}
        </div>
        <div
          className="truncate mt-0.5"
          style={{
            fontSize: 12,
            color: 'var(--color-label-secondary)',
          }}
        >
          {config.label} · {formatCompactDay(addition.date)}
        </div>
      </div>

      <div
        className="amount flex-shrink-0 text-right"
        style={{
          fontSize: 15,
          color: config.color,
        }}
      >
        {config.sign}${formatAmount(addition.amount)}
      </div>
    </div>
  )
}

export default function ExpenseList({
  expenses,
  budgetAdditions = [],
  isLoading,
  filteredCategory,
  onEditExpense,
  onDeleteExpense,
  readOnly = false,
}: ExpenseListProps) {
  const BUDGET_FILTER = '__BUDGET_ADDITIONS__'
  const isBudgetFilter = filteredCategory === BUDGET_FILTER

  const filteredExpenses = isBudgetFilter || !filteredCategory
    ? isBudgetFilter ? [] : expenses
    : expenses.filter((expense) => expense.categoryId === filteredCategory)

  const visibleBudgetAdditions = (isBudgetFilter || !filteredCategory) ? budgetAdditions : []

  // Merge and sort by date desc
  const allItems: ListItem[] = [
    ...filteredExpenses.map((e) => ({
      kind: 'expense' as const,
      data: e,
      sortDate: e.date || e.createdAt,
    })),
    ...visibleBudgetAdditions.map((b) => ({
      kind: 'budget' as const,
      data: b,
      sortDate: b.date || b.createdAt,
    })),
  ].sort((a, b) => {
    const diff = new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
    if (diff !== 0) return diff
    return new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
  })

  // Total of visible expenses (for header)
  const totalDisplayed = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  if (isLoading) {
    return (
      <div className="px-5 py-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3.5 animate-pulse"
            style={{ background: 'var(--color-surface-primary)', borderRadius: 'var(--radius-md)' }}
          >
            <div
              className="rounded-sm"
              style={{ width: 40, height: 40, background: 'var(--color-label-quaternary)' }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="rounded"
                style={{ width: '60%', height: 14, background: 'var(--color-label-quaternary)' }}
              />
              <div
                className="rounded"
                style={{ width: '40%', height: 12, background: 'var(--color-label-quaternary)' }}
              />
            </div>
            <div
              className="rounded"
              style={{ width: 70, height: 16, background: 'var(--color-label-quaternary)' }}
            />
          </div>
        ))}
      </div>
    )
  }

  const isEmpty = allItems.length === 0

  return (
    <section className="px-5">
      {/* List header: title + total */}
      {!isEmpty && (
        <div className="flex justify-between items-baseline pb-3 pt-2">
          <div
            className="font-semibold"
            style={{
              fontSize: 15,
              color: 'var(--color-label-secondary)',
            }}
          >
            {isBudgetFilter 
              ? 'Ingresos'
              : filteredCategory 
                ? `${filteredExpenses.length} en esta categoría`
                : 'Gastos recientes'
            }
          </div>
          {!isBudgetFilter && filteredExpenses.length > 0 && (
            <div
              className="amount truncate"
              style={{
                fontSize: 14,
                color: '#6B8E5F',
                fontWeight: 700,
                maxWidth: '45%',
              }}
            >
              ${totalDisplayed.toLocaleString('es-AR')}
            </div>
          )}
        </div>
      )}

      {isEmpty ? (
        <div
          className="text-center py-12"
          style={{
            background: 'var(--color-surface-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="mx-auto flex items-center justify-center mb-3"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--color-surface-quaternary)',
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--color-label-tertiary)' }}
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p
            className="font-semibold mb-1"
            style={{
              color: 'var(--color-label-secondary)',
              fontSize: 14,
              fontFamily: 'var(--font-heading)',
            }}
          >
            {isBudgetFilter
              ? 'Sin ingresos'
              : filteredCategory
                ? 'Sin gastos en esta categoría'
                : 'Sin movimientos aún'}
          </p>
          <p
            style={{
              color: 'var(--color-label-tertiary)',
              fontSize: 12,
            }}
          >
            {isBudgetFilter
              ? 'Agregá un ingreso con el botón + de los filtros'
              : 'Tocá + para agregar un gasto'}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--color-surface-primary)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {allItems.map((item) =>
            item.kind === 'expense' ? (
              <ExpenseDetail
                key={`expense-${item.data.id}`}
                expense={item.data}
                onEdit={() => onEditExpense(item.data)}
                onDelete={() => onDeleteExpense(item.data.id)}
                readOnly={readOnly}
              />
            ) : (
              <BudgetAdditionRow key={`budget-${item.data.id}`} addition={item.data} />
            )
          )}
        </div>
      )}
    </section>
  )
}
