'use client'

import AmountDisplay from './AmountDisplay'
import BudgetBreakdown from './BudgetBreakdown'
import { useCurrentPeriod, useClosePeriod, BudgetPeriod } from '@/hooks/useBudgetData'

interface BudgetTrackerProps {
  selectedPeriod?: BudgetPeriod | null
}

export default function BudgetTracker({ selectedPeriod }: BudgetTrackerProps) {
  const { data: currentPeriod, isLoading } = useCurrentPeriod()
  const closePeriodMutation = useClosePeriod()
  
  // Use selected period if provided, otherwise fallback to current period
  const period = selectedPeriod || currentPeriod

  // For closed periods, try to get summary from summaryJson
  let summary = period?.summary
  let budgetItems: any[] = []
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
      // Extract budget items if available
      budgetItems = parsedSummary.budget?.items || []
    } catch (error) {
      console.error('Error parsing summaryJson:', error)
    }
  }
  
  const handleClosePeriod = async () => {
    if (!currentPeriod) return

    const confirmed = confirm(
      '¿Estás seguro de que deseas cerrar este período?\n\n' +
        'Se generará un resumen y no podrás agregar más gastos a este período. ' +
        'Se creará un nuevo período automáticamente.'
    )

    if (!confirmed) return

    try {
      await closePeriodMutation.mutateAsync(currentPeriod.id)
      alert('Período cerrado exitosamente')
    } catch (error: any) {
      alert(error.message || 'Error al cerrar período')
    }
  }

  if (isLoading || !period) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-center p-12">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-yellow-800 dark:text-yellow-200 text-center">
          No hay información de presupuesto disponible
        </p>
      </div>
    )
  }
  const percentage = summary.percentageUsed || 0

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 100) return '#dc2626' // red-600
    if (percentage >= 90) return '#ea580c' // orange-600
    if (percentage >= 75) return '#f59e0b' // amber-500
    if (percentage >= 50) return '#eab308' // yellow-500
    return '#22c55e' // green-500
  }

  const getBudgetStatus = () => {
    if (summary.remainingBudget < 0) return '¡Presupuesto excedido!'
    if (percentage >= 90) return '¡Cuidado! Casi agotado'
    if (percentage >= 75) return 'Ten precaución'
    if (percentage >= 50) return 'Vas bien'
    return '¡Excelente!'
  }

  const color = getColor()

  return (
    <div className="space-y-6">
      {/* Main Grid - Circular Progress and Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Circular Progress */}
        <div className="flex flex-col items-center justify-center space-y-6 bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          {/* Circle */}
          <div className="relative w-56 h-56">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                className="dark:stroke-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(percentage, 100) / 100)}`}
                className="transition-all duration-700 ease-in-out"
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {Math.min(percentage, 100).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gastado
              </span>
              <span
                className="text-xs font-semibold mt-2 px-3 py-1 rounded-full"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {getBudgetStatus()}
              </span>
            </div>
          </div>

          {/* Period info */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {period.status === 'ACTIVE' ? 'Período actual' : 'Período cerrado'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(period.startDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {summary.durationDays} día{summary.durationDays !== 1 ? 's' : ''}
            </p>
            {period.status === 'CLOSED' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                🔒 Cerrado
              </span>
            )}
          </div>
        </div>

        {/* Budget Summary & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          {/* Amount displays */}
          <div className="grid grid-cols-1 gap-4">
            <AmountDisplay
              label="Presupuesto Total"
              amount={summary.totalBudget}
              className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            />
            <AmountDisplay
              label="Disponible"
              amount={summary.remainingBudget}
              className={
                summary.remainingBudget < 0
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }
            />
            <AmountDisplay
              label="Gastado"
              amount={summary.totalExpenses}
              className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
            />
          </div>

          {/* Actions */}
          {period.status === 'ACTIVE' && currentPeriod ? (
            <button
              onClick={handleClosePeriod}
              disabled={closePeriodMutation.isPending}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 dark:bg-red-500 dark:hover:bg-red-600 dark:disabled:bg-red-700 text-white px-6 py-3 rounded-md font-semibold w-full transition-colors disabled:cursor-not-allowed"
            >
              {closePeriodMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Cerrando período...
                </span>
              ) : (
                'Cerrar Período'
              )}
            </button>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📊 Período cerrado el {period.closedAt ? new Date(period.closedAt).toLocaleDateString('es-ES') : 'fecha desconocida'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Breakdown for closed periods */}
      {period.status === 'CLOSED' && (
        <BudgetBreakdown
          totalIncome={summary.totalIncome || 0}
          totalAdjustments={summary.totalAdjustments || 0}
          totalDeductions={summary.totalDeductions || 0}
          totalBudget={summary.totalBudget}
          totalExpenses={summary.totalExpenses}
          remainingBudget={summary.remainingBudget}
          isClosedPeriod={true}
          budgetItems={budgetItems}
        />
      )}
    </div>
  )
}
