'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCurrentPeriod, usePeriods, useExpenses, useDeleteExpense, Expense, BudgetPeriod } from '@/hooks/useBudgetData'
import BudgetTracker from '@/components/BudgetTracker'
import BudgetForm from '@/components/BudgetForm'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseList from '@/components/ExpenseList'
import FilterByCategory from '@/components/FilterByCategory'
import ExpenseModal from '@/components/ExpenseModal'
import PeriodSelector from '@/components/PeriodSelector'

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data: currentPeriod } = useCurrentPeriod()
  const { data: allPeriods } = usePeriods()
  
  // Selected period state (defaults to current active period)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  
  // Set initial selected period to current period
  useEffect(() => {
    if (currentPeriod && !selectedPeriodId) {
      setSelectedPeriodId(currentPeriod.id)
    }
  }, [currentPeriod, selectedPeriodId])
  
  // Get the selected period object
  const selectedPeriod = allPeriods?.find(p => p.id === selectedPeriodId) || currentPeriod
  const isActivePeriod = selectedPeriod?.status === 'ACTIVE'
  
  const { data: expenses, isLoading: loadingExpenses } = useExpenses(selectedPeriod?.id || '')
  const deleteExpenseMutation = useDeleteExpense()

  const [filteredCategory, setFilteredCategory] = useState('')
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense)
    setShowExpenseModal(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!isActivePeriod) {
      alert('No puedes eliminar gastos de un período cerrado')
      return
    }
    
    const confirmed = confirm('¿Estás seguro de que deseas eliminar este gasto?')
    if (!confirmed) return

    try {
      await deleteExpenseMutation.mutateAsync(expenseId)
    } catch (error: any) {
      alert(error.message || 'Error al eliminar gasto')
    }
  }

  const handleCloseModal = () => {
    setShowExpenseModal(false)
    setExpenseToEdit(null)
  }

  const hasBudget = selectedPeriod?.summary?.totalBudget && selectedPeriod.summary.totalBudget > 0

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ¡Bienvenido, {session?.user?.name || 'Usuario'}! 👋
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gestiona tu presupuesto y controla tus gastos
        </p>
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <PeriodSelector
          selectedPeriodId={selectedPeriodId}
          onPeriodChange={setSelectedPeriodId}
        />
      </div>

      {/* Budget Tracker */}
      {hasBudget ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <BudgetTracker />
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Define tu presupuesto
              </h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Para comenzar a registrar gastos, primero debes agregar presupuesto a tu período actual.
              </p>
              {isActivePeriod && (
                <button
                  onClick={() => setShowBudgetForm(!showBudgetForm)}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                >
                  {showBudgetForm ? 'Ocultar formulario' : 'Agregar presupuesto'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Budget Form (collapsible) - ONLY if ACTIVE period */}
      {isActivePeriod && (showBudgetForm || !hasBudget) && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <BudgetForm onSuccess={() => setShowBudgetForm(false)} />
        </div>
      )}

      {/* Warning if trying to modify budget in closed period */}
      {!isActivePeriod && showBudgetForm && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                ⚠️ Período Cerrado
              </h3>
              <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                No puedes modificar el presupuesto de un período cerrado. Solo puedes agregar gastos con fechas dentro del período.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {hasBudget && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              setExpenseToEdit(null)
              setShowExpenseModal(true)
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Gasto
          </button>

          {isActivePeriod && (
            <button
              onClick={() => setShowBudgetForm(!showBudgetForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {showBudgetForm ? 'Ocultar Presupuesto' : 'Agregar Presupuesto'}
            </button>
          )}
        </div>
      )}

      {/* Expenses Section */}
      {hasBudget && (
        <div className="space-y-4">
          {/* Filter */}
          <FilterByCategory
            selectedCategory={filteredCategory}
            onFilterChange={setFilteredCategory}
          />

          {/* Expense List */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <ExpenseList
              expenses={expenses || []}
              isLoading={loadingExpenses}
              filteredCategory={filteredCategory}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={handleCloseModal}
        expenseToEdit={expenseToEdit}
        selectedPeriod={selectedPeriod}
      />
    </div>
  )
}
