import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { updatePeriodSchema } from '@/lib/validations/api-schemas'
import { z } from 'zod'

// GET /api/periods/[id] - Get specific period
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const period = await prisma.period.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        budgetAdditions: {
          orderBy: {
            date: 'desc',
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
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: period,
    })
  } catch (error) {
    console.error('GET /api/periods/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/periods/[id] - Update period (limited fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = updatePeriodSchema.parse(body)

    // Verify period belongs to user
    const existingPeriod = await prisma.period.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingPeriod) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    // Only allow updating endDate and summaryJson (manually)
    const updatedPeriod = await prisma.period.update({
      where: {
        id: params.id,
      },
      data: {
        ...(validated.endDate && { endDate: new Date(validated.endDate) }),
        ...(validated.summaryJson && { summaryJson: validated.summaryJson }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedPeriod,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('PUT /api/periods/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/periods/[id] - Delete period (only if no expenses/budgets)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    // Verify period belongs to user and check for related data
    const period = await prisma.period.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            budgetAdditions: true,
            expenses: true,
          },
        },
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if has expenses or budget additions
    if (period._count.expenses > 0 || period._count.budgetAdditions > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete period with expenses or budget additions',
          details: {
            expenses: period._count.expenses,
            budgetAdditions: period._count.budgetAdditions,
          },
        },
        { status: 400 }
      )
    }

    await prisma.period.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Period deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/periods/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
