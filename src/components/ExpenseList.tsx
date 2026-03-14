'use client'

import ExpenseDetail from './ExpenseDetail'
import { Expense, BudgetAddition } from '@/hooks/useBudgetData'

interface ExpenseListProps {
  expenses: Expense[]
  budgetAdditions?: BudgetAddition[]
  isLoading: boolean
  filteredCategory: string
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expenseId: string) => void
}

type ListItem =
  | { kind: 'expense'; data: Expense; sortDate: string }
  | { kind: 'budget'; data: BudgetAddition; sortDate: string }

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

const BUDGET_TYPE_CONFIG = {
  INCOME: {
    label: 'Ingreso',
    icon: '💰',
    sign: '+',
    bgClass: 'bg-green-50 dark:bg-green-900/10',
    borderClass: 'border-green-200 dark:border-green-800',
    amountClass: 'text-green-700 dark:text-green-400',
    badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  },
  ADJUSTMENT: {
    label: 'Ajuste',
    icon: '📈',
    sign: '+',
    bgClass: 'bg-blue-50 dark:bg-blue-900/10',
    borderClass: 'border-blue-200 dark:border-blue-800',
    amountClass: 'text-blue-700 dark:text-blue-400',
    badgeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  },
  DEDUCTION: {
    label: 'Deducción',
    icon: '📉',
    sign: '-',
    bgClass: 'bg-red-50 dark:bg-red-900/10',
    borderClass: 'border-red-200 dark:border-red-800',
    amountClass: 'text-red-700 dark:text-red-400',
    badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  },
}

function BudgetAdditionRow({ addition }: { addition: BudgetAddition }) {
  const config = BUDGET_TYPE_CONFIG[addition.type]

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount)

  return (
    <div className={`shadow-sm border rounded-lg ${config.bgClass} ${config.borderClass}`}>
      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-4 p-5">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${config.bgClass}`}>
            <span role="img" aria-label={config.label}>{config.icon}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                {config.label}
              </span>
              <p className="text-lg font-medium text-gray-900 dark:text-white truncate mt-0.5">
                {addition.source}
              </p>
              {addition.comments && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {addition.comments}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {formatDate(addition.date)}
              </p>
              <p className={`text-2xl font-bold whitespace-nowrap ${config.amountClass}`}>
                {config.sign}{formatAmount(addition.amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${config.bgClass}`}>
              <span role="img" aria-label={config.label}>{config.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                {config.label}
              </span>
              <p className="text-base font-medium text-gray-900 dark:text-white truncate mt-0.5">
                {addition.source}
              </p>
            </div>
          </div>
          <p className={`text-xl font-bold whitespace-nowrap flex-shrink-0 ${config.amountClass}`}>
            {config.sign}{formatAmount(addition.amount)}
          </p>
        </div>
        <div className="ml-13 space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            📅 {formatDate(addition.date)}
          </p>
          {addition.comments && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              💬 {addition.comments}
            </p>
          )}
        </div>
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
}: ExpenseListProps) {
  const BUDGET_FILTER = '__BUDGET_ADDITIONS__'
  const isBudgetFilter = filteredCategory === BUDGET_FILTER

  const filteredExpenses = isBudgetFilter || !filteredCategory
    ? isBudgetFilter ? [] : expenses
    : expenses.filter((expense) => expense.categoryId === filteredCategory)

  const visibleBudgetAdditions = (isBudgetFilter || !filteredCategory) ? budgetAdditions : []

  // Merge expenses + budget additions, sorted by date desc (createdAt as tiebreaker)
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

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
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

  const isEmpty = allItems.length === 0

  return (
    <div className="mt-6">
      {isEmpty ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-orange-600 dark:text-orange-400 font-semibold text-lg">
            {isBudgetFilter
              ? 'No hay adiciones de presupuesto'
              : filteredCategory
                ? 'No hay gastos en esta categoría'
                : 'No hay movimientos registrados'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            {isBudgetFilter
              ? 'Agrega un ingreso, ajuste o deducción'
              : filteredCategory
                ? 'Intenta seleccionar otra categoría'
                : 'Comienza agregando presupuesto o un gasto'}
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-blue-600 dark:text-blue-400 font-bold uppercase text-center text-lg pb-2 border-b-2 border-blue-400 dark:border-blue-500">
              Listado de movimientos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
              {isBudgetFilter ? (
                <>{visibleBudgetAdditions.length} adición{visibleBudgetAdditions.length !== 1 ? 'es' : ''} de presupuesto</>
              ) : (
                <>
                  {filteredExpenses.length} gasto{filteredExpenses.length !== 1 ? 's' : ''}
                  {visibleBudgetAdditions.length > 0 && (
                    <> · {visibleBudgetAdditions.length} adición{visibleBudgetAdditions.length !== 1 ? 'es' : ''} de presupuesto</>
                  )}
                  {filteredCategory && filteredExpenses[0] && (
                    <> en <span className="font-semibold">{filteredExpenses[0].category.name}</span></>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Unified list */}
          <div className="space-y-3">
            {allItems.map((item) =>
              item.kind === 'expense' ? (
                <ExpenseDetail
                  key={`expense-${item.data.id}`}
                  expense={item.data}
                  onEdit={() => onEditExpense(item.data)}
                  onDelete={() => onDeleteExpense(item.data.id)}
                />
              ) : (
                <BudgetAdditionRow key={`budget-${item.data.id}`} addition={item.data} />
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}
