import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const confirmSchema = z.object({
  ocrScanId: z.string().min(1),
  periodId: z.string().min(1),
  categoryId: z.string().min(1),
  expenseName: z.string().min(1).max(200),
  amount: z.number().positive(),
  date: z.string(),
  comments: z.string().optional(),
})

/**
 * POST /api/ocr/confirm
 * 
 * After the user has reviewed/edited the OCR preview, call this endpoint
 * to create the Expense and mark the OcrScan as CONFIRMED.
 * 
 * Uses the same budget snapshot logic as POST /api/expenses.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = confirmSchema.parse(body)

    // Fetch & verify OcrScan belongs to user and is still PENDING
    const scan = await prisma.ocrScan.findFirst({
      where: {
        id: validated.ocrScanId,
        userId: user.id,
        status: { in: ['PENDING', 'EDITED'] },
      },
    })

    if (!scan) {
      return NextResponse.json(
        { error: 'Escaneo OCR no encontrado o ya utilizado' },
        { status: 404 }
      )
    }

    // Verify period is active & belongs to user
    const period = await prisma.period.findFirst({
      where: { id: validated.periodId, userId: user.id, status: 'ACTIVE' },
    })
    if (!period) {
      return NextResponse.json({ error: 'No hay período activo' }, { status: 404 })
    }

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: validated.categoryId, userId: user.id },
    })
    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // ── Budget snapshot (same logic as POST /api/expenses) ────────────
    const budgetAdditions = await prisma.budgetAddition.findMany({
      where: { periodId: validated.periodId },
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
      where: { periodId: validated.periodId },
      select: { amount: true },
    })
    const totalSpent = existingExpenses.reduce((sum: number, e: { amount: Decimal }) => sum + Number(e.amount), 0)

    const budgetBefore = totalBudget - totalSpent
    const budgetAfter = budgetBefore - validated.amount

    // Track whether user edited compared to the parsed amount
    const parsedAny = scan.parsed as any
    const wasEdited = parsedAny && parsedAny.amount !== undefined &&
      Math.abs(parsedAny.amount - validated.amount) > 0.01

    // ── Transactional: create expense + update ocrScan ────────────────
    const expense = await prisma.$transaction(async (tx: any) => {
      const newExpense = await tx.expense.create({
        data: {
          periodId: validated.periodId,
          categoryId: validated.categoryId,
          expenseName: validated.expenseName,
          amount: new Decimal(validated.amount),
          date: new Date(validated.date),
          comments: validated.comments || `Escaneado desde ticket (OCR${wasEdited ? ', editado' : ''})`,
          budgetBefore: new Decimal(budgetBefore),
          budgetAfter: new Decimal(budgetAfter),
          snapshotAt: new Date(),
          source: wasEdited ? 'OCR' : 'OCR', // both OCR, but comments flag edited
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      })

      await tx.ocrScan.update({
        where: { id: validated.ocrScanId },
        data: {
          expenseId: newExpense.id,
          status: wasEdited ? 'EDITED' : 'CONFIRMED',
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
    console.error('POST /api/ocr/confirm error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
