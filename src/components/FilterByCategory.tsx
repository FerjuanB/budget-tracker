'use client'

import { ChangeEvent, useState } from 'react'
import { useCategories } from '@/hooks/useBudgetData'
import CategoryManager from './CategoryManager'

interface FilterByCategoryProps {
  selectedCategory: string
  onFilterChange: (categoryId: string) => void
}

export default function FilterByCategory({
  selectedCategory,
  onFilterChange
}: FilterByCategoryProps) {
  const { data: categories, isLoading } = useCategories()
  const [isManagerOpen, setIsManagerOpen] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(e.target.value)
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <label
            htmlFor="category"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Filtrar gastos por categoría
          </label>
          <div className="flex gap-2 flex-1">
            <select
              onChange={handleChange}
              value={selectedCategory}
              id="category"
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todas las categorías</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsManagerOpen(true)}
              title="Gestionar categorías"
              className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors font-medium text-sm"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <CategoryManager isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} />
    </>
  )
}
