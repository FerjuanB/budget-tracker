import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/periods/current - Get current active period with full details
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const period = await prisma.period.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        budgetAdditions: {
          orderBy: {
            date: 'desc',
          },
          include: {
            period: {
              select: {
                id: true,
                startDate: true,
              },
            },
          },
        },
        expenses: {
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' },
          ],
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
        },
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'No active period found' },
        { status: 404 }
      )
    }

    // Calculate budget summary
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
    const now = new Date()
    const durationDays = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Budget status
    let budgetStatus: 'safe' | 'caution' | 'warning' | 'danger' | 'over' = 'safe'
    if (remainingBudget < 0) {
      budgetStatus = 'over'
    } else if (remainingBudget === 0) {
      budgetStatus = 'danger'
    } else {
      const percentageRemaining = (remainingBudget / totalBudget) * 100
      if (percentageRemaining < 10) {
        budgetStatus = 'danger'
      } else if (percentageRemaining < 25) {
        budgetStatus = 'warning'
      } else if (percentageRemaining < 50) {
        budgetStatus = 'caution'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...period,
        summary: {
          totalIncome,
          totalAdjustments,
          totalDeductions,
          totalBudget,
          totalExpenses,
          remainingBudget,
          durationDays,
          budgetStatus,
          percentageUsed: totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0,
        },
      },
    })
  } catch (error) {
    console.error('GET /api/periods/current error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
