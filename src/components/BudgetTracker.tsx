'use client'

import { useCurrentPeriod, useExpenses, BudgetPeriod } from '@/hooks/useBudgetData'
import ClosePeriodDialog from './ClosePeriodDialog'
import { useState } from 'react'

interface BudgetTrackerProps {
  selectedPeriod?: BudgetPeriod | null
}

export default function BudgetTracker({ selectedPeriod }: BudgetTrackerProps) {
  const { data: currentPeriod, isLoading } = useCurrentPeriod()
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  
  const period = selectedPeriod || currentPeriod
  const { data: expenses } = useExpenses(period?.id || '')
  
  // Parse summary from period or summaryJson
  let summary = period?.summary
  if (period && !summary && period.summaryJson) {
    try {
      const parsedSummary = JSON.parse(period.summaryJson)
      summary = {
        totalBudget: parsedSummary.budget?.totalBudget || 0,
        totalIncome: parsedSummary.budget?.totalIncome || 0,
        totalAdjustments: parsedSummary.budget?.totalAdjustments || 0,
        totalDeductions: parsedSummary.budget?.totalDeductions || 0,
        totalExpenses: parsedSummary.expenses?.total || 0,
        remainingBudget: parsedSummary.result?.remainingBudget || 0,
        durationDays: parsedSummary.period?.durationDays || 0,
        budgetStatus: 'safe' as const,
        percentageUsed: parsedSummary.result?.percentageUsed || 0,
      }
    } catch (error) {
      console.error('Error parsing summaryJson:', error)
    }
  }
  
  // Calculate current day
  const currentDay = period?.startDate 
    ? Math.floor((Date.now() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0
  
  // Calculate today's spending
  const today = new Date().toISOString().split('T')[0]
  const todaysExpenses = expenses?.filter(e => 
    new Date(e.date).toISOString().split('T')[0] === today
  ) || []
  const todaysTotal = todaysExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  
  // Calculate average daily spending
  const avgDaily = summary && currentDay > 0 
    ? Math.round(summary.totalExpenses / currentDay)
    : 0

  if (isLoading || !period) {
    return (
      <div className="px-5 py-4 space-y-4">
        <div className="h-12 bg-[var(--color-label-quaternary)] rounded-[var(--radius-md)] animate-pulse"></div>
        <div className="h-16 bg-[var(--color-label-quaternary)] rounded-[var(--radius-md)] animate-pulse"></div>
        <div className="h-3 bg-[var(--color-label-quaternary)] rounded-full"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-[var(--color-label-secondary)] text-sm">
          No hay información de presupuesto disponible
        </p>
      </div>
    )
  }

  const percentage = summary.percentageUsed || 0
  const segmentCount = 16
  const filledSegments = Math.min(Math.floor((percentage / 100) * segmentCount), segmentCount)

  // Determine badge color based on percentage
  const getStatusBadge = () => {
    let bgColor: string
    let textColor: string
    let text: string

    if (summary.remainingBudget < 0) {
      bgColor = 'rgba(179, 74, 60, 0.14)'
      textColor = '#B34A3C'
      text = 'Presupuesto excedido'
    } else if (percentage >= 90) {
      bgColor = 'rgba(179, 74, 60, 0.14)'
      textColor = '#B34A3C'
      text = '¡Cuidado! Casi agotado'
    } else if (percentage >= 75) {
      bgColor = 'rgba(196, 120, 43, 0.14)'
      textColor = '#C4782B'
      text = 'Ten precaución'
    } else if (percentage >= 50) {
      bgColor = 'rgba(107, 142, 95, 0.14)'
      textColor = '#6B8E5F'
      text = 'Vas bien'
    } else {
      bgColor = 'rgba(107, 142, 95, 0.14)'
      textColor = '#6B8E5F'
      text = '¡Excelente!'
    }

    return { bgColor, textColor, text }
  }

  const { bgColor, textColor, text: statusText } = getStatusBadge()

  // Determine segment colors
  const getSegmentColor = (index: number) => {
    if (index >= filledSegments) return 'var(--color-label-quaternary)'
    if (percentage >= 90) return '#B34A3C'
    if (percentage >= 75) return '#C4782B'
    if (percentage >= 50) return '#E8B478'
    return '#6B8E5F'
  }

  return (
    <>
      <section className="px-5 pt-4 pb-6">
        {/* Hero Balance */}
        <div className="mb-1">
          <div className="text-[var(--color-label-secondary)] text-xs font-medium mb-1">
            Quedan
          </div>
          <div 
            className="text-[52px] font-bold leading-none amount"
            style={{ letterSpacing: '-0.03em' }}
          >
            ${summary.remainingBudget.toLocaleString('es-AR')}
          </div>
          <div className="text-[var(--color-label-secondary)] text-sm mt-1">
            de <strong className="text-[var(--color-label-primary)] font-semibold">
              ${summary.totalBudget.toLocaleString('es-AR')}
            </strong>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="flex gap-1 h-[10px] rounded-md overflow-hidden mt-5 mb-4">
          {Array.from({ length: segmentCount }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                background: getSegmentColor(i),
                transition: 'background 300ms ease-out',
              }}
            />
          ))}
        </div>

        {/* Status Row: Badge + Close Button */}
        <div className="flex justify-between items-center mb-2">
          {/* Status Badge */}
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: bgColor, color: textColor }}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: textColor }}
            />
            {statusText} · {Math.min(percentage, 100).toFixed(0)}% usado
          </div>

          {/* Close Period Button (only for active periods) */}
          {period.status === 'ACTIVE' && currentPeriod && (
            <button
              onClick={() => setShowCloseDialog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-destructive)] text-white transition-transform"
              style={{ transform: 'scale(1)', fontFamily: 'var(--font-heading)' }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Cerrar período
            </button>
          )}
        </div>

        {/* Day Counter */}
        <div className="text-[var(--color-label-tertiary)] text-xs font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
          Día {currentDay}
        </div>
      </section>

      {/* Stats Cards */}
      <section className="px-5 pb-6 grid grid-cols-2 gap-3">
        <div 
          className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] p-3.5"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="text-[var(--color-label-secondary)] text-[10px] font-semibold uppercase tracking-wider mb-1">
            Hoy
          </div>
          <div className="text-xl font-bold amount leading-tight">
            ${todaysTotal.toLocaleString('es-AR')}
          </div>
        </div>

        <div 
          className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] p-3.5"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="text-[var(--color-label-secondary)] text-[10px] font-semibold uppercase tracking-wider mb-1">
            Promedio diario
          </div>
          <div className="text-xl font-bold amount leading-tight">
            ${avgDaily.toLocaleString('es-AR')}
          </div>
        </div>
      </section>

      {/* Close Period Dialog (shared component) */}
      <ClosePeriodDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
      />
    </>
  )
}
