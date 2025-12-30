# IMPLEMENTATION_GUIDE.md - Budget Tracker Migration & Development

**Version:** 1.0  
**Date:** December 28, 2025  
**Author:** Fernando @ ProjectXInnovation  
**Related Documents:** PRODUCT.md, RESEARCH.md

---

## 🎯 Document Purpose

This is the concrete blueprint for migrating the existing Budget Tracker from Vite + React + localStorage to Next.js 14 + PostgreSQL. This guide provides step-by-step instructions, exact file structures, code patterns, and migration strategies to ensure an error-free implementation.

**Target Audience**: Coding agent or developer implementing the migration

---

## 📦 Phase 0: Pre-Migration Setup

### 0.1 Prerequisites Checklist

Before starting, verify you have:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Git installed and configured
- [ ] Supabase account with available project slot
- [ ] Vercel account (free tier)
- [ ] Access to existing `Control-de-gastos` codebase
- [ ] Code editor (VS Code recommended)

### 0.2 Create New Next.js Project

**Location**: Create OUTSIDE existing `Control-de-gastos` folder

```bash
# Navigate to projects folder
cd C:\Users\Fernando\Documents\FerJuan

# Create new Next.js 14 project
npx create-next-app@latest budget-tracker \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --use-npm

# When prompted:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? No
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? Yes (@/*)

cd budget-tracker
```

### 0.3 Install Dependencies

```bash
# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication
npm install next-auth@beta
npm install bcryptjs
npm install -D @types/bcryptjs

# State Management & Data Fetching
npm install @tanstack/react-query @tanstack/react-query-devtools

# Validation
npm install zod

# Offline Storage
npm install dexie dexie-react-hooks

# Date Utilities
npm install date-fns

# UI Libraries (from existing project)
npm install @headlessui/react @heroicons/react

# Notifications
npm install react-hot-toast

# Development Tools
npm install -D @types/node
```

### 0.4 Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file
```

### 0.5 Setup Supabase Database

**Steps**:
1. Go to https://supabase.com/dashboard
2. Create new project (Project #2 - "Budget Tracker")
3. Wait for database provisioning (~2 minutes)
4. Go to Project Settings → Database
5. Copy connection string (Transaction pooler)

**Update `.env`**:
```env
# Database URLs
DATABASE_URL="postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="generate-this-later"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET**:
```bash
# On Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Copy output to .env
```

---

## 📐 Phase 1: Database Schema Setup

### 1.1 Define Prisma Schema

**File**: `prisma/schema.prisma`

Replace entire content with:

```prisma
// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================
// USER MODEL
// ============================================
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  periods    Period[]
  categories Category[]

  @@map("users")
}

// ============================================
// PERIOD MODEL
// ============================================
model Period {
  id           String        @id @default(cuid())
  userId       String
  startDate    DateTime
  endDate      DateTime?
  status       PeriodStatus  @default(ACTIVE)
  durationDays Int?
  summaryJson  Json?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  closedAt     DateTime?

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  budgetAdditions BudgetAddition[]
  expenses        Expense[]

  @@index([userId, status])
  @@index([userId, startDate])
  @@map("periods")
}

enum PeriodStatus {
  ACTIVE
  CLOSED
}

// ============================================
// BUDGET ADDITION MODEL
// ============================================
model BudgetAddition {
  id           String     @id @default(cuid())
  periodId     String
  type         BudgetType
  amount       Decimal    @db.Decimal(10, 2)
  source       String
  date         DateTime
  comments     String?    @db.Text
  budgetBefore Decimal    @db.Decimal(10, 2)
  budgetAfter  Decimal    @db.Decimal(10, 2)
  createdAt    DateTime   @default(now())

  period Period @relation(fields: [periodId], references: [id], onDelete: Cascade)

  @@index([periodId])
  @@index([periodId, date])
  @@map("budget_additions")
}

enum BudgetType {
  INCOME
  ADJUSTMENT
  DEDUCTION
}

// ============================================
// EXPENSE MODEL
// ============================================
model Expense {
  id             String   @id @default(cuid())
  periodId       String
  categoryId     String
  expenseName    String
  amount         Decimal  @db.Decimal(10, 2)
  date           DateTime
  comments       String?  @db.Text
  budgetBefore   Decimal  @db.Decimal(10, 2)
  budgetAfter    Decimal  @db.Decimal(10, 2)
  snapshotAt     DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  originalAmount Decimal? @db.Decimal(10, 2)

  period   Period   @relation(fields: [periodId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id])

  @@index([periodId])
  @@index([periodId, date])
  @@index([categoryId])
  @@map("expenses")
}

// ============================================
// CATEGORY MODEL
// ============================================
model Category {
  id        String   @id @default(cuid())
  userId    String
  name      String
  icon      String
  color     String?
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expenses Expense[]

  @@unique([userId, name])
  @@index([userId])
  @@map("categories")
}
```

