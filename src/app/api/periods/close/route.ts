import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { closePeriodSchema } from '@/lib/validations/api-schemas'
import { z } from 'zod'

// POST /api/periods/close - Close a period and generate summary
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = closePeriodSchema.parse(body)

    // Get period with all data
    const period = await prisma.period.findFirst({
      where: {
        id: validated.periodId,
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        budgetAdditions: true,
        expenses: {
          include: {
            category: {
              select: {
                name: true,
                icon: true,
              },
            },
          },
        },
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found or already closed' },
        { status: 404 }
      )
    }

    // Calculate summary
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
    const endDate = new Date()
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Group expenses by category
    const expensesByCategory = period.expenses.reduce((acc, expense) => {
      const categoryName = expense.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: categoryName,
          icon: expense.category.icon,
          total: 0,
          count: 0,
        }
      }
      acc[categoryName].total += Number(expense.amount)
      acc[categoryName].count += 1
      return acc
    }, {} as Record<string, { category: string; icon: string; total: number; count: number }>)

    const categoryBreakdown = Object.values(expensesByCategory).sort(
      (a, b) => b.total - a.total
    )

    // Create summary JSON
    const summary = {
      period: {
        startDate: period.startDate.toISOString(),
        endDate: endDate.toISOString(),
        durationDays,
      },
      budget: {
        totalIncome,
        totalAdjustments,
        totalDeductions,
        totalBudget,
        items: period.budgetAdditions.map((b) => ({
          id: b.id,
          type: b.type,
          amount: Number(b.amount),
          source: b.source,
          comments: b.comments,
          date: b.date?.toISOString(),
        })),
      },
      expenses: {
        total: totalExpenses,
        count: period.expenses.length,
        average: period.expenses.length > 0 ? totalExpenses / period.expenses.length : 0,
        byCategory: categoryBreakdown,
      },
      result: {
        remainingBudget,
        overBudget: remainingBudget < 0,
        percentageUsed: totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0,
      },
    }

    // Update period to closed
    const closedPeriod = await prisma.period.update({
      where: {
        id: validated.periodId,
      },
      data: {
        status: 'CLOSED',
        endDate,
        closedAt: new Date(),
        durationDays,
        summaryJson: JSON.stringify(summary),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        period: closedPeriod,
        summary,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('POST /api/periods/close error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
