import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { createBudgetAdditionSchema } from '@/lib/validations/api-schemas'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/budgets?periodId=xxx - Get budget additions for a period
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

    // Get budget additions
    const budgetAdditions = await prisma.budgetAddition.findMany({
      where: {
        periodId,
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: budgetAdditions,
    })
  } catch (error) {
    console.error('GET /api/budgets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/budgets - Create budget addition with snapshot
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = createBudgetAdditionSchema.parse(body)

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

    // Validate comments required for ADJUSTMENT and DEDUCTION
    if ((validated.type === 'ADJUSTMENT' || validated.type === 'DEDUCTION') && !validated.comments) {
      return NextResponse.json(
        { error: 'Comments are required for adjustments and deductions' },
        { status: 400 }
      )
    }

    // Calculate budget snapshot
    // 1. Get all previous budget additions
    const previousAdditions = await prisma.budgetAddition.findMany({
      where: { periodId: validated.periodId },
      select: { amount: true, type: true },
    })

    // 2. Calculate current budget
    let currentBudget = 0
    for (const addition of previousAdditions) {
      const amount = Number(addition.amount)
      if (addition.type === 'INCOME') {
        currentBudget += amount
      } else if (addition.type === 'ADJUSTMENT') {
        currentBudget += amount
      } else if (addition.type === 'DEDUCTION') {
        currentBudget -= amount
      }
    }

    // 3. Get all expenses to subtract
    const expenses = await prisma.expense.findMany({
      where: { periodId: validated.periodId },
      select: { amount: true },
    })

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    currentBudget -= totalExpenses

    // 4. Calculate budget after this addition
    const budgetBefore = currentBudget
    let budgetAfter = currentBudget

    if (validated.type === 'INCOME') {
      budgetAfter += validated.amount
    } else if (validated.type === 'ADJUSTMENT') {
      budgetAfter += validated.amount
    } else if (validated.type === 'DEDUCTION') {
      budgetAfter -= validated.amount
    }

    // 5. Create budget addition with snapshot
    const budgetAddition = await prisma.budgetAddition.create({
      data: {
        periodId: validated.periodId,
        type: validated.type,
        amount: new Decimal(validated.amount),
        source: validated.source,
        date: validated.date ? new Date(validated.date) : new Date(),
        comments: validated.comments,
        budgetBefore: new Decimal(budgetBefore),
        budgetAfter: new Decimal(budgetAfter),
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: budgetAddition,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('POST /api/budgets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
