import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { createPeriodSchema } from '@/lib/validations/api-schemas'
import { z } from 'zod'

// GET /api/periods - Get all periods for user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const periods = await prisma.period.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { status: 'desc' }, // ACTIVE first
        { startDate: 'desc' }, // Then most recent
      ],
      include: {
        budgetAdditions: {
          select: {
            amount: true,
            type: true,
          },
        },
        expenses: {
          select: {
            amount: true,
          },
        },
      },
    })

    // Calculate summary for each period
    const periodsWithSummary = periods.map((period) => {
      const totalIncome = period.budgetAdditions
        .filter((b) => b.type === 'INCOME')
        .reduce((sum, b) => sum + Number(b.amount), 0)

      const totalAdjustments = period.budgetAdditions
        .filter((b) => b.type === 'ADJUSTMENT')
        .reduce((sum, b) => sum + Number(b.amount), 0)

      const totalDeductions = period.budgetAdditions
        .filter((b) => b.type === 'DEDUCTION')
        .reduce((sum, b) => sum + Number(b.amount), 0)

      const totalBudget = totalIncome + totalAdjustments - totalDeductions

      const totalExpenses = period.expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      )

      const remainingBudget = totalBudget - totalExpenses

      // Calculate duration
      const startDate = new Date(period.startDate)
      const endDate = period.endDate ? new Date(period.endDate) : new Date()
      const durationDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        ...period,
        summary: {
          totalIncome,
          totalAdjustments,
          totalDeductions,
          totalBudget,
          totalExpenses,
          remainingBudget,
          durationDays,
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: periodsWithSummary,
    })
  } catch (error) {
    console.error('GET /api/periods error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/periods - Create new period
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = createPeriodSchema.parse(body)

    // Check if there's already an active period
    const activePeriod = await prisma.period.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
    })

    if (activePeriod) {
      return NextResponse.json(
        { error: 'Cannot create new period. There is already an active period. Close it first.' },
        { status: 400 }
      )
    }

    // Create new period
    const period = await prisma.period.create({
      data: {
        userId: user.id,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: period,
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
    console.error('POST /api/periods error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
