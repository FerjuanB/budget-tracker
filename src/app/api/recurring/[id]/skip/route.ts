import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/recurring/[id]/skip
 * 
 * Marks a pending recurring instance as SKIPPED (user didn't want to apply it this cycle).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const instance = await prisma.recurringInstance.findFirst({
      where: { id, status: 'PENDING' },
      include: { recurring: { select: { userId: true } } },
    })

    if (!instance) {
      return NextResponse.json({ error: 'Pending instance not found' }, { status: 404 })
    }

    if (instance.recurring.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.recurringInstance.update({
      where: { id },
      data: {
        status: 'SKIPPED',
        skippedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('POST /api/recurring/[id]/skip error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