### 1.2 Create Initial Migration

```bash
# Create and apply migration
npx prisma migrate dev --name init

# This will:
# 1. Create migration SQL file in prisma/migrations/
# 2. Apply migration to Supabase database
# 3. Generate Prisma Client

# Generate Prisma Client (if not auto-generated)
npx prisma generate
```

**Expected Output**:
```
✔ Generated Prisma Client
✔ Migration applied successfully
```

### 1.3 Create Prisma Client Singleton

**File**: `lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why this pattern?**
- Prevents multiple Prisma Client instances in development (hot reload issue)
- Single client reused across requests

### 1.4 Seed Default Categories

**File**: `prisma/seed.ts`

```typescript
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

  // Create initial period
  const period = await prisma.period.create({
    data: {
      userId: user.id,
      startDate: new Date(),
      status: 'ACTIVE',
    },
  })

  console.log('✅ Initial period created:', period.id)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

**Add seed script to package.json**:
```json
{
  "scripts": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Install tsx for running TypeScript**:
```bash
npm install -D tsx
```

**Run seed**:
```bash
npm run seed
```

---

## 🔐 Phase 2: Authentication Setup

### 2.1 NextAuth Configuration

**File**: `lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

### 2.2 NextAuth API Route

**File**: `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### 2.3 Session Provider Wrapper

**File**: `components/providers/session-provider.tsx`

```typescript
'use client'

import { SessionProvider } from 'next-auth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

### 2.4 Update Root Layout

**File**: `app/layout.tsx`

```typescript
import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Budget Tracker',
  description: 'Family budget management application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

### 2.5 Create Login Page

**File**: `app/(public)/login/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Budget Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <p className="text-xs text-center text-gray-500 mt-4">
          Test account: test@example.com / testpassword123
        </p>
      </div>
    </div>
  )
}
```

### 2.6 Auth Middleware

**File**: `middleware.ts`

```typescript
export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/expenses/:path*',
    '/categories/:path*',
    '/history/:path*',
    '/settings/:path*',
  ],
}
```

---

## 🎨 Phase 3: Tailwind Configuration

### 3.1 Update Tailwind Config

**File**: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Budget status colors
        budget: {
          safe: '#10b981',
          caution: '#f59e0b',
          warning: '#f97316',
          danger: '#ef4444',
          over: '#dc2626',
        },
        
        // Category colors
        category: {
          food: '#fbbf24',
          housing: '#8b5cf6',
          transport: '#3b82f6',
          health: '#ef4444',
          clothing: '#ec4899',
          entertainment: '#f97316',
          education: '#10b981',
          utilities: '#6366f1',
          other: '#6b7280',
        },
        
        // UI state colors
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b',
        neutral: '#6b7280',
        
        // Period status
        period: {
          active: '#10b981',
          closed: '#6b7280',
        },
        
        // Budget types
        'budget-type': {
          income: '#10b981',
          adjustment: '#f59e0b',
          deduction: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

### 3.2 Update Global CSS

**File**: `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
  }
  
  .input-field {
    @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500;
  }
  
  .card {
    @apply bg-white rounded-lg shadow p-4;
  }
}
```

---

## 🔄 Phase 4: React Query Setup

### 4.1 Query Client Provider

**File**: `components/providers/query-provider.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### 4.2 Update Root Layout with Query Provider

**File**: `app/layout.tsx` (update)

