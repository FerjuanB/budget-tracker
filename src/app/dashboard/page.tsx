'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCurrentPeriod, usePeriods, useExpenses, useBudgetAdditions, useDeleteExpense, useCreatePeriod, Expense, BudgetPeriod } from '@/hooks/useBudgetData'
import BudgetTracker from '@/components/BudgetTracker'
import BudgetForm from '@/components/BudgetForm'
import ExpenseList from '@/components/ExpenseList'
import FilterByCategory from '@/components/FilterByCategory'
import ExpenseModal from '@/components/ExpenseModal'
import PeriodSelector from '@/components/PeriodSelector'
import FloatingAddButton from '@/components/fab/FloatingAddButton'
import BottomSheet from '@/components/fab/shared/BottomSheet'
import BottomNav, { TabKey } from '@/components/BottomNav'

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data: currentPeriod, error: currentPeriodError } = useCurrentPeriod()
  const { data: allPeriods } = usePeriods()
  const createPeriodMutation = useCreatePeriod()
  
  // Selected period state (defaults to current active period)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  
  // Set initial selected period to current period
  useEffect(() => {
    if (currentPeriod && !selectedPeriodId) {
      setSelectedPeriodId(currentPeriod.id)
    }
  }, [currentPeriod?.id, selectedPeriodId])

  // When current period data changes (e.g., after adding budget), refresh the selected period
  useEffect(() => {
    if (currentPeriod && selectedPeriodId === currentPeriod.id) {
      setSelectedPeriodId(currentPeriod.id)
    }
  }, [currentPeriod?.summary?.totalBudget])

  // Handle create new period
  const handleCreatePeriod = async () => {
    try {
      await createPeriodMutation.mutateAsync({})
    } catch (error: any) {
      alert(error.message || 'Error al crear período')
    }
  }

  // Check if no active period exists (404 error means no active period)
  const noActivePeriod = currentPeriodError && currentPeriodError.message.includes('No active period found')
  
  // Get the selected period object
  const selectedPeriod = allPeriods?.find(p => p.id === selectedPeriodId) || currentPeriod
  const isActivePeriod = selectedPeriod?.status === 'ACTIVE'
  
  const { data: expenses, isLoading: loadingExpenses } = useExpenses(selectedPeriod?.id || '')
  const { data: budgetAdditions, isLoading: loadingBudgets } = useBudgetAdditions(selectedPeriod?.id || '')
  const deleteExpenseMutation = useDeleteExpense()

  const [filteredCategory, setFilteredCategory] = useState('')
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('home')

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
    <>
      {/* FAB (floating action button) — main entry for adding expenses/income */}
      <FloatingAddButton
        onAddBudget={() => {
          if (!isActivePeriod) {
            alert('No podés agregar ingresos en un período cerrado')
            return
          }
          setShowBudgetForm(true)
        }}
      />

      {/* ═══════  HOME TAB  ═══════ */}
      {activeTab === 'home' && (
        <>
          {/* No Active Period — Create New Period */}
          {noActivePeriod ? (
            <div className="px-5 py-8">
              <div
                className="rounded-[var(--radius-lg)] p-6"
                style={{
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-warning)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-warning)',
                      color: '#fff',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3
                      className="heading text-lg mb-1"
                      style={{ color: 'var(--color-label-primary)' }}
                    >
                      No hay períodos activos
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: 'var(--color-label-secondary)' }}
                    >
                      Has cerrado todos tus períodos. Para continuar registrando gastos, creá un nuevo período.
                    </p>
                    <button
                      onClick={handleCreatePeriod}
                      disabled={createPeriodMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] font-semibold text-white disabled:opacity-50 transition-transform active:scale-95"
                      style={{
                        background: 'var(--color-accent)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 14,
                      }}
                    >
                      {createPeriodMutation.isPending ? 'Creando...' : 'Crear nuevo período'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Period Selector — minimal, no wrapper card */}
              <div className="px-5 pt-2 pb-1">
                <PeriodSelector
                  selectedPeriodId={selectedPeriodId}
                  onPeriodChange={setSelectedPeriodId}
                />
              </div>

              {/* Budget Tracker (hero + stats) */}
              {hasBudget ? (
                <BudgetTracker />
              ) : (
                <div className="px-5 py-6">
                  <div
                    className="rounded-[var(--radius-lg)] p-5 text-center"
                    style={{
                      background: 'var(--color-surface-elevated)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <p
                      className="heading text-base mb-1"
                      style={{ color: 'var(--color-label-primary)' }}
                    >
                      Definí tu presupuesto
                    </p>
                    <p
                      className="text-sm mb-4"
                      style={{ color: 'var(--color-label-secondary)' }}
                    >
                      Agregá ingresos para empezar a registrar gastos
                    </p>
                    {isActivePeriod && (
                      <button
                        onClick={() => setShowBudgetForm(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] text-white font-semibold transition-transform active:scale-95"
                        style={{
                          background: 'var(--color-accent)',
                          fontFamily: 'var(--font-heading)',
                          fontSize: 14,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Agregar ingreso
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Warning if trying to modify budget in closed period */}
              {!isActivePeriod && (
                <div className="px-5 pb-4">
                  <div
                    className="rounded-[var(--radius-lg)] p-5"
                    style={{
                      background: 'rgba(255, 149, 0, 0.08)',
                      border: '1px solid rgba(255, 149, 0, 0.2)',
                    }}
                  >
                    <p
                      className="heading text-sm mb-1"
                      style={{ color: 'var(--color-warning)' }}
                    >
                      Período cerrado
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--color-label-secondary)' }}
                    >
                      No podés modificar el presupuesto de un período cerrado.
                    </p>
                  </div>
                </div>
              )}

              {/* Expenses Section */}
              {hasBudget && (
                <div className="space-y-2">
                  {/* Filter pills with add-income button */}
                  <FilterByCategory
                    selectedCategory={filteredCategory}
                    onFilterChange={setFilteredCategory}
                    onAddIncome={() => {
                      if (!isActivePeriod) return
                      setShowBudgetForm(true)
                    }}
                  />

                  {/* Expense List */}
                  <ExpenseList
                    expenses={expenses || []}
                    budgetAdditions={budgetAdditions || []}
                    isLoading={loadingExpenses || loadingBudgets}
                    filteredCategory={filteredCategory}
                    onEditExpense={handleEditExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                </div>
              )}

              {/* Expense Modal */}
              <ExpenseModal
                isOpen={showExpenseModal}
                onClose={handleCloseModal}
                expenseToEdit={expenseToEdit}
                selectedPeriod={selectedPeriod}
              />
            </>
          )}
        </>
      )}

      {/* ═══════  HISTORY TAB (placeholder)  ═══════ */}
      {activeTab === 'history' && (
        <div className="px-5 py-12 text-center">
          <div
            className="mx-auto flex items-center justify-center mb-3"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--color-surface-quaternary)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-label-tertiary)' }}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-label-secondary)' }}>
            Historial
          </p>
          <p className="text-sm" style={{ color: 'var(--color-label-tertiary)' }}>
            Períodos cerrados · Próximamente
          </p>
        </div>
      )}

      {/* ═══════  CATEGORIES TAB (placeholder)  ═══════ */}
      {activeTab === 'categories' && (
        <div className="px-5 py-12 text-center">
          <div
            className="mx-auto flex items-center justify-center mb-3"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--color-surface-quaternary)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-label-tertiary)' }}>
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-label-secondary)' }}>
            Categorías
          </p>
          <p className="text-sm" style={{ color: 'var(--color-label-tertiary)' }}>
            Gestión de categorías · Próximamente
          </p>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Budget Form Bottom Sheet — triggered from FAB "Agregar ingreso" */}
      <BottomSheet
        isOpen={showBudgetForm}
        onClose={() => setShowBudgetForm(false)}
        maxHeight={0.9}
      >
        <div className="px-1 pb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowBudgetForm(false)}
              className="text-[var(--color-label-secondary)] text-sm"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ← Volver
            </button>
          </div>
          <h2 className="heading text-[22px] mb-1 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Agregar ingreso</span>
          </h2>
          <p className="text-sm text-[var(--color-label-secondary)] mb-5">
            Sumá presupuesto al período actual
          </p>
          <BudgetForm onSuccess={() => setShowBudgetForm(false)} />
        </div>
      </BottomSheet>
    </>
  )
}
