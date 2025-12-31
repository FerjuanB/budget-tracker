import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { createExpenseSchema } from '@/lib/validations/api-schemas'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/expenses?periodId=xxx - Get expenses for a period
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')

    if (!periodId) {
      return NextResponse.json(
        { error: 'periodId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify period belongs to user
    const period = await prisma.period.findFirst({
      where: {
        id: periodId,
        userId: user.id,
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    // Get expenses with category info
    const expenses = await prisma.expense.findMany({
      where: {
        periodId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: expenses,
    })
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create expense with budget snapshot
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = createExpenseSchema.parse(body)

    // Verify period belongs to user and is active
    const period = await prisma.period.findFirst({
      where: {
        id: validated.periodId,
        userId: user.id,
        status: 'ACTIVE',
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Active period not found' },
        { status: 404 }
      )
    }

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: validated.categoryId,
        userId: user.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // ============================================
    // CRITICAL: Calculate budget snapshot
    // ============================================

    // 1. Get all budget additions for this period
    const budgetAdditions = await prisma.budgetAddition.findMany({
      where: { periodId: validated.periodId },
      select: { amount: true, type: true },
    })

    // 2. Calculate total budget from additions
    let totalBudget = 0
    for (const addition of budgetAdditions) {
      const amount = Number(addition.amount)
      if (addition.type === 'INCOME') {
        totalBudget += amount
      } else if (addition.type === 'ADJUSTMENT') {
        totalBudget += amount
      } else if (addition.type === 'DEDUCTION') {
        totalBudget -= amount
      }
    }

    // 3. Get all existing expenses
    const existingExpenses = await prisma.expense.findMany({
      where: { periodId: validated.periodId },
      select: { amount: true },
    })

    const totalSpent = existingExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    )

    // 4. Calculate budget before and after this expense
    const budgetBefore = totalBudget - totalSpent
    const budgetAfter = budgetBefore - validated.amount

    // 5. Create expense with immutable snapshot
    const expense = await prisma.expense.create({
      data: {
        periodId: validated.periodId,
        categoryId: validated.categoryId,
        expenseName: validated.expenseName,
        amount: new Decimal(validated.amount),
        date: validated.date ? new Date(validated.date) : new Date(),
        comments: validated.comments,
        budgetBefore: new Decimal(budgetBefore),
        budgetAfter: new Decimal(budgetAfter),
        snapshotAt: new Date(),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: expense,
        snapshot: {
          totalBudget,
          totalSpent: totalSpent + validated.amount,
          budgetBefore,
          budgetAfter,
          percentageUsed: totalBudget > 0 ? ((totalSpent + validated.amount) / totalBudget) * 100 : 0,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('POST /api/expenses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
