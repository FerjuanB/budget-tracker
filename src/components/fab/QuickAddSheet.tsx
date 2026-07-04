'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCategories, useCreateExpense, useCurrentPeriod, useExpenses, Category as CategoryType } from '@/hooks/useBudgetData'
import BottomSheet from './shared/BottomSheet'
import { resolveCategoryIcon } from '@/components/CategoryIcon'

interface QuickAddSheetProps {
  onSuccess?: () => void
  onBack?: () => void
}

interface CategoryOption {
  id: string
  name: string
  icon: string
  countThisPeriod: number
  countTotal: number
}

/**
 * Fast expense entry: amount + category in 3 seconds.
 * Categories are sorted by usage: most-used this period first,
 * then by historical count, then unused ones.
 */
export default function QuickAddSheet({ onSuccess, onBack }: QuickAddSheetProps) {
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [showNameField, setShowNameField] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [error, setError] = useState('')

  const { data: categories } = useCategories()
  const { data: currentPeriod } = useCurrentPeriod()
  const { data: expenses } = useExpenses(currentPeriod?.id || '')
  const createExpense = useCreateExpense()

  // Sort categories by usage in current period, then by historical count
  const sortedCategories: CategoryOption[] = useMemo(() => {
    if (!categories) return []

    // Count expenses per category in the current period
    const thisPeriodCount: Record<string, number> = {}
    if (expenses) {
      for (const exp of expenses) {
        thisPeriodCount[exp.categoryId] = (thisPeriodCount[exp.categoryId] || 0) + 1
      }
    }

    return (categories as (CategoryType & { _count?: { expenses: number } })[])
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        countThisPeriod: thisPeriodCount[cat.id] || 0,
        countTotal: cat._count?.expenses || 0,
      }))
      .sort((a, b) => {
        // Primary: this period count (desc)
        if (b.countThisPeriod !== a.countThisPeriod) {
          return b.countThisPeriod - a.countThisPeriod
        }
        // Secondary: historical total count (desc)
        if (b.countTotal !== a.countTotal) {
          return b.countTotal - a.countTotal
        }
        // Tie-breaker: name alphabetical
        return a.name.localeCompare(b.name)
      })
  }, [categories, expenses])

  // Show top 7 in the grid + 1 fixed "Elegir Categoría" button (8 total)
  const topCategories = sortedCategories.slice(0, 7)

  // All categories sorted alphabetically for the picker
  const allCategoriesSorted = useMemo(() => {
    if (!categories) return []
    return [...(categories as CategoryType[])].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [categories])

  // Whether the selected category is visible in the top-7 grid
  const selectedNotInTop = categoryId && !topCategories.some((c) => c.id === categoryId)

  // Reset on open
  useEffect(() => {
    setAmount('')
    setCategoryId('')
    setName('')
    setShowNameField(false)
    setShowCategoryPicker(false)
    setError('')
  }, [])

  const canSubmit =
    amount && parseFloat(amount) > 0 && categoryId && currentPeriod && !createExpense.isPending

  async function handleSubmit() {
    if (!canSubmit || !currentPeriod) return

    const category = categories?.find((c: any) => c.id === categoryId)
    const expenseName = name.trim() || category?.name || 'Gasto rápido'
    const parsedAmount = parseFloat(amount)

    try {
      await createExpense.mutateAsync({
        periodId: currentPeriod.id,
        expenseName,
        amount: parsedAmount,
        categoryId,
        date: new Date().toISOString(),
      })

      // Success: reset and close
      setAmount('')
      setCategoryId('')
      setName('')
      setShowNameField(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al guardar gasto')
    }
  }

  const remaining = currentPeriod?.summary?.remainingBudget
  const overBudget = amount && parseFloat(amount) > (remaining || 0)

  return (
    <div className="px-1 pb-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-[var(--color-label-secondary)] text-sm"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          ← Volver
        </button>
        <span className="w-16" />
      </div>

      <h2 className="heading text-[22px] mb-5 flex items-center gap-2">
        <span>⚡</span>
        <span>Gasto rápido</span>
      </h2>

      {/* Amount input */}
      <div className="mb-5">
        <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
          Monto
        </label>
        <div className="flex items-center gap-2 bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-4">
          <span className="text-xl text-[var(--color-label-secondary)]">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            placeholder="0"
            className="amount bg-transparent flex-1 text-4xl outline-none placeholder:text-[var(--color-label-quaternary)]"
          />
        </div>

        {/* Live feedback */}
        {amount && parseFloat(amount) > 0 && (
          <div className={`mt-2 text-xs ${overBudget ? 'text-[var(--color-destructive)]' : 'text-[var(--color-success)]'}`}>
            {overBudget
              ? `⚠️ Supera el disponible ($${remaining?.toLocaleString() || 'N/A'})`
              : `✓ Quedarían $${((remaining || 0) - parseFloat(amount)).toLocaleString()}`
            }
          </div>
        )}
      </div>

      {/* Category grid - sorted by usage */}
      <div className="mb-5">
        <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
          Categoría
          <span className="ml-1 normal-case tracking-normal text-[10px]">
            (ordenadas por uso)
          </span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {topCategories.map((cat) => {
            const isSelected = categoryId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className="fab-tap p-2 rounded-[var(--radius-md)] transition-all flex flex-col items-center justify-center min-h-[70px]"
                style={{
                  background: isSelected ? 'var(--color-accent)' : 'var(--color-surface-quaternary)',
                  color: isSelected ? '#fff' : 'var(--color-label-primary)',
                }}
              >
                <div className="text-xl">{cat.icon}</div>
                <div
                  className="text-[10px] mt-1 truncate w-full text-center leading-tight"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {cat.name}
                </div>
                {cat.countThisPeriod > 0 && (
                  <div
                    className="text-[9px] mt-0.5 opacity-60"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {cat.countThisPeriod}×
                  </div>
                )}
              </button>
            )
          })}

          {/* Fixed "Elegir Categoría" button — always visible as the 8th slot */}
          <button
            type="button"
            onClick={() => setShowCategoryPicker(true)}
            className="fab-tap p-2 rounded-[var(--radius-md)] transition-all flex flex-col items-center justify-center min-h-[70px]"
            style={{
              background: selectedNotInTop ? 'var(--color-accent)' : 'transparent',
              border: selectedNotInTop ? 'none' : '1.5px dashed var(--color-label-tertiary)',
              color: selectedNotInTop ? '#fff' : 'var(--color-label-secondary)',
            }}
          >
            <div className="text-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div
              className="text-[10px] mt-1 text-center leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Elegir
            </div>
          </button>
        </div>

        {/* Feedback chip: selected category not in top 7 */}
        {selectedNotInTop && (() => {
          const cat = (categories as CategoryType[] | undefined)?.find((c) => c.id === categoryId)
          if (!cat) return null
          const { color } = resolveCategoryIcon(cat.name, cat.icon)
          return (
            <div
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: `${color}1A`,
                color: color,
                fontFamily: 'var(--font-heading)',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <button
                type="button"
                onClick={() => setCategoryId('')}
                className="ml-0.5 opacity-60 hover:opacity-100"
                aria-label="Quitar categoría"
              >
                ✕
              </button>
            </div>
          )
        })()}

        {sortedCategories.length > 0 && (
          <div className="text-[10px] text-[var(--color-label-secondary)] mt-2 text-center">
            Mostrando las {Math.min(7, sortedCategories.length)} categorías más usadas del período
          </div>
        )}
      </div>

      {/* Category Picker — nested bottom sheet with ALL categories */}
      <BottomSheet
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        maxHeight={0.7}
      >
        <div className="px-1 pb-4">
          <h3 className="heading text-[18px] mb-4">Elegir categoría</h3>
          <div className="grid grid-cols-4 gap-2">
            {allCategoriesSorted.map((cat) => {
              const isSelected = categoryId === cat.id
              const { icon: resolvedIcon, color } = resolveCategoryIcon(cat.name, cat.icon)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id)
                    setShowCategoryPicker(false)
                  }}
                  className="fab-tap p-2 rounded-[var(--radius-md)] transition-all flex flex-col items-center justify-center min-h-[70px]"
                  style={{
                    background: isSelected ? 'var(--color-accent)' : 'var(--color-surface-quaternary)',
                    color: isSelected ? '#fff' : 'var(--color-label-primary)',
                  }}
                >
                  <div
                    className="flex items-center justify-center overflow-hidden"
                    style={{ width: 20, height: 20, color: isSelected ? '#fff' : color }}
                  >
                    <div style={{ width: 20, height: 20 }}>{resolvedIcon}</div>
                  </div>
                  <div
                    className="text-[10px] mt-1 truncate w-full text-center leading-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {cat.name}
                  </div>
                </button>
              )
            })}
          </div>
          {allCategoriesSorted.length === 0 && (
            <div className="text-center text-sm text-[var(--color-label-secondary)] py-8">
              No hay categorías disponibles
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Optional name field */}
      {!showNameField ? (
        <button
          onClick={() => setShowNameField(true)}
          className="text-[var(--color-accent)] text-sm mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          + Añadir descripción (opcional)
        </button>
      ) : (
        <div className="mb-4">
          <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
            Descripción
          </label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Supermercado, YPF..."
            className="w-full bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-3 outline-none"
          />
        </div>
      )}

      {error && (
        <div className="mb-3 text-xs text-[var(--color-destructive)] bg-[var(--color-destructive)]10 p-3 rounded-[var(--radius-sm)]">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="fab-tap w-full py-4 rounded-[var(--radius-md)] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'var(--color-accent)',
          fontFamily: 'var(--font-heading)',
          fontSize: 17,
        }}
      >
        {createExpense.isPending ? 'Guardando...' : 'Agregar gasto'}
      </button>
    </div>
  )
}
