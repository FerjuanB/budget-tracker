'use client'

import { useState } from 'react'
import { useCategories, Category } from '@/hooks/useBudgetData'
import {
  useCreateRecurring,
  RecurrenceFrequency,
} from '@/hooks/useRecurring'

interface RecurringFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

type FrequencyOption = {
  value: RecurrenceFrequency
  label: string
  description: string
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'MONTHLY', label: 'Mensual', description: 'Una vez por mes' },
  { value: 'BIMONTHLY', label: 'Bimensual', description: 'Cada 2 meses (puede tener cuotas)' },
  { value: 'QUARTERLY', label: 'Trimestral', description: 'Cada 3 meses' },
  { value: 'YEARLY', label: 'Anual', description: 'Una vez por año' },
]

/**
 * Form to create a new recurring expense.
 * Supports: fixed monthly (Netflix), bimensual with installments (Edenor), variable (Visa).
 */
export default function RecurringForm({ onSuccess, onCancel }: RecurringFormProps) {
  const { data: categories } = useCategories()
  const createMutation = useCreateRecurring()

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [icon, setIcon] = useState('')
  const [baseAmount, setBaseAmount] = useState('')
  const [isVariable, setIsVariable] = useState(false)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('MONTHLY')
  const [dayOfMonth, setDayOfMonth] = useState<string>('')
  const [splitInto, setSplitInto] = useState<number>(1)
  const [error, setError] = useState('')

  const selectedCategory = categories?.find((c: any) => c.id === categoryId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Ingresá un nombre')
    if (!categoryId) return setError('Elegí una categoría')
    if (!isVariable && (!baseAmount || parseFloat(baseAmount) <= 0))
      return setError('Ingresá un monto válido')
    if (!dayOfMonth) return setError('Elegí un día del mes')

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        categoryId,
        icon: icon || selectedCategory?.icon || '🔁',
        baseAmount: isVariable ? 0 : parseFloat(baseAmount),
        isVariable,
        frequency,
        dayOfMonth: parseInt(dayOfMonth),
        splitInto: frequency === 'BIMONTHLY' ? splitInto : 1,
        everyNMonths: frequency === 'BIMONTHLY' ? 2 : frequency === 'QUARTERLY' ? 3 : frequency === 'YEARLY' ? 12 : 1,
      })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al crear')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="heading text-[22px] flex items-center gap-2">
        <span>➕</span>
        <span>Nuevo recurrente</span>
      </h2>

      {/* Name */}
      <div>
        <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Netflix, EPE, Aguas..."
          className="w-full bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-3 outline-none"
          autoFocus
        />
      </div>

      {/* Category + Icon */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-4">
          <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
            Categoría
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-3 py-3 outline-none"
          >
            <option value="">Elegir...</option>
            {categories?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
            Icono
          </label>
          <input
            type="text"
            value={icon || selectedCategory?.icon || ''}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🎬"
            className="w-full bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-2 py-3 text-center outline-none"
          />
        </div>
      </div>

      {/* Variable toggle */}
      <div className="flex items-center justify-between p-3 bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)]">
        <div>
          <div className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
            Monto variable
          </div>
          <div className="text-xs text-[var(--color-label-secondary)]">
            Pedirme el monto cada mes (ej: Visa)
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsVariable(!isVariable)}
          className="relative w-12 h-6 rounded-full transition-colors"
          style={{
            background: isVariable ? 'var(--color-accent)' : 'rgba(120, 120, 128, 0.3)',
          }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm"
            style={{
              transform: isVariable ? 'translateX(26px)' : 'translateX(2px)',
            }}
          />
        </button>
      </div>

      {/* Amount (only if fixed) */}
      {!isVariable && (
        <div>
          <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
            Monto base
          </label>
          <div className="flex items-center gap-2 bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-3">
            <span className="text-lg text-[var(--color-label-secondary)]">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              placeholder="0"
              className="amount bg-transparent flex-1 text-2xl outline-none"
            />
          </div>
        </div>
      )}

      {/* Frequency */}
      <div>
        <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
          Frecuencia
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFrequency(opt.value)}
              className="p-3 rounded-[var(--radius-md)] text-left transition-all"
              style={{
                background: frequency === opt.value ? 'var(--color-accent)' : 'var(--color-surface-quaternary)',
                color: frequency === opt.value ? '#fff' : 'var(--color-label-primary)',
              }}
            >
              <div className="font-medium text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                {opt.label}
              </div>
              <div className="text-[10px] opacity-70">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Day of month */}
      <div>
        <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
          Día del mes (del 1 al 28)
        </label>
        <input
          type="number"
          min={1}
          max={28}
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          placeholder="10"
          className="w-full bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-3 outline-none"
        />
      </div>

      {/* Split into installments (bimensual only) */}
      {frequency === 'BIMONTHLY' && (
        <div>
          <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
            Cantidad de cuotas (por emisión)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSplitInto(n)}
                className="p-3 rounded-[var(--radius-md)] font-semibold"
                style={{
                  background: splitInto === n ? 'var(--color-accent)' : 'var(--color-surface-quaternary)',
                  color: splitInto === n ? '#fff' : 'var(--color-label-primary)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {n} cuota{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-[var(--color-label-secondary)] mt-2">
            Ej: EPE cada 2 meses con monto dividido en 2 cuotas iguales.
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-[var(--color-destructive)] bg-[var(--color-destructive)10] p-3 rounded-[var(--radius-sm)]">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 rounded-[var(--radius-md)] font-medium"
          style={{
            background: 'var(--color-surface-quaternary)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex-1 py-4 rounded-[var(--radius-md)] font-semibold text-white disabled:opacity-40"
          style={{
            background: 'var(--color-accent)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {createMutation.isPending ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
