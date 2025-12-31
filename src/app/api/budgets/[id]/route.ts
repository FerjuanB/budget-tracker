import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'

// GET /api/budgets/[id] - Get specific budget addition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const budgetAddition = await prisma.budgetAddition.findFirst({
      where: {
        id: id,
        period: {
          userId: user.id,
        },
      },
      include: {
        period: {
          select: {
            id: true,
            startDate: true,
            status: true,
          },
        },
      },
    })

    if (!budgetAddition) {
      return NextResponse.json(
        { error: 'Budget addition not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: budgetAddition,
    })
  } catch (error) {
    console.error('GET /api/budgets/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/budgets/[id] - Delete budget addition (only if period is ACTIVE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    // Verify budget addition belongs to user and period is active
    const budgetAddition = await prisma.budgetAddition.findFirst({
      where: {
        id: id,
        period: {
          userId: user.id,
          status: 'ACTIVE',
        },
      },
    })

    if (!budgetAddition) {
      return NextResponse.json(
        { error: 'Budget addition not found or period is closed' },
        { status: 404 }
      )
    }

    await prisma.budgetAddition.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Budget addition deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/budgets/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