```typescript
import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/session-provider'
import { QueryProvider } from '@/components/providers/query-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Budget Tracker',
  description: 'Family budget management application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## 🚀 Phase 5: Frontend Component Migration

### 5.1 Component Migration Mapping

**Current Structure** (`Control-de-gastos/src/components/`):

```
Control-de-gastos/src/components/
├── BudgetControl.tsx          # Budget summary display
├── BudgetForm.tsx             # Add budget form
├── ControlPresupuesto.tsx     # Budget control wrapper
├── ExpenseFilter.tsx          # Category filter
├── ExpenseForm.tsx            # Add/edit expense form
├── ExpenseList.tsx            # Expense list display
├── Header.tsx                 # App header
├── Modal.tsx                  # Modal wrapper
└── NewBudget.tsx              # Initial budget setup
```

**New Structure** (`budget-tracker/components/`):

```
budget-tracker/components/
├── layout/
│   ├── Header.tsx             # Migrated from Header.tsx
│   └── ProtectedLayout.tsx    # New: Auth wrapper
├── periods/
│   ├── PeriodHeader.tsx       # NEW: Period navigation
│   ├── PeriodSummary.tsx      # Adapted from BudgetControl.tsx
│   └── SavePeriodModal.tsx    # NEW: Close period
├── budgets/
│   ├── BudgetForm.tsx         # Migrated from BudgetForm.tsx
│   ├── BudgetHistory.tsx      # NEW: Budget list
│   └── BudgetSnapshot.tsx     # NEW: Impact display
├── expenses/
│   ├── ExpenseList.tsx        # Migrated from ExpenseList.tsx
│   ├── ExpenseForm.tsx        # Enhanced from ExpenseForm.tsx
│   ├── ExpenseDetailModal.tsx # NEW: Detail view
│   ├── ExpenseFilter.tsx      # Migrated from ExpenseFilter.tsx
│   └── CompactExpenseCard.tsx # NEW: List item
├── categories/
│   ├── CategoryManager.tsx    # NEW: CRUD management
│   ├── CategoryBadge.tsx      # NEW: Display badge
│   └── CategoryPicker.tsx     # NEW: Selector
└── ui/
    ├── Button.tsx             # NEW: Reusable button
    ├── Input.tsx              # NEW: Reusable input
    ├── Modal.tsx              # Migrated from Modal.tsx
    └── Toast.tsx              # NEW: Notifications
```

### 5.2 Migration Strategy for Each Component

#### **Rule 1: Identify Server vs Client Components**

**Server Components** (default, no directive needed):
- Static displays
- Initial data fetching
- Layouts
- Headers (if no interactive state)

**Client Components** (add `'use client'` at top):
- Forms with `useState`
- Event handlers (`onClick`, `onChange`)
- Modals
- Interactive UI elements
- Components using `useQuery`/`useMutation`

#### **Rule 2: Component Migration Checklist**

For EACH component:
1. [ ] Copy file to new location
2. [ ] Add `'use client'` if uses hooks/events
3. [ ] Update imports (remove relative paths, use `@/`)
4. [ ] Replace Context API with TanStack Query (if applicable)
5. [ ] Update TypeScript types
6. [ ] Test component in isolation

### 5.3 Example Migration: ExpenseForm

**BEFORE** (`Control-de-gastos/src/components/ExpenseForm.tsx`):

```typescript
// OLD CODE (don't copy this, it's just for reference)
import { useState } from 'react'
import { useBudget } from '../hooks/useBudget'
import { categories } from '../data/categories'

