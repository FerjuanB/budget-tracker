import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { createCategorySchema } from '@/lib/validations/api-schemas'
import { z } from 'zod'

// GET /api/categories - Get all categories for user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { isDefault: 'desc' }, // Default categories first
        { name: 'asc' }, // Then alphabetically
      ],
      include: {
        _count: {
          select: {
            expenses: true, // Count of expenses using this category
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = createCategorySchema.parse(body)

    // Check if category name already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: validated.name,
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name: validated.name,
        icon: validated.icon,
        color: validated.color,
        isDefault: validated.isDefault || false,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: category,
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
    console.error('POST /api/categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
