'use client'

import AmountDisplay from './AmountDisplay'

interface BudgetItem {
  id: string
  type: 'INCOME' | 'ADJUSTMENT' | 'DEDUCTION'
  amount: number
  source: string
  comments?: string | null
  date?: string
}

interface BudgetBreakdownProps {
  totalIncome: number
  totalAdjustments: number
  totalDeductions: number
  totalBudget: number
  totalExpenses: number
  remainingBudget: number
  isClosedPeriod?: boolean
  budgetItems?: BudgetItem[]
}

export default function BudgetBreakdown({
  totalIncome,
  totalAdjustments,
  totalDeductions,
  totalBudget,
  totalExpenses,
  remainingBudget,
  isClosedPeriod = false,
  budgetItems = [],
}: BudgetBreakdownProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {isClosedPeriod ? 'Desglose de Presupuesto (Período Cerrado)' : 'Desglose de Presupuesto'}
      </h3>

      <div className="space-y-4">
        {/* Income Section */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
            Ingresos (+)
          </h4>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            ${totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Adjustments Section */}
        {totalAdjustments > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Ajustes (+)
            </h4>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              ${totalAdjustments.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Deductions Section */}
        {totalDeductions > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
              Deducciones (-)
            </h4>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              ${totalDeductions.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Calculation breakdown */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ingresos</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {totalAdjustments > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">+ Ajustes</span>
              <span className="font-medium text-gray-900 dark:text-white">
                +${totalAdjustments.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {totalDeductions > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">- Deducciones</span>
              <span className="font-medium text-gray-900 dark:text-white">
                -${totalDeductions.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold">
            <span className="text-gray-900 dark:text-white">= Presupuesto Total</span>
            <span className="text-gray-900 dark:text-white">
              ${totalBudget.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <AmountDisplay
            label="Presupuesto Total"
            amount={totalBudget}
            className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          />
          <AmountDisplay
            label="Gastado"
            amount={totalExpenses}
            className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
          />
          <AmountDisplay
            label="Disponible"
            amount={remainingBudget}
            className={
              remainingBudget < 0
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }
          />
        </div>

        {/* Budget Items List */}
        {budgetItems.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              Detalle de Presupuesto
            </h4>
            <div className="space-y-2">
              {budgetItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.type === 'INCOME'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : item.type === 'ADJUSTMENT'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.source}
                    </p>
                    {item.comments && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.comments}
                      </p>
                    )}
                    {item.date && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(item.date).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        item.type === 'DEDUCTION'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-green-700 dark:text-green-400'
                      }`}
                    >
                      {item.type === 'DEDUCTION' ? '-' : '+'}$
                      {item.amount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
