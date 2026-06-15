'use client'

import { useState } from 'react'
import {
  useRecurringExpenses,
  useDeleteRecurring,
  RecurringExpense,
} from '@/hooks/useRecurring'
import RecurringForm from './RecurringForm'

interface RecurringSheetProps {
  onBack?: () => void
}

/**
 * Formats a RecurringExpense into a compact description string.
 */
function formatRecurringDescription(r: RecurringExpense): string {
  if (r.isVariable) return 'Monto variable · pedirmelo cada mes'

  const parts: string[] = []

  // Frequency
  if (r.frequency === 'MONTHLY') parts.push('Mensual')
  else if (r.frequency === 'BIMONTHLY') parts.push('Bimensual')
  else if (r.frequency === 'QUARTERLY') parts.push('Trimestral')
  else if (r.frequency === 'YEARLY') parts.push('Anual')

  // Installments
  if (r.splitInto > 1) parts.push(`${r.splitInto} cuotas`)

  // Day
  if (r.dayOfMonth) parts.push(`Día ${r.dayOfMonth}`)

  return parts.join(' · ')
}

/**
 * The recurring expenses sheet: lists active recurring items
 * and shows pending instances that need action.
 */
export default function RecurringSheet({ onBack }: RecurringSheetProps) {
  const { data: recurringList, isLoading } = useRecurringExpenses(true)
  const deleteMutation = useDeleteRecurring()
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div className="px-1 pb-4">
        <RecurringForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      </div>
    )
  }

  // Collect pending instances across all recurring
  const allPendingInstances = (recurringList || [])
    .flatMap((r) =>
      (r.instances || []).map((inst) => ({
        ...inst,
        recurringName: r.name,
        recurringIcon: r.icon || r.category?.icon || '🔁',
        recurringId: r.id,
        isVariable: r.isVariable,
      }))
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const activeRecurring = (recurringList || []).filter((r) => r.isActive)

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
        <button
          onClick={() => setShowForm(true)}
          className="text-[var(--color-accent)] text-sm font-semibold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          + Nuevo
        </button>
      </div>

      <h2 className="heading text-[22px] flex items-center gap-2 mb-4">
        <span>🔁</span>
        <span>Recurrentes</span>
      </h2>

      {/* Pending instances banner */}
      {allPendingInstances.length > 0 && (
        <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-warning)]15 border border-[var(--color-warning)]30">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2 text-[var(--color-warning)]">
            Pendientes este mes ({allPendingInstances.length})
          </div>
          <div className="text-xs text-[var(--color-label-secondary)]">
            Próximamente: botón para aplicar/omitir desde acá. Por ahora se aplican automáticamente por cron.
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8 text-sm text-[var(--color-label-secondary)]">
          Cargando...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeRecurring.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔁</div>
          <div className="font-medium mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Sin recurrentes
          </div>
          <div className="text-xs text-[var(--color-label-secondary)]">
            Creá uno para servicios mensuales fijos como Netflix, Edenor, Visa...
          </div>
        </div>
      )}

      {/* List */}
      {activeRecurring.length > 0 && (
        <div className="space-y-2">
          {activeRecurring.map((r) => {
            const pendingCount = r.instances?.filter((i) => i.status === 'PENDING').length || 0
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-quaternary)]"
              >
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-purple)]20 flex items-center justify-center text-xl">
                  {r.icon || r.category?.icon || '🔁'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    {r.name}
                    {r.isVariable && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning)]20 text-[var(--color-warning)]">
                        Variable
                      </span>
                    )}
                    {r.splitInto > 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-purple)]20 text-[var(--color-purple)]">
                        {r.splitInto} cuotas
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-label-secondary)]">
                    {formatRecurringDescription(r)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold amount">
                    {r.isVariable ? (
                      <span className="text-xs text-[var(--color-warning)]">Variable</span>
                    ) : (
                      `$${Number(r.baseAmount).toLocaleString()}`
                    )}
                  </div>
                  {pendingCount > 0 && (
                    <div className="text-[10px] text-[var(--color-warning)] font-medium">
                      {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Helper tip */}
      {activeRecurring.length > 0 && (
        <div className="mt-5 p-3 rounded-[var(--radius-md)] bg-[var(--color-accent)]10 border border-[var(--color-accent)]20">
          <div className="text-[11px] text-[var(--color-label-secondary)] leading-relaxed">
            💡 Los gastos se generan automáticamente cada mes en su día correspondiente.
            Si el monto cambia, tocá un recurrente para editar el template.
          </div>
        </div>
      )}
    </div>
  )
}
