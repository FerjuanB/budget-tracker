import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create test user
  const passwordHash = await bcrypt.hash('testpassword123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash,
      name: 'Test User',
    },
  })

  console.log('✅ User created:', user.email)

  // Create default categories
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

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: cat.name,
        },
      },
      update: {},
      create: {
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    })
  }

  console.log('✅ Default categories created')

  // Create initial active period
  const period = await prisma.period.create({
    data: {
      userId: user.id,
      startDate: new Date(),
      status: 'ACTIVE',
    },
  })

  console.log('✅ Initial period created:', period.id)
  console.log('   Status:', period.status)
  console.log('   Started:', period.startDate.toISOString())

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📝 Test credentials:')
  console.log('   Email: test@example.com')
  console.log('   Password: testpassword123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
