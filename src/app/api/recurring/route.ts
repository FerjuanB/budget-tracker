import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const recurringBaseSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  icon: z.string().max(5).optional(),
  baseAmount: z.number().min(0), // 0 allowed for variable expenses
  isVariable: z.boolean().optional().default(false),
  frequency: z.enum(['MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  dayOfMonth: z.number().int().min(1).max(28).nullable().optional(),
  everyNMonths: z.number().int().min(1).max(12).optional().default(1),
  splitInto: z.number().int().min(1).max(12).optional().default(1),
  splitDayOffset: z.number().int().min(1).max(28).nullable().optional(),
  startDate: z.string().optional(),
})

// Create: require valid amount unless isVariable=true
const createRecurringSchema = recurringBaseSchema.refine(
  (data) => data.isVariable || data.baseAmount > 0,
  {
    message: 'Ingresá un monto válido, o marcá la opción "Monto variable"',
    path: ['baseAmount'],
  }
)

// Update: all fields partial, no cross-field validation needed
const updateRecurringSchema = recurringBaseSchema.partial()

// GET /api/recurring - List all recurring expenses
// GET /api/recurring?pending=true - List pending instances for current period
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const includePending = searchParams.get('pending') === 'true'

    const recurring = await prisma.recurringExpense.findMany({
      where: { userId: user.id },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
        ...(includePending && {
          instances: {
            where: {
              status: 'PENDING',
              dueDate: { lte: new Date() },
            },
            orderBy: { dueDate: 'asc' },
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: recurring })
  } catch (error) {
    console.error('GET /api/recurring error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/recurring - Create new recurring expense
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = createRecurringSchema.parse(body)

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: validated.categoryId, userId: user.id },
    })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const recurring = await prisma.recurringExpense.create({
      data: {
        userId: user.id,
        categoryId: validated.categoryId,
        name: validated.name,
        icon: validated.icon,
        baseAmount: new Decimal(validated.baseAmount),
        isVariable: validated.isVariable ?? false,
        frequency: validated.frequency,
        dayOfMonth: validated.dayOfMonth,
        everyNMonths: validated.everyNMonths ?? 1,
        splitInto: validated.splitInto ?? 1,
        splitDayOffset: validated.splitDayOffset,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: recurring }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('POST /api/recurring error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