export default function ExpenseForm() {
  const { dispatch, state } = useBudget()
  const [expense, setExpense] = useState({
    expenseName: '',
    amount: 0,
    category: '',
    date: new Date()
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch({
      type: 'add-expense',
      payload: { expense }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

**AFTER** (`budget-tracker/components/expenses/ExpenseForm.tsx`):

```typescript
'use client' // CRITICAL: Add this directive

import { useState } from 'react'
import { useCreateExpense } from '@/lib/queries/use-expenses'
import { useCategories } from '@/lib/queries/use-categories'
import { calculateBudgetImpact } from '@/lib/utils/budget-calculator'

interface ExpenseFormProps {
  periodId: string
  onSuccess?: () => void
}

export function ExpenseForm({ periodId, onSuccess }: ExpenseFormProps) {
  const [expenseName, setExpenseName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [comments, setComments] = useState('')

  // Use TanStack Query instead of Context API
  const createExpense = useCreateExpense()
  const { data: categories } = useCategories()

  // Live budget preview calculation
  const budgetImpact = calculateBudgetImpact(periodId, Number(amount))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createExpense.mutateAsync({
        periodId,
        expenseName,
        amount: Number(amount),
        categoryId,
        date: new Date(date),
        comments: comments || undefined,
      })

      // Reset form
      setExpenseName('')
      setAmount('')
      setComments('')
      
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create expense:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="expenseName" className="block text-sm font-medium text-gray-700">
          Expense Name *
        </label>
        <input
          id="expenseName"
          type="text"
          required
          maxLength={50}
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount *
        </label>
        <input
          id="amount"
          type="number"
          required
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Live Budget Preview */}
      {amount && budgetImpact && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">💰 Budget Impact Preview:</p>
          <p className="text-sm text-gray-600">
            Current: ${budgetImpact.current}
          </p>
          <p className="text-sm text-gray-600">
            After: ${budgetImpact.after} ({budgetImpact.difference})
          </p>
          <p className={`text-sm font-medium ${budgetImpact.status === 'over' ? 'text-red-600' : 'text-green-600'}`}>
            {budgetImpact.status === 'over' ? '⚠️ Over Budget' : '✅ Within Budget'}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category *
        </label>
        <select
          id="category"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input-field"
        >
          <option value="">Select category</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
          Comments (optional)
        </label>
        <textarea
          id="comments"
          rows={4}
          maxLength={500}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="input-field"
          placeholder="Add notes, receipts info, etc..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {comments.length}/500 characters
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createExpense.isPending}
          className="btn-primary flex-1"
        >
          {createExpense.isPending ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </form>
  )
}
```

**Key Changes**:
1. ✅ Added `'use client'` directive
2. ✅ Replaced `useBudget()` Context with `useCreateExpense()` query
3. ✅ Added TypeScript types
4. ✅ Updated imports to use `@/` alias
5. ✅ Added live budget preview
6. ✅ Added proper form validation
7. ✅ Added loading states

### 5.4 Critical: 'use client' Placement Guide

**Add 'use client' to these component types**:

```typescript
// ✅ YES - Forms with state
'use client'
export function ExpenseForm() {
  const [value, setValue] = useState('')
  // ...
}

// ✅ YES - Components with event handlers
'use client'
export function Button({ onClick }) {
  return <button onClick={onClick}>...</button>
}

// ✅ YES - Components using useQuery/useMutation
'use client'
export function ExpenseList() {
  const { data } = useExpenses()
  // ...
}

// ✅ YES - Modals with state
'use client'
export function Modal({ isOpen, onClose }) {
  // ...
}

// ❌ NO - Static displays
export function ExpenseCard({ expense }) {
  return <div>{expense.name}</div>
}

// ❌ NO - Layouts without state
export function Layout({ children }) {
  return <div>{children}</div>
}
```

**Common Errors**:

```typescript
// ❌ WRONG - Missing 'use client'
export function ExpenseForm() {
  const [value, setValue] = useState('') // ERROR: useState not available
  // ...
}

// ✅ CORRECT
'use client'
export function ExpenseForm() {
  const [value, setValue] = useState('')
  // ...
}
```

---

## 📡 Phase 6: API Routes Implementation

### 6.1 API Route Pattern

**Every API route follows this structure**:

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const createSchema = z.object({
  // ... fields
})

// GET - List resources
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query params (if any)
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')

    // 3. Query database
    const resources = await prisma.resource.findMany({
      where: { /* filters */ },
    })

    // 4. Return success
    return NextResponse.json({ success: true, data: resources })
  } catch (error) {
    console.error('GET /api/resource error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create resource
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate body
    const body = await request.json()
    const validated = createSchema.parse(body)

    // 3. Business logic (e.g., calculate budget snapshot)
    // ...

    // 4. Create resource
    const resource = await prisma.resource.create({
      data: { /* ... */ },
    })

    // 5. Return success
    return NextResponse.json(
      { success: true, data: resource },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('POST /api/resource error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 6.2 Expenses API (Complete Example)

**File**: `app/api/expenses/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// Validation schemas
const createExpenseSchema = z.object({
  periodId: z.string().cuid(),
  expenseName: z.string().min(1).max(50),
  amount: z.number().positive().multipleOf(0.01),
  categoryId: z.string().cuid(),
  date: z.string().datetime(),
  comments: z.string().max(500).optional(),
})

// GET /api/expenses?periodId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')

    if (!periodId) {
      return NextResponse.json(
        { error: 'periodId required' },
        { status: 400 }
      )
    }

    // Verify period belongs to user
    const period = await prisma.period.findFirst({
      where: {
        id: periodId,
        userId: session.user.id,
      },
    })

    if (!period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 })
    }

    // Fetch expenses with category info
    const expenses = await prisma.expense.findMany({
      where: { periodId },
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
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ success: true, data: expenses })
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate
    const body = await request.json()
    const validated = createExpenseSchema.parse(body)

    // Verify period belongs to user and is active
    const period = await prisma.period.findFirst({
      where: {
        id: validated.periodId,
        userId: session.user.id,
        status: 'ACTIVE',
      },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Active period not found' },
        { status: 404 }
      )
    }

    // Calculate budget snapshot
    // 1. Get all budget additions for this period
    const budgetAdditions = await prisma.budgetAddition.findMany({
      where: { periodId: validated.periodId },
      select: { amount: true },
    })

    const totalBudget = budgetAdditions.reduce(
      (sum, b) => sum + Number(b.amount),
      0
    )

    // 2. Get all existing expenses
    const existingExpenses = await prisma.expense.findMany({
      where: { periodId: validated.periodId },
      select: { amount: true },
    })

    const totalSpent = existingExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    )

    // 3. Calculate budget before and after
    const budgetBefore = totalBudget - totalSpent
    const budgetAfter = budgetBefore - validated.amount

    // 4. Create expense with snapshot
    const expense = await prisma.expense.create({
      data: {
        periodId: validated.periodId,
        expenseName: validated.expenseName,
        amount: new Decimal(validated.amount),
        categoryId: validated.categoryId,
        date: new Date(validated.date),
        comments: validated.comments,
        budgetBefore: new Decimal(budgetBefore),
        budgetAfter: new Decimal(budgetAfter),
        snapshotAt: new Date(),
      },
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
    })

    return NextResponse.json(
      { success: true, data: expense },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('POST /api/expenses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**File**: `app/api/expenses/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateExpenseSchema = z.object({
  expenseName: z.string().min(1).max(50).optional(),
  amount: z.number().positive().multipleOf(0.01).optional(),
  categoryId: z.string().cuid().optional(),
  date: z.string().datetime().optional(),
  comments: z.string().max(500).optional(),
})

// GET /api/expenses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        period: { userId: session.user.id },
      },
      include: {
        category: true,
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('GET /api/expenses/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/expenses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateExpenseSchema.parse(body)

    // Verify expense belongs to user
    const existing = await prisma.expense.findFirst({
      where: {
        id: params.id,
        period: { userId: session.user.id, status: 'ACTIVE' },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Expense not found or period closed' },
        { status: 404 }
      )
    }

    // Track original amount if amount is changing
    const updateData: any = {}
    if (validated.expenseName) updateData.expenseName = validated.expenseName
    if (validated.categoryId) updateData.categoryId = validated.categoryId
    if (validated.date) updateData.date = new Date(validated.date)
    if (validated.comments !== undefined) updateData.comments = validated.comments

    if (validated.amount && validated.amount !== Number(existing.amount)) {
      updateData.amount = new Decimal(validated.amount)
      // Store original amount if this is first edit
      if (!existing.originalAmount) {
        updateData.originalAmount = existing.amount
      }
    }

    updateData.updatedAt = new Date()

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('PUT /api/expenses/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify expense belongs to user and period is active
    const expense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        period: { userId: session.user.id, status: 'ACTIVE' },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found or period closed' },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 6.3 API Routes Checklist

Create these files following the pattern above:

**Periods**:
- [ ] `app/api/periods/route.ts` (GET all, POST new)
- [ ] `app/api/periods/current/route.ts` (GET current active)
- [ ] `app/api/periods/close/route.ts` (POST close period)
- [ ] `app/api/periods/[id]/route.ts` (GET, PUT, DELETE specific)

**Budget Additions**:
- [ ] `app/api/budgets/route.ts` (GET, POST)
- [ ] `app/api/budgets/[id]/route.ts` (GET, DELETE)

**Expenses**:
- [x] `app/api/expenses/route.ts` (GET, POST) - shown above
- [x] `app/api/expenses/[id]/route.ts` (GET, PUT, DELETE) - shown above

**Categories**:
- [ ] `app/api/categories/route.ts` (GET, POST)
- [ ] `app/api/categories/[id]/route.ts` (GET, PUT, DELETE)

---

## 🔗 Phase 7: TanStack Query Hooks

### 7.1 Query Hook Pattern

**File**: `lib/queries/use-expenses.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
interface Expense {
  id: string
  expenseName: string
  amount: number
  categoryId: string
  date: string
  comments?: string
  budgetBefore: number
  budgetAfter: number
  snapshotAt: string
  createdAt: string
  updatedAt: string
  originalAmount?: number
  category: {
    id: string
    name: string
    icon: string
    color?: string
  }
}

interface CreateExpenseInput {
  periodId: string
  expenseName: string
  amount: number
  categoryId: string
  date: Date
  comments?: string
}

interface UpdateExpenseInput {
  expenseName?: string
  amount?: number
  categoryId?: string
  date?: Date
  comments?: string
}

// Query Keys
const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (periodId: string) => [...expenseKeys.lists(), periodId] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
}

// GET expenses by period
export function useExpenses(periodId: string) {
  return useQuery({
    queryKey: expenseKeys.list(periodId),
    queryFn: async () => {
      const res = await fetch(`/api/expenses?periodId=${periodId}`)
      if (!res.ok) throw new Error('Failed to fetch expenses')
      const json = await res.json()
      return json.data as Expense[]
    },
    enabled: !!periodId,
  })
}

// GET single expense
export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${id}`)
      if (!res.ok) throw new Error('Failed to fetch expense')
      const json = await res.json()
      return json.data as Expense
    },
    enabled: !!id,
  })
}

// POST create expense
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          date: input.date.toISOString(),
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create expense')
      }
      const json = await res.json()
      return json.data as Expense
    },
    onSuccess: (data, variables) => {
      // Invalidate expenses list for this period
      queryClient.invalidateQueries({
        queryKey: expenseKeys.list(variables.periodId),
      })
      // Invalidate current period (budget changed)
      queryClient.invalidateQueries({
        queryKey: ['periods', 'current'],
      })
    },
  })
}

// PUT update expense
export function useUpdateExpense(expenseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          date: input.date?.toISOString(),
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update expense')
      }
      const json = await res.json()
      return json.data as Expense
    },
    onSuccess: (data) => {
      // Invalidate this expense's detail
      queryClient.invalidateQueries({
        queryKey: expenseKeys.detail(expenseId),
      })
      // Invalidate expenses list
      queryClient.invalidateQueries({
        queryKey: expenseKeys.lists(),
      })
      // Invalidate current period
      queryClient.invalidateQueries({
        queryKey: ['periods', 'current'],
      })
    },
  })
}

