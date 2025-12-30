'use client'

import { useState, useEffect } from 'react'
import { useCreateExpense, useUpdateExpense, useCategories, useCurrentPeriod, Expense, BudgetPeriod } from '@/hooks/useBudgetData'

interface ExpenseFormProps {
  expenseToEdit?: Expense | null
  selectedPeriod?: BudgetPeriod | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ExpenseForm({ expenseToEdit, selectedPeriod, onSuccess, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    expenseName: '',
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    comments: '',
  })
  const [error, setError] = useState('')
  const [dateWarning, setDateWarning] = useState('')

  const { data: categories, isLoading: loadingCategories } = useCategories()
  const { data: currentPeriod, isLoading: loadingPeriod } = useCurrentPeriod()
  const createExpenseMutation = useCreateExpense()
  const updateExpenseMutation = useUpdateExpense()

  // Use selectedPeriod if provided, otherwise use currentPeriod
  const activePeriod = selectedPeriod || currentPeriod
  const isClosedPeriod = activePeriod?.status === 'CLOSED'

  // Validate date against period range (for closed periods)
  useEffect(() => {
    if (isClosedPeriod && activePeriod && formData.date) {
      const selectedDate = new Date(formData.date)
      const periodStart = new Date(activePeriod.startDate)
      const periodEnd = activePeriod.endDate ? new Date(activePeriod.endDate) : new Date()

      // Reset time to compare only dates
      selectedDate.setHours(0, 0, 0, 0)
      periodStart.setHours(0, 0, 0, 0)
      periodEnd.setHours(23, 59, 59, 999)

      if (selectedDate < periodStart || selectedDate > periodEnd) {
        setDateWarning(
          `⚠️ La fecha debe estar entre ${periodStart.toLocaleDateString('es-AR')} y ${periodEnd.toLocaleDateString('es-AR')}`
        )
      } else {
        setDateWarning('')
      }
    } else {
      setDateWarning('')
    }
  }, [formData.date, isClosedPeriod, activePeriod])

  // Load expense data when editing
  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        expenseName: expenseToEdit.expenseName,
        amount: expenseToEdit.amount.toString(),
        categoryId: expenseToEdit.categoryId,
        date: new Date(expenseToEdit.date).toISOString().split('T')[0],
        comments: expenseToEdit.comments || '',
      })
    } else {
      // Reset form - for closed periods, default to period start date
      const defaultDate = isClosedPeriod && activePeriod?.startDate
        ? new Date(activePeriod.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      
      setFormData({
        expenseName: '',
        amount: '',
        categoryId: '',
        date: defaultDate,
        comments: '',
      })
    }
    setError('')
  }, [expenseToEdit, isClosedPeriod, activePeriod])

  const isValid = () => {
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) return false
    if (!formData.expenseName.trim()) return false
    if (!formData.categoryId) return false
    if (dateWarning) return false // Date must be valid
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!isValid()) {
      setError('Por favor completa todos los campos requeridos correctamente')
      return
    }

    if (!activePeriod) {
      setError('No hay un período seleccionado')
      return
    }

    // Validate date range for closed periods (double-check on submit)
    if (isClosedPeriod) {
      const selectedDate = new Date(formData.date)
      const periodStart = new Date(activePeriod.startDate)
      const periodEnd = activePeriod.endDate ? new Date(activePeriod.endDate) : new Date()

      selectedDate.setHours(0, 0, 0, 0)
      periodStart.setHours(0, 0, 0, 0)
      periodEnd.setHours(23, 59, 59, 999)

      if (selectedDate < periodStart || selectedDate > periodEnd) {
        setError('La fecha del gasto debe estar dentro del rango del período cerrado')
        return
      }
    }

    // Check budget
    if (!expenseToEdit && activePeriod.summary) {
      const amount = parseFloat(formData.amount)
      if (amount > activePeriod.summary.remainingBudget) {
        setError(
          `El gasto ($${amount.toLocaleString()}) supera el presupuesto disponible ($${activePeriod.summary.remainingBudget.toLocaleString()})`
        )
        return
      }
    }

    try {
      if (expenseToEdit) {
        // Update existing expense
        await updateExpenseMutation.mutateAsync({
          id: expenseToEdit.id,
          expenseName: formData.expenseName.trim(),
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId,
          date: new Date(formData.date).toISOString(),
          comments: formData.comments.trim() || undefined,
        })
      } else {
        // Create new expense
        await createExpenseMutation.mutateAsync({
          periodId: activePeriod.id,
          expenseName: formData.expenseName.trim(),
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId,
          date: new Date(formData.date).toISOString(),
          comments: formData.comments.trim() || undefined,
        })
      }

      // Reset form
      const defaultDate = isClosedPeriod && activePeriod?.startDate
        ? new Date(activePeriod.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      
      setFormData({
        expenseName: '',
        amount: '',
        categoryId: '',
        date: defaultDate,
        comments: '',
      })

      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al guardar gasto')
    }
  }

  const isLoading = loadingCategories || loadingPeriod
  const isSaving = createExpenseMutation.isPending || updateExpenseMutation.isPending

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    )
  }

  if (!activePeriod) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          No hay un período seleccionado. Por favor selecciona un período.
        </p>
      </div>
    )
  }

  // Calculate min/max dates for closed periods
  let minDate: string | undefined
  let maxDate: string | undefined
  if (isClosedPeriod) {
    minDate = new Date(activePeriod.startDate).toISOString().split('T')[0]
    maxDate = activePeriod.endDate
      ? new Date(activePeriod.endDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {expenseToEdit ? 'Editar Gasto' : 'Nuevo Gasto'}
        </h2>
        {isClosedPeriod && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            📅 Período Cerrado: Solo puedes agregar gastos con fechas dentro del período
          </p>
        )}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre del gasto */}
        <div className="space-y-2">
          <label htmlFor="expenseName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre del Gasto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="expenseName"
            name="expenseName"
            value={formData.expenseName}
            onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            placeholder="Ej: Supermercado"
            maxLength={100}
          />
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
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="0"
              step="0.01"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              placeholder="0.00"
            />
          </div>
          {activePeriod.summary && !expenseToEdit && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Disponible: ${activePeriod.summary.remainingBudget.toLocaleString()}
            </p>
          )}
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
          >
            <option value="">Selecciona una categoría</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={minDate}
            max={maxDate}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
          />
          {dateWarning && (
            <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">
              {dateWarning}
            </p>
          )}
          {isClosedPeriod && minDate && maxDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Rango permitido: {new Date(minDate).toLocaleDateString('es-AR')} - {new Date(maxDate).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
      </div>

      {/* Comentarios */}
      <div className="space-y-2">
        <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Comentarios (opcional)
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
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!isValid() || isSaving}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            !isValid() || isSaving
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          {isSaving ? (
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
              {expenseToEdit ? 'Actualizando...' : 'Agregando...'}
            </span>
          ) : (
            expenseToEdit ? 'Actualizar Gasto' : 'Agregar Gasto'
          )}
        </button>

        {(expenseToEdit || onCancel) && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
