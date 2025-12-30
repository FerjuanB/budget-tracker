import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validated.email,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        name: validated.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    // Create default categories for new user
    const defaultCategories = [
      { name: 'Alimentación', icon: '🍔', color: '#fbbf24' },
      { name: 'Vivienda', icon: '🏠', color: '#8b5cf6' },
      { name: 'Transporte', icon: '🚗', color: '#3b82f6' },
      { name: 'Salud', icon: '💊', color: '#ef4444' },
      { name: 'Vestimenta', icon: '👕', color: '#ec4899' },
      { name: 'Entretenimiento', icon: '🎬', color: '#f97316' },
      { name: 'Educación', icon: '📚', color: '#10b981' },
      { name: 'Servicios', icon: '💡', color: '#6366f1' },
      { name: 'Otros', icon: '📌', color: '#6b7280' },
    ]

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      })),
    })

    // Create initial active period
    await prisma.period.create({
      data: {
        userId: user.id,
        startDate: new Date(),
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario creado exitosamente',
        data: user,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('POST /api/auth/register error:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
