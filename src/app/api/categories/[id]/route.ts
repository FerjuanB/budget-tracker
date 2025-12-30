import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { updateCategorySchema, deleteCategorySchema } from '@/lib/validations/api-schemas'
import { z } from 'zod'

// GET /api/categories/[id] - Get specific category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('GET /api/categories/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = updateCategorySchema.parse(body)

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with another category
    if (validated.name && validated.name !== existingCategory.name) {
      const nameConflict = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: validated.name,
          id: {
            not: params.id,
          },
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: {
        id: params.id,
      },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.icon && { icon: validated.icon }),
        ...(validated.color !== undefined && { color: validated.color }),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('PUT /api/categories/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category with reassignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    // Get reassignment category ID from query params
    const { searchParams } = new URL(request.url)
    const reassignToCategoryId = searchParams.get('reassignTo')

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has expenses
    if (category._count.expenses > 0) {
      // Reassignment required
      if (!reassignToCategoryId) {
        return NextResponse.json(
          {
            error: 'Cannot delete category with expenses. Provide reassignTo parameter.',
            details: {
              expenseCount: category._count.expenses,
            },
          },
          { status: 400 }
        )
      }

      // Verify reassignment category exists and belongs to user
      const reassignCategory = await prisma.category.findFirst({
        where: {
          id: reassignToCategoryId,
          userId: user.id,
        },
      })

      if (!reassignCategory) {
        return NextResponse.json(
          { error: 'Reassignment category not found' },
          { status: 404 }
        )
      }

      // Cannot reassign to the same category
      if (reassignToCategoryId === params.id) {
        return NextResponse.json(
          { error: 'Cannot reassign to the same category' },
          { status: 400 }
        )
      }

      // Perform reassignment in transaction
      await prisma.$transaction(async (tx) => {
        // Update all expenses to use new category
        await tx.expense.updateMany({
          where: {
            categoryId: params.id,
          },
          data: {
            categoryId: reassignToCategoryId,
          },
        })

        // Delete old category
        await tx.category.delete({
          where: {
            id: params.id,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Category deleted and expenses reassigned',
        reassignedTo: reassignCategory.name,
        reassignedCount: category._count.expenses,
      })
    } else {
      // No expenses, direct delete
      await prisma.category.delete({
        where: {
          id: params.id,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Category deleted successfully',
      })
    }
  } catch (error) {
    console.error('DELETE /api/categories/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