// DELETE expense
export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete expense')
      }
      return expenseId
    },
    onSuccess: () => {
      // Invalidate all expense queries
      queryClient.invalidateQueries({
        queryKey: expenseKeys.all,
      })
      // Invalidate current period
      queryClient.invalidateQueries({
        queryKey: ['periods', 'current'],
      })
    },
  })
}
```

**Usage in Component**:

```typescript
'use client'

import { useExpenses, useCreateExpense } from '@/lib/queries/use-expenses'

export function ExpenseList({ periodId }: { periodId: string }) {
  const { data: expenses, isLoading, error } = useExpenses(periodId)
  const createExpense = useCreateExpense()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {expenses?.map((expense) => (
        <div key={expense.id}>{expense.expenseName}</div>
      ))}
    </div>
  )
}
```

### 7.2 Query Hooks Checklist

Create these query hook files:

- [ ] `lib/queries/use-periods.ts`
- [ ] `lib/queries/use-budgets.ts`
- [x] `lib/queries/use-expenses.ts` (shown above)
- [ ] `lib/queries/use-categories.ts`

---

## 💾 Phase 8: localStorage Migration

### 8.1 Migration Utility

**File**: `lib/utils/migrate-localStorage.ts`

```typescript
interface LocalStorageData {
  budget: number
  expenses: Array<{
    id: string
    expenseName: string
    amount: number
    category: string
    date: string
  }>
}

