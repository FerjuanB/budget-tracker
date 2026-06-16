'use client'

import { ReactNode } from 'react'

interface ActionCardProps {
  icon: string
  iconBg: string
  iconColor: string
  title: string
  description: string
  accentColor: string
  onClick: () => void
  children?: ReactNode
}

/**
 * Big call-to-action card in the Action Sheet (Option 2 FAB design).
 * iOS HIG inspired: color-coded, descriptive, large tap target.
 */
function ActionCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  accentColor,
  onClick,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="fab-tap w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg)] text-left active:scale-[0.98] transition-transform"
      style={{
        background: iconBg,
        border: `1px solid ${iconColor}20`,
      }}
    >
      <div
        className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-2xl"
        style={{ background: iconColor, color: '#fff' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold" style={{ color: iconColor, fontFamily: 'var(--font-heading)' }}>
          {title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#666' }}>
          {description}
        </div>
      </div>
      <div style={{ color: iconColor, fontSize: 22 }}>›</div>
    </button>
  )
}

interface ActionSheetProps {
  onQuickAdd: () => void
  onOcr: () => void
  onRecurring: () => void
  onCancel: () => void
}

/**
 * First bottom-sheet that appears when tapping the FAB.
 * Three big colored cards describing what the user wants to add.
 */
export default function ActionSheet({ onQuickAdd, onOcr, onRecurring, onCancel }: ActionSheetProps) {
  return (
    <div className="px-1 pb-4">
      <h2 className="heading text-[22px] mb-1">¿Qué querés agregar?</h2>
      <p className="text-sm text-[var(--color-label-secondary)] mb-5">Elegí una opción</p>

      <div className="space-y-3">
        <ActionCard
          icon="⚡"
          iconBg="#34c75912"
          iconColor="#34c759"
          title="Gasto rápido"
          description="Monto, categoría y listo en 3 segundos"
          accentColor="#34c759"
          onClick={onQuickAdd}
        />

        <ActionCard
          icon="📷"
          iconBg="#ff950012"
          iconColor="#ff9500"
          title="Foto del ticket"
          description="Escaneamos los datos con IA"
          accentColor="#ff9500"
          onClick={onOcr}
        />

        {/* Recurring expenses — disabled until cron generation is implemented.
            Kept in code as placeholder. To re-enable: also uncomment the
            RecurringSheet import + BottomSheet in FloatingAddButton.tsx and
            uncomment the onRecurring handler there.
        <ActionCard
          icon="🔁"
          iconBg="#af52de12"
          iconColor="#af52de"
          title="Gasto recurrente"
          description="Netflix, Visa, Edenor... agregar automático"
          accentColor="#af52de"
          onClick={onRecurring}
        />
        */}
      </div>

      <button
        onClick={onCancel}
        className="w-full mt-5 py-3 text-[var(--color-label-secondary)] text-sm font-medium"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Cancelar
      </button>
    </div>
  )
}
