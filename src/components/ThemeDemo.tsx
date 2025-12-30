'use client'

import { ThemeToggle } from './ThemeToggle'

export function ThemeDemo() {
  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-theme-primary/10 bg-theme-secondary/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-theme-soft">
                <span className="text-white text-sm font-bold">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-theme-primary">Budget Tracker</h1>
                <p className="text-sm text-theme-tertiary">Sistema de gestión de presupuestos</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Budget Summary Card */}
          <div className="bg-theme-secondary rounded-xl p-6 shadow-theme-soft border border-theme-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme-primary">Presupuesto Mensual</h2>
              <span className="px-2 py-1 bg-success-500/10 text-success-600 text-xs rounded-full border border-success-500/20">
                ACTIVO
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-theme-secondary">Presupuesto Total</span>
                <span className="font-bold text-theme-primary">$2,500.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-theme-secondary">Gastado</span>
                <span className="font-bold text-budget-expense">$1,250.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-theme-secondary">Disponible</span>
                <span className="font-bold text-budget-income">$1,250.00</span>
              </div>
              <div className="w-full bg-theme-tertiary rounded-full h-2 mt-4">
                <div className="bg-gradient-to-r from-budget-income to-budget-expense h-2 rounded-full w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Categories Card */}
          <div className="bg-theme-secondary rounded-xl p-6 shadow-theme-soft border border-theme-primary/10">
            <h2 className="text-lg font-semibold text-theme-primary mb-4">Categorías Más Usadas</h2>
            <div className="space-y-3">
              {[
                { name: 'Alimentación', amount: 450, color: 'bg-category-food' },
                { name: 'Transporte', amount: 200, color: 'bg-category-transport' },
                { name: 'Entretenimiento', amount: 300, color: 'bg-category-entertainment' },
                { name: 'Salud', amount: 150, color: 'bg-category-health' },
              ].map((category, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-theme-tertiary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                    <span className="text-theme-secondary">{category.name}</span>
                  </div>
                  <span className="font-medium text-theme-primary">${category.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-theme-secondary rounded-xl p-6 shadow-theme-soft border border-theme-primary/10">
            <h2 className="text-lg font-semibold text-theme-primary mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors shadow-theme-soft hover:shadow-theme-medium">
                + Agregar Gasto
              </button>
              <button className="w-full bg-success-500 hover:bg-success-600 text-white py-2 px-4 rounded-lg transition-colors shadow-theme-soft hover:shadow-theme-medium">
                + Ingreso Extra
              </button>
              <button className="w-full bg-theme-tertiary hover:bg-theme-tertiary/80 text-theme-primary py-2 px-4 rounded-lg transition-colors border border-theme-primary/10">
                Ver Reportes
              </button>
            </div>
          </div>
        </div>

        {/* Color Palette Demo */}
        <div className="bg-theme-secondary rounded-xl p-6 shadow-theme-soft border border-theme-primary/10">
          <h2 className="text-lg font-semibold text-theme-primary mb-4">Paleta de Colores del Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Primary', color: 'bg-primary-500', text: 'text-primary-500' },
              { name: 'Success', color: 'bg-success-500', text: 'text-success-500' },
              { name: 'Warning', color: 'bg-warning-500', text: 'text-warning-500' },
              { name: 'Error', color: 'bg-error-500', text: 'text-error-500' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-full h-12 ${item.color} rounded-lg mb-2 shadow-theme-soft`}></div>
                <span className={`text-sm font-medium ${item.text}`}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}