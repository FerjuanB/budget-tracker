import { z } from 'zod'

// ============================================
// PERIOD SCHEMAS
// ============================================

export const createPeriodSchema = z.object({
  startDate: z.string().datetime().optional(),
})

export const updatePeriodSchema = z.object({
  endDate: z.string().datetime().optional(),
  summaryJson: z.string().optional(),
})

export const closePeriodSchema = z.object({
  periodId: z.string().cuid(),
})

// ============================================
// BUDGET ADDITION SCHEMAS
// ============================================

export const createBudgetAdditionSchema = z.object({
  periodId: z.string().cuid(),
  type: z.enum(['INCOME', 'ADJUSTMENT', 'DEDUCTION']),
  amount: z.number().positive().multipleOf(0.01),
  source: z.string().min(1).max(100),
  date: z.string().datetime().optional(),
  comments: z.string().max(500).optional(),
})

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const createExpenseSchema = z.object({
  periodId: z.string().cuid(),
  categoryId: z.string().cuid(),
  expenseName: z.string().min(1).max(100),
  amount: z.number().positive().multipleOf(0.01),
  date: z.string().datetime().optional(),
  comments: z.string().max(500).optional(),
})

export const updateExpenseSchema = z.object({
  expenseName: z.string().min(1).max(100).optional(),
  amount: z.number().positive().multipleOf(0.01).optional(),
  categoryId: z.string().cuid().optional(),
  date: z.string().datetime().optional(),
  comments: z.string().max(500).optional(),
})

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1).max(10),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isDefault: z.boolean().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export const deleteCategorySchema = z.object({
  reassignToCategoryId: z.string().cuid().optional(),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>
export type ClosePeriodInput = z.infer<typeof closePeriodSchema>

export type CreateBudgetAdditionInput = z.infer<typeof createBudgetAdditionSchema>

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>
