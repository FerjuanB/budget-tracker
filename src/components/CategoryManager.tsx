'use client'

import { useState } from 'react'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useBudgetData'
import { Category } from '@/hooks/useBudgetData'

interface CategoryManagerProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'list' | 'create' | 'edit'

export default function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { data: categories, isLoading: loadingCategories } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [activeTab, setActiveTab] = useState<TabType>('list')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '#3b82f6',
  })

  const [deleteConfirm, setDeleteConfirm] = useState<{ categoryId: string; reassignTo: string } | null>(null)

  if (!isOpen) return null

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', icon: '', color: '#3b82f6' })
    setError('')
    setSuccess('')
  }

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!formData.icon.trim()) {
      setError('El emoji/icono es requerido')
      return
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        icon: formData.icon.trim(),
        color: formData.color,
      })
      setSuccess('Categoría creada exitosamente')
      resetForm()
      setActiveTab('list')
    } catch (err: any) {
      setError(err.message || 'Error al crear categoría')
    }
  }

  // Handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedCategory) return
    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedCategory.id,
        name: formData.name.trim(),
        icon: formData.icon.trim() || undefined,
        color: formData.color,
      })
      setSuccess('Categoría actualizada exitosamente')
      resetForm()
      setSelectedCategory(null)
      setActiveTab('list')
    } catch (err: any) {
      setError(err.message || 'Error al actualizar categoría')
    }
  }

  // Handle delete
  const handleDelete = async (categoryId: string, reassignTo?: string) => {
    setError('')
    setSuccess('')

    try {
      await deleteMutation.mutateAsync({
        id: categoryId,
        reassignTo: reassignTo,
      })
      setSuccess('Categoría eliminada exitosamente')
      setDeleteConfirm(null)
      setActiveTab('list')
    } catch (err: any) {
      setError(err.message || 'Error al eliminar categoría')
    }
  }

  // Edit button click
  const handleEditClick = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color || '#3b82f6',
    })
    setActiveTab('edit')
    setError('')
    setSuccess('')
  }

  const expenseCounts = categories?.reduce((acc, cat) => {
    acc[cat.id] = cat._count?.expenses || 0
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestionar Categorías
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveTab('list')
                resetForm()
                setSelectedCategory(null)
              }}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'list'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Lista ({categories?.length || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab('create')
                resetForm()
                setSelectedCategory(null)
              }}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'create'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Crear Nueva
            </button>
            {selectedCategory && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`pb-3 px-4 font-medium transition-colors ${
                  activeTab === 'edit'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                Editar: {selectedCategory.name}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Tab Content: List */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {loadingCategories ? (
                <p className="text-center text-gray-500">Cargando categorías...</p>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{
                          backgroundColor: category.color ? `${category.color}20` : '#f3f4f6',
                        }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {expenseCounts[category.id]} gasto{expenseCounts[category.id] !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(category)}
                        className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            categoryId: category.id,
                            reassignTo: '',
                          })
                        }
                        className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay categorías. ¡Crea una nueva!
                </p>
              )}
            </div>
          )}

          {/* Tab Content: Create */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de categoría *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Alimentación, Transporte, Entretenimiento"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emoji/Icono *
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Ej: 🍕 🚗 🎬 💰"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-2xl"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Copia y pega un emoji aquí. Usa emojis.gg o similar para encontrar emojis
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Categoría'}
              </button>
            </form>
          )}

          {/* Tab Content: Edit */}
          {activeTab === 'edit' && selectedCategory && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de categoría *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emoji/Icono
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm({
                      categoryId: selectedCategory.id,
                      reassignTo: '',
                    })
                  }
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              ¿Eliminar categoría?
            </h3>

            {(() => {
              const catToDelete = categories?.find((c) => c.id === deleteConfirm.categoryId)
              const expenseCount = expenseCounts[deleteConfirm.categoryId] || 0

              return (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {catToDelete && (
                      <>
                        ¿Estás seguro de que deseas eliminar <strong>{catToDelete.name}</strong>?
                        {expenseCount > 0 && (
                          <>
                            <br />
                            <br />
                            Esta categoría tiene <strong>{expenseCount} gasto{expenseCount !== 1 ? 's' : ''}</strong>
                            . Necesitas reasignarlo a otra categoría:
                          </>
                        )}
                      </>
                    )}
                  </p>

                  {expenseCount > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reasignar gastos a:
                      </label>
                      <select
                        value={deleteConfirm.reassignTo}
                        onChange={(e) =>
                          setDeleteConfirm({ ...deleteConfirm, reassignTo: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      >
                        <option value="">Seleccionar categoría...</option>
                        {categories
                          ?.filter((c) => c.id !== deleteConfirm.categoryId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (expenseCount > 0 && !deleteConfirm.reassignTo) {
                          setError('Debes seleccionar una categoría para reasignar los gastos')
                          return
                        }
                        handleDelete(deleteConfirm.categoryId, deleteConfirm.reassignTo || undefined)
                      }}
                      disabled={deleteMutation.isPending || (expenseCount > 0 && !deleteConfirm.reassignTo)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                    >
                      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
