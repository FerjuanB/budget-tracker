'use client'

import { ReactNode } from 'react'

interface ActionCardProps {
  icon: ReactNode
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
        className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center"
        style={{ background: iconColor, color: '#fff' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold" style={{ color: iconColor, fontFamily: 'var(--font-heading)' }}>
          {title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-label-secondary)' }}>
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
  onBudget: () => void
  onCancel: () => void
}

/**
 * First bottom-sheet that appears when tapping the FAB.
 * Three big colored cards describing what the user wants to add.
 */
export default function ActionSheet({ onQuickAdd, onOcr, onBudget, onCancel }: ActionSheetProps) {
  return (
    <div className="px-1 pb-4">
      <h2 className="heading text-[22px] mb-1">¿Qué querés agregar?</h2>
      <p className="text-sm text-[var(--color-label-secondary)] mb-5">Elegí una opción</p>

      <div className="space-y-3">
        <ActionCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
          iconBg="#34c75912"
          iconColor="#34c759"
          title="Gasto rápido"
          description="Monto, categoría y listo en 3 segundos"
          accentColor="#34c759"
          onClick={onQuickAdd}
        />

        <ActionCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          }
          iconBg="#ff950012"
          iconColor="#ff9500"
          title="Foto del ticket"
          description="Escaneamos los datos con IA"
          accentColor="#ff9500"
          onClick={onOcr}
        />

        <ActionCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          iconBg="#007aff12"
          iconColor="#007aff"
          title="Agregar ingreso"
          description="Sumá presupuesto al período actual"
          accentColor="#007aff"
          onClick={onBudget}
        />
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
