import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const applySchema = z.object({
  amount: z.number().positive().optional(), // override for variable expenses
  periodId: z.string().min(1),
  comments: z.string().optional(),
})

/**
 * POST /api/recurring/[id]/apply
 * 
 * Applies a pending RecurringInstance:
 * 1. Creates an Expense linked to the instance
 * 2. Marks the instance as APPLIED or EDITED
 * 3. Calculates budget snapshot like normal expenses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params // This is the recurringInstanceId
    const body = await request.json()
    const validated = applySchema.parse(body)

    // Fetch the PENDING instance with its recurring template
    const instance = await prisma.recurringInstance.findFirst({
      where: { id, status: 'PENDING' },
      include: {
        recurring: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!instance) {
      return NextResponse.json(
        { error: 'Pending instance not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (instance.recurring.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify period
    const period = await prisma.period.findFirst({
      where: { id: validated.periodId, userId: user.id, status: 'ACTIVE' },
    })
    if (!period) {
      return NextResponse.json({ error: 'Active period not found' }, { status: 404 })
    }

    const finalAmount = validated.amount ?? Number(instance.amount)
    const wasEdited = validated.amount !== undefined && Math.abs(validated.amount - Number(instance.amount)) > 0.01

    // ── Calculate budget snapshot (same logic as POST /api/expenses) ──
    const budgetAdditions = await prisma.budgetAddition.findMany({
      where: { periodId: period.id },
      select: { amount: true, type: true },
    })

    let totalBudget = 0
    for (const addition of budgetAdditions) {
      const amount = Number(addition.amount)
      if (addition.type === 'DEDUCTION') {
        totalBudget -= amount
      } else {
        totalBudget += amount
      }
    }

    const existingExpenses = await prisma.expense.findMany({
      where: { periodId: period.id },
      select: { amount: true },
    })
    const totalSpent = existingExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

    const budgetBefore = totalBudget - totalSpent
    const budgetAfter = budgetBefore - finalAmount

    // ── Build expense name (e.g., "Edenor - Cuota 1/2") ──
    let expenseName = instance.recurring.name
    if (instance.installmentTotal > 1) {
      expenseName = `${instance.recurring.name} - Cuota ${instance.installmentNum}/${instance.installmentTotal}`
    }

    // ── Create expense (transactional with instance update) ──
    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          periodId: period.id,
          categoryId: instance.recurring.categoryId,
          expenseName,
          amount: new Decimal(finalAmount),
          date: new Date(instance.dueDate),
          comments: validated.comments || (
            wasEdited
              ? `Monto editado: ${Number(instance.amount).toLocaleString()} → ${finalAmount.toLocaleString()}`
              : 'Generado desde gasto recurrente'
          ),
          budgetBefore: new Decimal(budgetBefore),
          budgetAfter: new Decimal(budgetAfter),
          snapshotAt: new Date(),
          source: wasEdited ? 'RECURRING_EDITED' : 'RECURRING_AUTO',
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      })

      await tx.recurringInstance.update({
        where: { id: instance.id },
        data: {
          expenseId: newExpense.id,
          status: wasEdited ? 'EDITED' : 'APPLIED',
          appliedAt: new Date(),
        },
      })

      return newExpense
    })

    return NextResponse.json({
      success: true,
      data: expense,
      snapshot: { budgetBefore, budgetAfter, totalBudget },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('POST /api/recurring/[id]/apply error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
