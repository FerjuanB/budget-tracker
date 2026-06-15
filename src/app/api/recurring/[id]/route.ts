import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(5).optional().nullable(),
  baseAmount: z.number().min(0).optional(),
  isVariable: z.boolean().optional(),
  categoryId: z.string().optional(),
  frequency: z.enum(['MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  dayOfMonth: z.number().int().min(1).max(28).nullable().optional(),
  everyNMonths: z.number().int().min(1).max(12).optional(),
  splitInto: z.number().int().min(1).max(12).optional(),
  splitDayOffset: z.number().int().min(1).max(28).nullable().optional(),
  isActive: z.boolean().optional(),
  endDate: z.string().nullable().optional(),
})

// GET /api/recurring/[id] - Get single recurring
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const recurring = await prisma.recurringExpense.findFirst({
      where: { id, userId: user.id },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
        instances: {
          orderBy: { dueDate: 'desc' },
          take: 10,
          include: {
            expense: {
              select: { id: true, amount: true, date: true },
            },
          },
        },
      },
    })

    if (!recurring) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: recurring })
  } catch (error) {
    console.error('GET /api/recurring/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/recurring/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // Verify ownership
    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updateData: any = { ...validated }
    if (validated.baseAmount !== undefined) {
      updateData.baseAmount = new Decimal(validated.baseAmount)
    }
    if (validated.endDate !== undefined && validated.endDate !== null) {
      updateData.endDate = new Date(validated.endDate)
    } else if (validated.endDate === null) {
      updateData.endDate = null
    }

    const updated = await prisma.recurringExpense.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('PUT /api/recurring/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/recurring/[id] - Delete recurring (keeps existing expenses intact)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete pending instances first (cascade handles it but explicit is cleaner)
    await prisma.recurringExpense.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/recurring/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
