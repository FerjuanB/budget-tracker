import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { updateExpenseSchema } from '@/lib/validations/api-schemas'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/expenses/[id] - Get specific expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const expense = await prisma.expense.findFirst({
      where: {
        id: id,
        period: {
          userId: user.id,
        },
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
        period: {
          select: {
            id: true,
            startDate: true,
            status: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: expense,
    })
  } catch (error) {
    console.error('GET /api/expenses/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/expenses/[id] - Update expense (preserves original snapshot)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = updateExpenseSchema.parse(body)

    // Verify expense belongs to user and period is active
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: id,
        period: {
          userId: user.id,
          status: 'ACTIVE',
        },
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found or period is closed' },
        { status: 404 }
      )
    }

    // Verify category if being changed
    if (validated.categoryId) {
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
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validated.expenseName) {
      updateData.expenseName = validated.expenseName
    }

    if (validated.categoryId) {
      updateData.categoryId = validated.categoryId
    }

    if (validated.date) {
      updateData.date = new Date(validated.date)
    }

    if (validated.comments !== undefined) {
      updateData.comments = validated.comments
    }

    // IMPORTANT: If amount changes, store original amount
    if (validated.amount && validated.amount !== Number(existingExpense.amount)) {
      updateData.amount = new Decimal(validated.amount)
      
      // Store original amount if this is the first edit
      if (!existingExpense.originalAmount) {
        updateData.originalAmount = existingExpense.amount
      }
      
      // NOTE: We do NOT recalculate budgetBefore/budgetAfter
      // The snapshot remains immutable as per design
    }

    const updatedExpense = await prisma.expense.update({
      where: {
        id: id,
      },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: updatedExpense,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('PUT /api/expenses/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/[id] - Delete expense (only if period is ACTIVE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    // Verify expense belongs to user and period is active
    const expense = await prisma.expense.findFirst({
      where: {
        id: id,
        period: {
          userId: user.id,
          status: 'ACTIVE',
        },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found or period is closed' },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
