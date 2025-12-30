'use client'

import { useState } from 'react'
import { useCreateBudgetAddition, useCurrentPeriod } from '@/hooks/useBudgetData'

interface BudgetFormProps {
  onSuccess?: () => void
}

export default function BudgetForm({ onSuccess }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'ADJUSTMENT' | 'DEDUCTION',
    amount: '',
    source: '',
    comments: '',
  })
  const [error, setError] = useState('')

  const { data: currentPeriod, isLoading: loadingPeriod } = useCurrentPeriod()
  const createBudgetMutation = useCreateBudgetAddition()

  const isValid = () => {
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) return false
    if (!formData.source.trim()) return false
    if ((formData.type === 'ADJUSTMENT' || formData.type === 'DEDUCTION') && !formData.comments.trim()) {
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!isValid()) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    if (!currentPeriod) {
      setError('No hay un período activo')
      return
    }

    try {
      await createBudgetMutation.mutateAsync({
        periodId: currentPeriod.id,
        type: formData.type,
        amount: parseFloat(formData.amount),
        source: formData.source.trim(),
        comments: formData.comments.trim() || undefined,
      })

      // Reset form
      setFormData({
        type: 'INCOME',
        amount: '',
        source: '',
        comments: '',
      })

      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al agregar presupuesto')
    }
  }

  const typeLabels = {
    INCOME: 'Ingreso',
    ADJUSTMENT: 'Ajuste',
    DEDUCTION: 'Deducción'
  }

  if (loadingPeriod) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    )
  }

  if (!currentPeriod) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          No hay un período activo. Por favor contacta al administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Agregar al Presupuesto
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Registra ingresos, ajustes o deducciones a tu presupuesto
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div className="space-y-2">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
          >
            <option value="INCOME">{typeLabels.INCOME}</option>
            <option value="ADJUSTMENT">{typeLabels.ADJUSTMENT}</option>
            <option value="DEDUCTION">{typeLabels.DEDUCTION}</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formData.type === 'INCOME' && 'Ejemplo: Salario, bono, ingreso extra'}
            {formData.type === 'ADJUSTMENT' && 'Corrección positiva al presupuesto'}
            {formData.type === 'DEDUCTION' && 'Corrección negativa al presupuesto'}
          </p>
        </div>

        {/* Monto */}
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Monto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Fuente */}
        <div className="space-y-2">
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fuente/Concepto <span className="text-red-500">*</span>
          </label>
          <input
            id="source"
            name="source"
            type="text"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            placeholder="Ej: Salario mensual, Freelance, etc."
            maxLength={100}
          />
        </div>

        {/* Comentarios */}
        <div className="space-y-2">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Comentarios {(formData.type === 'ADJUSTMENT' || formData.type === 'DEDUCTION') && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
            placeholder="Agrega detalles adicionales..."
            maxLength={500}
          />
          {(formData.type === 'ADJUSTMENT' || formData.type === 'DEDUCTION') && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Los comentarios son obligatorios para ajustes y deducciones
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid() || createBudgetMutation.isPending}
          className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
            !isValid() || createBudgetMutation.isPending
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          {createBudgetMutation.isPending ? (
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
              Agregando...
            </span>
          ) : (
            'Agregar al Presupuesto'
          )}
        </button>
      </form>
    </div>
  )
}
