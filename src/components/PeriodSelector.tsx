'use client'

import { usePeriods } from '@/hooks/useBudgetData'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PeriodSelectorProps {
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
}

export default function PeriodSelector({ selectedPeriodId, onPeriodChange }: PeriodSelectorProps) {
  const { data: periods, isLoading } = usePeriods()

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-12 rounded-lg w-full max-w-md"></div>
    )
  }

  if (!periods || periods.length === 0) {
    return null
  }

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId)

  return (
    <div className="w-full max-w-md">
      <label htmlFor="period-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        📅 Período
      </label>
      <select
        id="period-selector"
        value={selectedPeriodId || ''}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-base"
      >
        {periods.map((period) => {
          const startDate = new Date(period.startDate)
          const endDate = period.endDate ? new Date(period.endDate) : null
          const isActive = period.status === 'ACTIVE'
          
          const dateLabel = isActive
            ? `${format(startDate, 'MMM yyyy', { locale: es })} - Activo`
            : `${format(startDate, 'MMM yyyy', { locale: es })} - ${endDate ? format(endDate, 'MMM yyyy', { locale: es }) : 'Sin fin'}`
          
          const statusBadge = isActive ? '🟢' : '🔵'
          const durationText = period.durationDays ? `${period.durationDays} días` : ''
          
          return (
            <option key={period.id} value={period.id}>
              {statusBadge} {dateLabel} {durationText ? `• ${durationText}` : ''}
            </option>
          )
        })}
      </select>
      
      {/* Status Badge */}
      {selectedPeriod && (
        <div className="mt-2 flex items-center gap-2">
          {selectedPeriod.status === 'ACTIVE' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              🟢 Período Activo
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              🔵 Período Cerrado
            </span>
          )}
          
          {selectedPeriod.status === 'CLOSED' && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ℹ️ Solo puedes agregar gastos (sin modificar presupuesto)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