export function getLocalStorageData(): LocalStorageData | null {
  if (typeof window === 'undefined') return null

  const budget = localStorage.getItem('budget')
  const expenses = localStorage.getItem('expenses')

  if (!budget || !expenses) return null

  try {
    return {
      budget: parseFloat(budget),
      expenses: JSON.parse(expenses),
    }
  } catch (error) {
    console.error('Failed to parse localStorage data:', error)
    return null
  }
}

export function clearLocalStorageData() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('budget')
  localStorage.removeItem('expenses')
}

export function hasLocalStorageData(): boolean {
  if (typeof window === 'undefined') return false

  return !!(localStorage.getItem('budget') && localStorage.getItem('expenses'))
}
```

### 8.2 Migration API Endpoint

**File**: `app/api/migration/import/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const importSchema = z.object({
  budget: z.number().positive(),
  expenses: z.array(
    z.object({
      id: z.string(),
      expenseName: z.string(),
      amount: z.number().positive(),
      category: z.string(),
      date: z.string(),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { budget, expenses } = importSchema.parse(body)

    // Check if user already has data
    const existingPeriods = await prisma.period.count({
      where: { userId: session.user.id },
    })

    if (existingPeriods > 0) {
      return NextResponse.json(
        { error: 'User already has data. Migration not allowed.' },
        { status: 400 }
      )
    }

    // Get user's categories
    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
    })

    // Create category name to ID map
    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id])
    )

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create initial period
      const period = await tx.period.create({
        data: {
          userId: session.user.id,
          startDate: new Date(),
          status: 'ACTIVE',
        },
      })

      // 2. Create budget addition
      await tx.budgetAddition.create({
        data: {
          periodId: period.id,
          type: 'INCOME',
          amount: new Decimal(budget),
          source: 'Imported from localStorage',
          date: new Date(),
          comments: 'Initial budget import',
          budgetBefore: new Decimal(0),
          budgetAfter: new Decimal(budget),
        },
      })

      // 3. Import expenses
      let runningBudget = budget

      for (const exp of expenses) {
        // Find matching category or use "Otros"
        const categoryId =
          categoryMap.get(exp.category.toLowerCase()) ||
          categoryMap.get('otros') ||
          categories[0].id

        const budgetBefore = runningBudget
        const budgetAfter = runningBudget - exp.amount
        runningBudget = budgetAfter

        await tx.expense.create({
          data: {
            periodId: period.id,
            expenseName: exp.expenseName,
            amount: new Decimal(exp.amount),
            categoryId,
            date: new Date(exp.date),
            budgetBefore: new Decimal(budgetBefore),
            budgetAfter: new Decimal(budgetAfter),
            snapshotAt: new Date(),
          },
        })
      }

      return { period, expensesImported: expenses.length }
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    )
  }
}
```

### 8.3 Migration UI Component

**File**: `components/migration/MigrationModal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { getLocalStorageData, clearLocalStorageData, hasLocalStorageData } from '@/lib/utils/migrate-localStorage'
import { useRouter } from 'next/navigation'

