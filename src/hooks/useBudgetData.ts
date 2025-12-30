'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================
// TYPES
// ============================================

export interface BudgetPeriod {
  id: string
  startDate: string
  endDate: string | null
  status: 'ACTIVE' | 'CLOSED'
  durationDays: number | null
  summaryJson: string | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
  summary?: {
    totalIncome: number
    totalAdjustments: number
    totalDeductions: number
    totalBudget: number
    totalExpenses: number
    remainingBudget: number
    durationDays: number
    budgetStatus?: 'safe' | 'caution' | 'warning' | 'danger' | 'over'
    percentageUsed?: number
  }
}

export interface BudgetAddition {
  id: string
  periodId: string
  type: 'INCOME' | 'ADJUSTMENT' | 'DEDUCTION'
  amount: number
  source: string
  date: string
  comments: string | null
  budgetBefore: number
  budgetAfter: number
  createdAt: string
}

export interface Expense {
  id: string
  periodId: string
  categoryId: string
  expenseName: string
  amount: number
  date: string
  comments: string | null
  budgetBefore: number
  budgetAfter: number
  snapshotAt: string
  createdAt: string
  updatedAt: string
  originalAmount: number | null
  category: {
    id: string
    name: string
    icon: string
    color: string | null
  }
}

export interface Category {
  id: string
  userId: string
  name: string
  icon: string
  color: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    expenses: number
  }
}

// ============================================
// API FUNCTIONS
// ============================================

// Periods
async function fetchCurrentPeriod(): Promise<BudgetPeriod> {
  const res = await fetch('/api/periods/current')
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch current period')
  }
  const data = await res.json()
  return data.data
}

async function fetchPeriods(): Promise<BudgetPeriod[]> {
  const res = await fetch('/api/periods')
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch periods')
  }
  const data = await res.json()
  return data.data
}

async function createPeriod(input: { startDate?: string }): Promise<BudgetPeriod> {
  const res = await fetch('/api/periods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create period')
  }
  const data = await res.json()
  return data.data
}

async function closePeriod(periodId: string): Promise<{ period: BudgetPeriod; summary: any }> {
  const res = await fetch('/api/periods/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periodId }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to close period')
  }
  const data = await res.json()
  return data.data
}

// Budget Additions
async function fetchBudgetAdditions(periodId: string): Promise<BudgetAddition[]> {
  const res = await fetch(`/api/budgets?periodId=${periodId}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch budget additions')
  }
  const data = await res.json()
  return data.data
}

async function createBudgetAddition(input: {
  periodId: string
  type: 'INCOME' | 'ADJUSTMENT' | 'DEDUCTION'
  amount: number
  source: string
  date?: string
  comments?: string
}): Promise<BudgetAddition> {
  const res = await fetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create budget addition')
  }
  const data = await res.json()
  return data.data
}

async function deleteBudgetAddition(id: string): Promise<void> {
  const res = await fetch(`/api/budgets/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to delete budget addition')
  }
}

// Expenses
async function fetchExpenses(periodId: string): Promise<Expense[]> {
  const res = await fetch(`/api/expenses?periodId=${periodId}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch expenses')
  }
  const data = await res.json()
  return data.data
}

async function createExpense(input: {
  periodId: string
  categoryId: string
  expenseName: string
  amount: number
  date?: string
  comments?: string
}): Promise<Expense> {
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create expense')
  }
  const data = await res.json()
  return data.data
}

async function updateExpense(
  id: string,
  input: {
    expenseName?: string
    amount?: number
    categoryId?: string
    date?: string
    comments?: string
  }
): Promise<Expense> {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update expense')
  }
  const data = await res.json()
  return data.data
}

async function deleteExpense(id: string): Promise<void> {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to delete expense')
  }
}

// Categories
async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories')
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch categories')
  }
  const data = await res.json()
  return data.data
}

async function createCategory(input: {
  name: string
  icon: string
  color?: string
  isDefault?: boolean
}): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create category')
  }
  const data = await res.json()
  return data.data
}

async function updateCategory(
  id: string,
  input: {
    name?: string
    icon?: string
    color?: string
  }
): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update category')
  }
  const data = await res.json()
  return data.data
}

async function deleteCategory(id: string, reassignTo?: string): Promise<void> {
  const url = reassignTo
    ? `/api/categories/${id}?reassignTo=${reassignTo}`
    : `/api/categories/${id}`
  
  const res = await fetch(url, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to delete category')
  }
}

// ============================================
// REACT QUERY HOOKS
// ============================================

// Query Keys
const queryKeys = {
  currentPeriod: ['period', 'current'] as const,
  periods: ['periods'] as const,
  budgetAdditions: (periodId: string) => ['budgets', periodId] as const,
  expenses: (periodId: string) => ['expenses', periodId] as const,
  categories: ['categories'] as const,
}

// Periods Hooks
export function useCurrentPeriod() {
  return useQuery({
    queryKey: queryKeys.currentPeriod,
    queryFn: fetchCurrentPeriod,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function usePeriods() {
  return useQuery({
    queryKey: queryKeys.periods,
    queryFn: fetchPeriods,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreatePeriod() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periods })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod })
    },
  })
}

export function useClosePeriod() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: closePeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periods })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod })
    },
  })
}

// Budget Additions Hooks
export function useBudgetAdditions(periodId: string) {
  return useQuery({
    queryKey: queryKeys.budgetAdditions(periodId),
    queryFn: () => fetchBudgetAdditions(periodId),
    enabled: !!periodId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateBudgetAddition() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createBudgetAddition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetAdditions(variables.periodId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(variables.periodId) })
    },
  })
}

export function useDeleteBudgetAddition() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteBudgetAddition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod })
    },
  })
}

// Expenses Hooks
export function useExpenses(periodId: string) {
  return useQuery({
    queryKey: queryKeys.expenses(periodId),
    queryFn: () => fetchExpenses(periodId),
    enabled: !!periodId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createExpense,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(variables.periodId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof updateExpense>[1]) =>
      updateExpense(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod })
    },
  })
}

// Categories Hooks
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof updateCategory>[1]) =>
      updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
      deleteCategory(id, reassignTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

// ============================================
// COMBINED HOOK
// ============================================

export function useBudgetData() {
  const currentPeriod = useCurrentPeriod()
  const categories = useCategories()
  
  const periodId = currentPeriod.data?.id
  const expenses = useExpenses(periodId || '')
  const budgetAdditions = useBudgetAdditions(periodId || '')
  
  return {
    // Periods
    currentPeriod: currentPeriod.data,
    isLoadingPeriod: currentPeriod.isLoading,
    periodError: currentPeriod.error,
    
    // Budget Additions
    budgetAdditions: budgetAdditions.data || [],
    isLoadingBudgets: budgetAdditions.isLoading,
    budgetsError: budgetAdditions.error,
    
    // Expenses
    expenses: expenses.data || [],
    isLoadingExpenses: expenses.isLoading,
    expensesError: expenses.error,
    
    // Categories
    categories: categories.data || [],
    isLoadingCategories: categories.isLoading,
    categoriesError: categories.error,
    
    // Combined loading state
    isLoading: currentPeriod.isLoading || budgetAdditions.isLoading || expenses.isLoading || categories.isLoading,
    
    // Mutations (available via separate hooks)
    createExpense: useCreateExpense(),
    updateExpense: useUpdateExpense(),
    deleteExpense: useDeleteExpense(),
    createBudgetAddition: useCreateBudgetAddition(),
    createCategory: useCreateCategory(),
  }
}
