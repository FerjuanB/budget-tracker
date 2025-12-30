'use server'

import { signIn, signOut } from 'next-auth/react'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma'

export async function registerUser(email: string, password: string, name?: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('El usuario ya existe')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    return { success: true, user }
  } catch (error) {
    throw error
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (!result?.ok) {
      throw new Error('Credenciales inválidas')
    }

    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function logoutUser() {
  await signOut()
}