export function MigrationModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(hasLocalStorageData())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const data = getLocalStorageData()

  if (!data) {
    setIsOpen(false)
    return null
  }

  const handleImport = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/migration/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Import failed')
      }

      // Clear localStorage
      clearLocalStorageData()

      // Refresh and redirect
      router.refresh()
      setIsOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    clearLocalStorageData()
    setIsOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Import Existing Data?</h2>
        
        <p className="text-gray-600 mb-4">
          We found existing budget data in your browser. Would you like to import it?
        </p>

        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="text-sm font-medium">
            Budget: ${data.budget.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">
            Expenses: {data.expenses.length} items
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Skip
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Importing...' : 'Import Data'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          This will create a new period and import all your expenses.
        </p>
      </div>
    </div>
  )
}
```

**Add to Dashboard**:

```typescript
// app/(protected)/dashboard/page.tsx
import { MigrationModal } from '@/components/migration/MigrationModal'

export default function DashboardPage() {
  return (
    <>
      <MigrationModal />
      {/* Rest of dashboard */}
    </>
  )
}
```

---

## 🧪 Phase 9: Testing & Validation

### 9.1 Manual Testing Checklist

**Authentication**:
- [ ] Can login with test account
- [ ] Cannot access protected routes without login
- [ ] Session persists after refresh
- [ ] Can logout

**Periods**:
- [ ] Can view current period
- [ ] Period shows correct start date
- [ ] Period shows days running
- [ ] Can navigate to historical periods
- [ ] Can close period
- [ ] Period summary generates correctly
- [ ] New period starts after close

**Budget Additions**:
- [ ] Can add Income (+)
- [ ] Can add Adjustment (-)
- [ ] Can add Deduction (-)
- [ ] Comments required for Adjustment/Deduction
- [ ] Budget history displays correctly
- [ ] Running total calculates correctly

**Expenses**:
- [ ] Can create expense
- [ ] Live budget preview shows during form fill
- [ ] Stage 2 modal shows after save
- [ ] Budget snapshot saves correctly
- [ ] Can view expense detail
- [ ] Budget snapshot shown in detail
- [ ] Can edit expense (amount changes tracked)
- [ ] Can delete expense
- [ ] Expense list compact view works
- [ ] Expense list groups by date

**Categories**:
- [ ] Default categories load on signup
- [ ] Can create custom category
- [ ] Can edit category name/icon/color
- [ ] Can delete unused category
- [ ] Reassignment works for used category
- [ ] Category picker shows all categories

**Migration**:
- [ ] Migration modal appears if localStorage data exists
- [ ] Preview shows correct data
- [ ] Import creates period + budget + expenses
- [ ] localStorage clears after import
- [ ] Skip button clears localStorage

### 9.2 Edge Cases to Test

**Budget Snapshots**:
- [ ] Create expense, check snapshot correct
- [ ] Edit expense amount, original snapshot unchanged
- [ ] Create multiple expenses, running total correct

**Period Closing**:
- [ ] Close period with 0 expenses
- [ ] Close period with many expenses
- [ ] Cannot edit expenses in closed period
- [ ] Summary saved correctly

**Category Management**:
- [ ] Delete category with 0 expenses (immediate)
- [ ] Delete category with expenses (requires reassignment)
- [ ] Edit category (retroactively updates expenses)

**Concurrent Actions**:
- [ ] Create expense while another is saving
- [ ] Edit expense while list is loading
- [ ] Close period while viewing expenses

---

## 🚀 Phase 10: Deployment

### 10.1 Pre-Deployment Checklist

**Code Quality**:
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All API routes return correct status codes
- [ ] Error handling in place for all routes

**Environment Variables**:
- [ ] All `.env` variables documented
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] Database URLs correct (pooler for app, direct for migrations)

**Database**:
- [ ] All migrations applied
- [ ] Seed data works
- [ ] Connection pooling configured

### 10.2 Deploy to Vercel

**Step 1: Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit: Budget Tracker migration complete"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/budget-tracker.git
git push -u origin main
```

