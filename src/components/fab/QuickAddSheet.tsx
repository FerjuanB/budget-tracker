'use client'

import { useState, useEffect } from 'react'
import { useCategories, useCreateExpense, useCurrentPeriod } from '@/hooks/useBudgetData'

interface QuickAddSheetProps {
  onSuccess?: () => void
  onBack?: () => void
}

interface CategoryOption {
  id: string
  name: string
  icon: string
}

/**
 * Fast expense entry: amount + category in 3 seconds.
 * Opens after choosing "Gasto rápido" from the Action Sheet.
 */
export default function QuickAddSheet({ onSuccess, onBack }: QuickAddSheetProps) {
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [showNameField, setShowNameField] = useState(false)
  const [error, setError] = useState('')

  const { data: categories } = useCategories()
  const { data: currentPeriod } = useCurrentPeriod()
  const createExpense = useCreateExpense()

  // Take top 8 categories (later: sort by usage frequency)
  const topCategories: CategoryOption[] = (categories || []).slice(0, 8)

  // Reset on open
  useEffect(() => {
    setAmount('')
    setCategoryId('')
    setName('')
    setShowNameField(false)
    setError('')
  }, [])

  const canSubmit =
    amount && parseFloat(amount) > 0 && categoryId && currentPeriod && !createExpense.isPending

  async function handleSubmit() {
    if (!canSubmit || !currentPeriod) return

    const category = categories?.find((c: any) => c.id === categoryId)
    const expenseName = name.trim() || category?.name || 'Gasto rápido'
    const parsedAmount = parseFloat(amount)

    // Allow overspend but warn
    if (currentPeriod.summary?.remainingBudget !== undefined) {
      if (parsedAmount > currentPeriod.summary.remainingBudget) {
        // Soft warning only — don't block
      }
    }

    try {
      await createExpense.mutateAsync({
        periodId: currentPeriod.id,
        expenseName,
        amount: parsedAmount,
        categoryId,
        date: new Date().toISOString(),
        // source: 'QUICK_ADD' handled by backend default if we add it
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
        <div
          className="flex items-center gap-2 bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-4"
        >
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

      {/* Category grid */}
      <div className="mb-5">
        <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
          Categoría
        </label>
        <div className="grid grid-cols-4 gap-2">
          {topCategories.map((cat) => {
            const isSelected = categoryId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className="fab-tap p-2 rounded-[var(--radius-md)] transition-all"
                style={{
                  background: isSelected ? 'var(--color-accent)' : 'var(--color-surface-quaternary)',
                  color: isSelected ? '#fff' : 'var(--color-label-primary)',
                }}
              >
                <div className="text-xl text-center">{cat.icon}</div>
                <div className="text-[10px] mt-1 truncate text-center" style={{ fontFamily: 'var(--font-heading)' }}>
                  {cat.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>

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
