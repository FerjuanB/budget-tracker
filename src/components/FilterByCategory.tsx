'use client'

import { useMemo } from 'react'
import { useCategories, useCurrentPeriod, useExpenses } from '@/hooks/useBudgetData'

interface FilterByCategoryProps {
  selectedCategory: string
  onFilterChange: (categoryId: string) => void
  /**
   * Callback when the "+" pill is tapped → should open the income form.
   * This is the new way to add budget additions (replaces the legacy buttons)
   */
  onAddIncome?: () => void
}

/**
 * Horizontal scrollable filter pills (iOS-style).
 * 
 * Replaces the legacy dropdown. Each pill shows:
 * - Category name (no emojis, per user request)
 * - Expense count badge
 * 
 * Final pill is a circular "+" to add income.
 */
export default function FilterByCategory({
  selectedCategory,
  onFilterChange,
  onAddIncome,
}: FilterByCategoryProps) {
  const { data: categories, isLoading } = useCategories()
  const { data: currentPeriod } = useCurrentPeriod()
  const { data: expenses } = useExpenses(currentPeriod?.id || '')

  // Count expenses per category in the current period
  const counts = useMemo(() => {
    const result: Record<string, number> = {
      __ALL__: 0,
      __BUDGET_ADDITIONS__: 0,
    }
    
    if (!expenses) return result
    
    for (const exp of expenses) {
      result[exp.categoryId] = (result[exp.categoryId] || 0) + 1
      result.__ALL__++
    }
    
    return result
  }, [expenses])

  if (isLoading) {
    return (
      <div className="px-5 py-3 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 w-24 rounded-full bg-[var(--color-label-quaternary)] animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    )
  }

  const handlePillTap = (value: string) => {
    // Toggle off if already selected
    onFilterChange(selectedCategory === value ? '' : value)
  }

  return (
    <section
      className="overflow-x-auto scrollbar-hide"
      style={{ paddingTop: 8, paddingBottom: 12 }}
    >
      <div className="flex gap-2 items-center whitespace-nowrap" style={{ paddingLeft: 20, paddingRight: 20 }}>
        {/* "Todos" pill */}
        <button
          onClick={() => handlePillTap('')}
          className={`
            flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all
            active:scale-95
          `}
          style={{
            background: selectedCategory === '' ? 'var(--color-label-primary)' : 'var(--color-surface-primary)',
            color: selectedCategory === '' ? 'var(--color-surface-primary)' : 'var(--color-label-primary)',
            borderColor: selectedCategory === '' ? 'var(--color-label-primary)' : 'var(--color-separator)',
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Todos
          <span
            className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              background: selectedCategory === '' ? 'rgba(255, 255, 255, 0.2)' : 'var(--color-surface-quaternary)',
              color: selectedCategory === '' ? 'white' : 'var(--color-label-secondary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {counts.__ALL__}
          </span>
        </button>

        {/* Income (budget additions) pill */}
        <button
          onClick={() => handlePillTap('__BUDGET_ADDITIONS__')}
          className={`
            flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all
            active:scale-95
          `}
          style={{
            background: selectedCategory === '__BUDGET_ADDITIONS__' ? 'var(--color-label-primary)' : 'var(--color-surface-primary)',
            color: selectedCategory === '__BUDGET_ADDITIONS__' ? 'var(--color-surface-primary)' : 'var(--color-label-primary)',
            borderColor: selectedCategory === '__BUDGET_ADDITIONS__' ? 'var(--color-label-primary)' : 'var(--color-separator)',
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Ingresos
        </button>

        {/* Category pills */}
        {categories?.map((category: any) => {
          const isActive = selectedCategory === category.id
          const count = counts[category.id] || 0
          return (
            <button
              key={category.id}
              onClick={() => handlePillTap(category.id)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all
                active:scale-95
              `}
              style={{
                background: isActive ? 'var(--color-label-primary)' : 'var(--color-surface-primary)',
                color: isActive ? 'var(--color-surface-primary)' : 'var(--color-label-primary)',
                borderColor: isActive ? 'var(--color-label-primary)' : 'var(--color-separator)',
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {category.name}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--color-surface-quaternary)',
                    color: isActive ? 'white' : 'var(--color-label-secondary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}

        {/* Add income pill (+) */}
        {currentPeriod?.status === 'ACTIVE' && onAddIncome && (
          <button
            onClick={onAddIncome}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: 'var(--color-accent)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.25)',
            }}
            title="Agregar ingreso"
            aria-label="Agregar ingreso"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}