**Step 2: Connect to Vercel**

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import from GitHub
4. Select `budget-tracker` repository
5. Framework Preset: Next.js (auto-detected)
6. Root Directory: `./` (leave default)
7. Build Command: `npm run build` (leave default)
8. Output Directory: `.next` (leave default)

**Step 3: Configure Environment Variables**

In Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://postgres.xxx:...@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:...@aws-0-us-east-1.pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=<your-generated-secret>
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Step 4: Deploy**

Click "Deploy" → Wait ~2 minutes → Done!

**Step 5: Update NEXTAUTH_URL**

After first deployment:
1. Copy your Vercel URL (e.g., `budget-tracker-abc123.vercel.app`)
2. Update `NEXTAUTH_URL` in Environment Variables
3. Redeploy (Deployments → Click "..." → Redeploy)

### 10.3 Post-Deployment Verification

- [ ] Can access app at Vercel URL
- [ ] Can login
- [ ] Database connection works
- [ ] Can create period
- [ ] Can create expense
- [ ] Budget snapshots save
- [ ] Mobile responsive works

---

## 🐛 Common Issues & Solutions

### Issue 1: Hydration Mismatch

**Error**: 
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

**Cause**: Server Component rendered different output than Client Component expected.

**Solution**:
```typescript
// ❌ WRONG - Using Date() directly
export function Component() {
  const now = new Date() // Different on server vs client!
  return <div>{now.toString()}</div>
}

// ✅ CORRECT - Use client component
'use client'
export function Component() {
  const [now, setNow] = useState<Date | null>(null)
  
  useEffect(() => {
    setNow(new Date())
  }, [])
  
  if (!now) return <div>Loading...</div>
  return <div>{now.toString()}</div>
}
```

### Issue 2: Missing 'use client' Directive

**Error**:
```
You're importing a component that needs useState. This only works in a Client Component.
```

**Solution**: Add `'use client'` at the top of the file.

```typescript
'use client' // Add this!

import { useState } from 'react'

export function MyComponent() {
  const [value, setValue] = useState('')
  // ...
}
```

### Issue 3: Prisma Client Not Generated

**Error**:
```
Cannot find module '@prisma/client'
```

**Solution**:
```bash
npx prisma generate
```

### Issue 4: Database Connection Failed

**Error**:
```
Can't reach database server
```

**Solutions**:
1. Check `DATABASE_URL` in `.env`
2. Verify Supabase project is not paused
3. Check firewall/network
4. Try `DIRECT_URL` for migrations

### Issue 5: NextAuth Session Not Working

**Error**: Session always `null`

**Solutions**:
1. Check `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Clear cookies and re-login
4. Check middleware matcher paths

---

## 📚 Additional Resources

**Next.js**:
- Official Docs: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

**Prisma**:
- Docs: https://www.prisma.io/docs
- Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference

**NextAuth.js**:
- Docs: https://next-auth.js.org/
- Configuration: https://next-auth.js.org/configuration/options

**TanStack Query**:
- Docs: https://tanstack.com/query/latest
- React Query: https://tanstack.com/query/latest/docs/react/overview

---

## ✅ Success Criteria

Migration is complete when:

- [ ] All existing features work in Next.js
- [ ] localStorage data successfully migrated
- [ ] All PRODUCT.md requirements implemented
- [ ] Budget snapshots work correctly
- [ ] 2-stage expense modal functional
- [ ] Period management works
- [ ] Category CRUD functional
- [ ] Mobile responsive
- [ ] Deployed to Vercel
- [ ] Database on Supabase
- [ ] Zero TypeScript errors
- [ ] All manual tests pass

---

**Document Status**: v1.0 - Ready for Implementation  
**Estimated Timeline**: 4-5 weeks  
**Last Updated**: December 28, 2025

**Next Steps**: Begin Phase 0 - Pre-Migration Setup
