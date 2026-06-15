'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================
// TYPES
// ============================================

export type RecurrenceFrequency = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY'
export type RecurringStatus = 'PENDING' | 'APPLIED' | 'SKIPPED' | 'EDITED'

export interface RecurringInstance {
  id: string
  recurringId: string
  amount: number
  dueDate: string
  installmentNum: number
  installmentTotal: number
  status: RecurringStatus
  appliedAt: string | null
  skippedAt: string | null
  note: string | null
  createdAt: string
  expense?: {
    id: string
    amount: number
    date: string
  } | null
}

export interface RecurringExpense {
  id: string
  userId: string
  categoryId: string
  name: string
  icon: string | null
  baseAmount: number
  isVariable: boolean
  frequency: RecurrenceFrequency
  dayOfMonth: number | null
  everyNMonths: number
  splitInto: number
  splitDayOffset: number | null
  isActive: boolean
  startDate: string
  endDate: string | null
  lastGeneratedAt: string | null
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    icon: string
    color: string | null
  }
  instances?: RecurringInstance[]
}

export interface CreateRecurringInput {
  categoryId: string
  name: string
  icon?: string
  baseAmount: number
  isVariable?: boolean
  frequency?: RecurrenceFrequency
  dayOfMonth?: number | null
  everyNMonths?: number
  splitInto?: number
  splitDayOffset?: number | null
  startDate?: string
}

export interface UpdateRecurringInput {
  name?: string
  icon?: string | null
  baseAmount?: number
  isVariable?: boolean
  categoryId?: string
  frequency?: RecurrenceFrequency
  dayOfMonth?: number | null
  everyNMonths?: number
  splitInto?: number
  splitDayOffset?: number | null
  isActive?: boolean
  endDate?: string | null
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchRecurringExpenses(includePending = false): Promise<RecurringExpense[]> {
  const url = includePending ? '/api/recurring?pending=true' : '/api/recurring'
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch' }))
    throw new Error(error.error || 'Failed to fetch recurring expenses')
  }
  const data = await res.json()
  return data.data
}

async function fetchRecurringById(id: string): Promise<RecurringExpense> {
  const res = await fetch(`/api/recurring/${id}`)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Not found' }))
    throw new Error(error.error || 'Not found')
  }
  const data = await res.json()
  return data.data
}

async function createRecurring(input: CreateRecurringInput): Promise<RecurringExpense> {
  const res = await fetch('/api/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create')
  }
  const data = await res.json()
  return data.data
}

async function updateRecurring(params: { id: string; data: UpdateRecurringInput }): Promise<RecurringExpense> {
  const res = await fetch(`/api/recurring/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update')
  }
  const data = await res.json()
  return data.data
}

async function deleteRecurring(id: string): Promise<void> {
  const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to delete')
  }
}

async function applyInstance(params: { instanceId: string; periodId: string; amount?: number; comments?: string }) {
  const res = await fetch(`/api/recurring/${params.instanceId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periodId: params.periodId,
      amount: params.amount,
      comments: params.comments,
    }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to apply')
  }
  const data = await res.json()
  return data.data
}

async function skipInstance(instanceId: string) {
  const res = await fetch(`/api/recurring/${instanceId}/skip`, { method: 'POST' })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to skip')
  }
  const data = await res.json()
  return data.data
}

// ============================================
// QUERY HOOKS
// ============================================

export function useRecurringExpenses(includePending = true) {
  return useQuery({
    queryKey: ['recurring', { pending: includePending }],
    queryFn: () => fetchRecurringExpenses(includePending),
  })
}

export function useRecurringById(id: string | null) {
  return useQuery({
    queryKey: ['recurring', id],
    queryFn: () => fetchRecurringById(id!),
    enabled: !!id,
  })
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
    },
  })
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
    },
  })
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
    },
  })
}

export function useApplyRecurringInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applyInstance,
    onSuccess: () => {
      // Invalidate both recurring list AND expenses list (since we just generated one)
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['period', 'current'] })
    },
  })
}

export function useSkipRecurringInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: skipInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
    },
  })
}
