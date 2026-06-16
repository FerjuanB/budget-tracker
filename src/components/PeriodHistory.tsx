'use client'

import { useState } from 'react'
import { usePeriods, useExpenses, useBudgetAdditions, BudgetPeriod } from '@/hooks/useBudgetData'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import FilterByCategory from './FilterByCategory'
import ExpenseList from './ExpenseList'

export default function PeriodHistory() {
  const { data: allPeriods, isLoading: loadingPeriods } = usePeriods()
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [filteredCategory, setFilteredCategory] = useState('')

  // Filtrar solo períodos cerrados
  const closedPeriods = allPeriods?.filter(p => p.status === 'CLOSED') || []

  // Cargar datos del período seleccionado
  const selectedPeriod = closedPeriods.find(p => p.id === selectedPeriodId)
  const { data: expenses, isLoading: loadingExpenses } = useExpenses(selectedPeriodId || '')
  const { data: budgetAdditions, isLoading: loadingBudgets } = useBudgetAdditions(selectedPeriodId || '')

  const isPeriodExpanded = (id: string) => selectedPeriodId === id

  const togglePeriod = (id: string) => {
    if (selectedPeriodId === id) {
      setSelectedPeriodId(null)
      setFilteredCategory('')
    } else {
      setSelectedPeriodId(id)
    }
  }

  if (loadingPeriods) {
    return (
      <div className="px-5 py-8 space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] p-4"
            style={{ background: 'var(--color-surface-elevated)' }}
          >
            <div className="h-16 bg-[var(--color-label-quaternary)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (closedPeriods.length === 0) {
    return (
      <div className="px-5 py-16 flex flex-col items-center justify-center text-center">
        <div
          className="flex items-center justify-center mb-4"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--color-surface-quaternary)',
            color: 'var(--color-label-secondary)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h3
          className="heading text-xl mb-1"
          style={{ color: 'var(--color-label-primary)' }}
        >
          Sin historial
        </h3>
        <p
          className="text-sm max-w-[280px]"
          style={{ color: 'var(--color-label-secondary)', lineHeight: '1.5' }}
        >
          Cuando cierres un período aparecerá aquí para consultarlo
        </p>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 space-y-3">
      <h2 className="heading text-2xl mb-4" style={{ color: 'var(--color-label-primary)' }}>
        Historial
      </h2>

      {closedPeriods.map(period => {
        const isExpanded = isPeriodExpanded(period.id)
        const summary = period.summary

        return (
          <div key={period.id}>
            {/* Period Card */}
            <button
              onClick={() => togglePeriod(period.id)}
              className="w-full rounded-[var(--radius-lg)] p-4 text-left transition-all"
              style={{
                background: 'var(--color-surface-elevated)',
                boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                border: isExpanded ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Period name */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="heading text-base truncate"
                      style={{ color: 'var(--color-label-primary)' }}
                    >
                      {format(new Date(period.startDate), 'MMMM yyyy', { locale: es })}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: 'var(--color-label-quaternary)',
                        color: 'var(--color-label-secondary)',
                      }}
                    >
                      Cerrado
                    </span>
                  </div>

                  {/* Summary stats */}
                  {summary && (
                    <div className="flex items-baseline gap-4 text-sm">
                      <div>
                        <div style={{ color: 'var(--color-label-tertiary)', fontSize: 11 }}>
                          Ingresos
                        </div>
                        <div
                          className="amount font-semibold"
                          style={{ color: '#6B8E5F' }}
                        >
                          ${summary.totalIncome.toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-label-tertiary)', fontSize: 11 }}>
                          Gastos
                        </div>
                        <div
                          className="amount font-semibold"
                          style={{ color: 'var(--color-label-primary)' }}
                        >
                          ${summary.totalExpenses.toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-label-tertiary)', fontSize: 11 }}>
                          Resultado
                        </div>
                        <div
                          className="amount font-semibold"
                          style={{
                            color: summary.remainingBudget >= 0 ? '#6B8E5F' : '#B34A3C',
                          }}
                        >
                          ${summary.remainingBudget.toLocaleString('es-AR')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expand icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 transition-transform"
                  style={{
                    color: 'var(--color-label-tertiary)',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </button>

            {/* Expanded content: filters + expenses */}
            {isExpanded && selectedPeriodId === period.id && (
              <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Filters */}
                <FilterByCategory
                  selectedCategory={filteredCategory}
                  onFilterChange={setFilteredCategory}
                  onAddIncome={() => {}} // No se puede agregar en períodos cerrados
                  hideAddButton={true}
                />

                {/* Expense list (solo lectura) */}
                <ExpenseList
                  expenses={expenses || []}
                  budgetAdditions={budgetAdditions || []}
                  isLoading={loadingExpenses || loadingBudgets}
                  filteredCategory={filteredCategory}
                  onEditExpense={() => {}} // No se puede editar en períodos cerrados
                  onDeleteExpense={() => {}} // No se puede eliminar en períodos cerrados
                  readOnly={true}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
