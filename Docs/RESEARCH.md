# Family Budget Tracker - Technical Research & Architecture

**Version:** 1.0  
**Date:** December 28, 2025  
**Author:** Fernando @ ProjectXInnovation  
**Related Documents:** PRODUCT.md, IMPLEMENTATION_GUIDE.md

---

## 🎯 Document Purpose

This document bridges the product specification (PRODUCT.md) with implementation details. It analyzes:
- How the existing codebase can be enhanced to support new features
- Technical feasibility of product requirements
- Database schema and data relationships
- Backend architecture and API design
- Integration points and migration strategy
- Technical risks and mitigation approaches

**Target Audience for Coding Agent**: This provides the technical context needed to understand how to integrate new features with the existing React/TypeScript codebase and design a new backend system.

---

## 📊 Current State Analysis

### Existing Codebase Overview

**Location**: `C:\Users\Fernando\Documents\FerJuan\Control-de-gastos`

**Current Tech Stack**:
- **Frontend**: React 18.3 + TypeScript 5.4
- **Build Tool**: Vite 5.3
- **Styling**: Tailwind CSS 3.4
- **State Management**: Context API + useReducer
- **Data Persistence**: localStorage (browser-only)
- **UI Components**: Headless UI 2.0, Hero Icons 2.1
- **Date Handling**: react-date-picker 11.0, react-calendar 5.0

**Current Architecture Pattern**:
```
src/
├── components/        # UI Components (9 files)
├── context/          # BudgetContext.tsx (global state)
├── hooks/            # useBudget.ts (custom hook)
├── reducers/         # budget-reducer.ts (state management)
├── types/            # index.ts (TypeScript interfaces)
└── utils/            # categories.ts, formatters
```

**Current State Management**:
```typescript
// budget-reducer.ts
type BudgetState = {
  budget: number           // Single budget value
  modal: boolean          // Modal visibility
  expenses: Expense[]     // Array of expenses
  editingId: string       // Currently editing expense
  currentCategory: string // Filter state
}

type Expense = {
  id: string
  expenseName: string
  amount: number
  category: string
  date: Value
}
```

**Current Storage**:
```typescript
// localStorage keys
localStorage.setItem('budget', state.budget.toString())
localStorage.setItem('expenses', JSON.stringify(state.expenses))
```

---

## 🚨 Gap Analysis: Current vs Required

### What Exists Today

✅ **Frontend Framework**: React + TypeScript (ready to enhance)  
✅ **State Management**: Context API + useReducer (can be extended)  
✅ **Styling System**: Tailwind (can add color tokens)  
✅ **Date Handling**: react-date-picker (adequate)  
✅ **UI Patterns**: Modal system, list rendering  

### What's Missing (Must Add)

❌ **Backend Server**: None (localStorage only)  
❌ **Database**: No persistent storage  
❌ **API Layer**: No HTTP client configured  
❌ **Authentication**: No user management  
❌ **Multi-Budget System**: Only single budget value  
❌ **Period Management**: No concept of periods  
❌ **Budget Snapshots**: No historical tracking  
❌ **Budget Types**: No Income/Adjustment/Deduction distinction  
❌ **Dynamic Categories**: Categories are hard-coded  
❌ **Offline Sync**: No sync queue mechanism  

---

## 🏗️ Recommended Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Next.js 14 Full-Stack Application               │
│         (Client + Server in Single Deployment)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CLIENT SIDE (React Components)                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  - UI Components (Server & Client)                 │    │
│  │  - React Server Components (RSC) for initial load  │    │
│  │  - Client Components for interactivity             │    │
│  │  - TanStack Query for server state                 │    │
│  │  - IndexedDB for offline queue                     │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↕                                  │
│  SERVER SIDE (Next.js API Routes)                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  /app/api/periods/route.ts                         │    │
│  │  /app/api/budgets/route.ts                         │    │
│  │  /app/api/expenses/route.ts                        │    │
│  │  /app/api/categories/route.ts                      │    │
│  │  /app/api/auth/[...nextauth]/route.ts              │    │
│  │                                                     │    │
│  │  - Authentication (NextAuth.js)                    │    │
│  │  - Business Logic Layer                            │    │
│  │  - Data Access Layer (Prisma ORM)                  │    │
│  │  - Validation Layer (Zod)                          │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↕                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│          PostgreSQL Database (Supabase Hosted)              │
├─────────────────────────────────────────────────────────────┤
│  Tables: users, periods, budget_additions,                  │
│          expenses, categories                               │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack Recommendation

#### **Full-Stack Framework**

**Framework**: Next.js 14+ with App Router  
**Language**: TypeScript 5.4+  
**Runtime**: Node.js 20+ LTS  
**Deployment**: Vercel (free tier)

**Why Next.js?**

1. **Full-Stack in One Codebase**: 
   - Frontend React components + Backend API routes
   - No need for separate Express server
   - Shared TypeScript types across client/server

2. **Built-in API Routes**:
   - `/app/api/*` routes act as backend endpoints
   - Serverless functions (automatic scaling)
   - Same patterns as dedicated backend but simpler

3. **Modern React Features**:
   - Server Components for better performance
   - Server Actions for mutations
   - Streaming and Suspense

4. **Developer Experience**:
   - Hot reload for entire stack
   - TypeScript support out of the box
   - Zero-config production builds

5. **Deployment Simplicity**:
   - Vercel provides free hosting
   - Automatic deployments from Git
   - Built-in HTTPS and CDN

#### **Database & ORM**

**Database**: PostgreSQL 15+ via Supabase  
**ORM**: Prisma 5.7+  
**Why**: Type-safe database access, excellent migrations

#### **Authentication**

**Library**: NextAuth.js v5 (Auth.js)  
**Why**: 
- Built for Next.js App Router
- Secure session management
- Multiple provider support (credentials, OAuth, etc.)

#### **Validation**

**Library**: Zod 3.22+  
**Why**: Runtime type validation + TypeScript inference

#### **State Management**

**Server State**: TanStack Query (React Query) 5.0+  
**Client State**: React Context API + useReducer (keep existing)  
**Offline Queue**: Dexie.js 3.2+ (IndexedDB wrapper)

**Why These Choices?**

1. **TanStack Query**: Server state caching, optimistic updates, auto-refetch
2. **Context API**: Adequate for UI state (modals, filters)
3. **Dexie.js**: Simple offline queue management

#### **Frontend Libraries** (Migration from Existing)

**Keep from Current App**:
- ✅ Tailwind CSS 3.4+ (styling)
- ✅ Headless UI 2.0 (accessible components)
- ✅ Hero Icons 2.1 (icon library)
- ✅ TypeScript patterns

**Remove from Current App**:
- ❌ Vite (replaced by Next.js)
- ❌ react-date-picker (use Headless UI + date-fns)
- ❌ Direct DOM manipulation

**Add New**:
- ✅ TanStack Query 5.0+ (server state)
- ✅ Dexie.js 3.2+ (offline storage)
- ✅ date-fns 3.0+ (date utilities)
- ✅ react-hot-toast 2.4+ (notifications)

#### **Why This Stack Over Express?**

| Aspect | Next.js (Chosen) | Express (Alternative) |
|--------|------------------|----------------------|
| Setup | Zero-config | Manual setup needed |
| Frontend/Backend | Single codebase | Separate repos |
| Type Safety | Shared types | Manual type sync |
| Deployment | 1 place (Vercel) | 2 places (Render + Vercel) |
| Cost | $0/month | $7/month |
| Dev Server | One command | Two terminals |
| CORS | Not needed | Must configure |
| Auth | NextAuth built-in | JWT from scratch |

**Decision**: Next.js provides better DX for solo developer with no additional cost

---

## 🗄️ Database Schema Design

### Schema Overview

**5 Main Tables**:
1. `users` - User accounts (V1.0: single user)
2. `periods` - Budget periods (continuous until manually closed)
3. `budget_additions` - Budget entries with types (Income/Adjustment/Deduction)
4. `expenses` - Expense entries with budget snapshots
5. `categories` - User-defined expense categories

### Detailed Schema (Prisma Format)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS TABLE
// ============================================
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  name            String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  periods         Period[]
  categories      Category[]
}

// ============================================
// PERIODS TABLE
// ============================================
model Period {
  id              String    @id @default(cuid())
  userId          String
  
  // Period dates
  startDate       DateTime
  endDate         DateTime? // NULL = active period
  
  // Period status
  status          PeriodStatus @default(ACTIVE)
  durationDays    Int?      // Calculated on close
  
  // Period summary (saved on close)
  summaryJson     Json?     // Stores period summary
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  closedAt        DateTime?
  
  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  budgetAdditions BudgetAddition[]
  expenses        Expense[]
  
  @@index([userId, status])
  @@index([userId, startDate])
}

enum PeriodStatus {
  ACTIVE
  CLOSED
}

// ============================================
// BUDGET ADDITIONS TABLE
// ============================================
model BudgetAddition {
  id              String    @id @default(cuid())
  periodId        String
  
  // Budget details
  type            BudgetType
  amount          Decimal   @db.Decimal(10, 2) // Positive for income, negative for adj/ded
  source          String    // "Salary", "Bonus", etc.
  date            DateTime
  comments        String?   @db.Text
  
  // Budget snapshot (immutable)
  budgetBefore    Decimal   @db.Decimal(10, 2)
  budgetAfter     Decimal   @db.Decimal(10, 2)
  
  createdAt       DateTime  @default(now())
  
  // Relations
  period          Period    @relation(fields: [periodId], references: [id], onDelete: Cascade)
  
  @@index([periodId])
  @@index([periodId, date])
}

enum BudgetType {
  INCOME      // +
  ADJUSTMENT  // - (correction)
  DEDUCTION   // - (withdrawal)
}

// ============================================
// EXPENSES TABLE
// ============================================
model Expense {
  id              String    @id @default(cuid())
  periodId        String
  categoryId      String
  
  // Expense details
  expenseName     String
  amount          Decimal   @db.Decimal(10, 2)
  date            DateTime
  comments        String?   @db.Text
  
  // Budget snapshot (IMMUTABLE - never changes)
  budgetBefore    Decimal   @db.Decimal(10, 2)
  budgetAfter     Decimal   @db.Decimal(10, 2)
  snapshotAt      DateTime  // When snapshot was captured
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  originalAmount  Decimal?  @db.Decimal(10, 2) // If edited, store original
  
  // Relations
  period          Period    @relation(fields: [periodId], references: [id], onDelete: Cascade)
  category        Category  @relation(fields: [categoryId], references: [id])
  
  @@index([periodId])
  @@index([periodId, date])
  @@index([categoryId])
}

// ============================================
// CATEGORIES TABLE
// ============================================
model Category {
  id              String    @id @default(cuid())
  userId          String
  
  // Category details
  name            String
  icon            String    // Emoji or icon identifier
  color           String?   // Hex color code
  isDefault       Boolean   @default(false) // Pre-defined categories
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expenses        Expense[]
  
  @@unique([userId, name]) // Category names unique per user
  @@index([userId])
}
```

### Key Design Decisions

#### **1. Budget Snapshots Are Immutable**

```typescript
// In both BudgetAddition and Expense tables
budgetBefore: Decimal
budgetAfter: Decimal
snapshotAt: DateTime
```

**Rationale**:
- Historical accuracy: Snapshot = moment in time
- No recalculation needed when editing expenses
- Simpler implementation
- Clear audit trail

**Trade-off**: If user edits expense amount, snapshot doesn't reflect new amount, but that's acceptable because it's a "historical snapshot."

#### **2. Periods Are Continuous Until Closed**

```typescript
startDate: DateTime
endDate: DateTime?  // NULL = still running
status: ACTIVE | CLOSED
```

**Rationale**:
- `endDate = NULL` → Period is active
- User clicks "Save Period" → Set `endDate = now()`, `status = CLOSED`
- Only ONE active period per user at a time

**Constraint Needed**:
```sql
-- Ensure only one active period per user
CREATE UNIQUE INDEX idx_one_active_period_per_user 
ON "Period" (user_id) 
WHERE status = 'ACTIVE';
```

#### **3. Budget Additions Store Running Total**

```typescript
budgetBefore: Decimal  // Budget before this addition
budgetAfter: Decimal   // Budget after this addition
```

**Why Store Both?**
- Fast budget history reconstruction
- No need to SUM all previous additions
- Snapshots are self-contained

**Example**:
```
Addition 1: Before $0 → After $3,000 (+$3,000)
Addition 2: Before $3,000 → After $3,500 (+$500)
Addition 3: Before $3,500 → After $3,000 (-$500 adjustment)

Current Budget = Last budgetAfter = $3,000
```

#### **4. Categories Are User-Scoped**

```typescript
@@unique([userId, name])
```

**Rationale**:
- Each user has their own categories
- Pre-populate default categories on signup
- User can customize/delete as needed

**Migration Note**: If expanding to multi-user family accounts, categories might become household-scoped instead.

#### **5. Period Summary Stored as JSON**

```typescript
summaryJson: Json?  // Flexible structure
```

**Stored Structure**:
```typescript
interface PeriodSummary {
  startDate: string
  endDate: string
  durationDays: number
  totalBudget: number
  budgetBreakdown: {
    income: number
    adjustments: number
    deductions: number
  }
  totalSpent: number
  totalExpenses: number
  remaining: number
  remainingPercent: number
  topCategories: Array<{
    categoryName: string
    categoryIcon: string
    amount: number
    percent: number
  }>
}
```

**Why JSON?**
- Flexible schema (can add fields later)
- Pre-calculated on period close (no queries needed)
- Displayed directly in historical view

---

## 🔌 API Design

### Next.js API Routes Structure

All API endpoints are implemented as Next.js Route Handlers in `/app/api/*/route.ts` files.

**Route Handler Pattern**:
```typescript
// app/api/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/expenses
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const expenses = await prisma.expense.findMany({
    where: { period: { userId: session.user.id } }
  })
  
  return NextResponse.json({ success: true, data: expenses })
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  // ... validation, business logic, etc.
  
  return NextResponse.json({ success: true, data: newExpense }, { status: 201 })
}
```

#### **Authentication** (V1.0 Simple, Single User)

```
POST   /api/auth/register    - Create account
POST   /api/auth/login       - Login, get JWT
POST   /api/auth/logout      - Logout
GET    /api/auth/me          - Get current user
```

#### **Periods**

```
GET    /api/periods                    - List all periods (with summaries)
GET    /api/periods/current            - Get active period
GET    /api/periods/:id                - Get specific period details
POST   /api/periods/close              - Close current period, start new one
```

#### **Budget Additions**

```
GET    /api/periods/:periodId/budgets         - List budget additions
POST   /api/periods/:periodId/budgets         - Create budget addition
DELETE /api/periods/:periodId/budgets/:id     - Delete budget addition
```

**Note**: No PUT/PATCH - budget additions are immutable.

#### **Expenses**

```
GET    /api/periods/:periodId/expenses        - List expenses
POST   /api/periods/:periodId/expenses        - Create expense
GET    /api/expenses/:id                      - Get expense detail
PUT    /api/expenses/:id                      - Update expense
DELETE /api/expenses/:id                      - Delete expense
```

#### **Categories**

```
GET    /api/categories               - List user's categories
POST   /api/categories               - Create category
PUT    /api/categories/:id           - Update category
DELETE /api/categories/:id           - Delete category (with reassignment)
```

### API Response Format

**Success Response**:
```typescript
{
  success: true,
  data: {
    // Resource data
  }
}
```

**Error Response**:
```typescript
{
  success: false,
  error: {
    code: "BUDGET_EXCEEDED",
    message: "Expense exceeds available budget",
    details: {
      available: 450,
      requested: 500,
      shortfall: 50
    }
  }
}
```

### Critical API Behaviors

#### **Creating an Expense with Budget Snapshot**

**Flow**:
1. Client sends: `POST /api/periods/:periodId/expenses`
2. Server calculates budget snapshot:
   ```typescript
   const currentBudget = await calculateCurrentBudget(periodId)
   const budgetBefore = currentBudget
   const budgetAfter = currentBudget - expense.amount
   ```
3. Server creates expense with snapshot
4. Server returns complete expense object including snapshot

**Client Usage**:
- Client doesn't calculate snapshot
- Client displays snapshot from server response
- Optimistic update shows "Saving..." then replaces with server data

#### **Closing a Period**

**Flow**:
1. Client sends: `POST /api/periods/close`
2. Server:
   - Calculates period summary
   - Sets `endDate = now()`, `status = CLOSED`
   - Saves summary JSON
   - Creates new active period
3. Server returns:
   ```typescript
   {
     closedPeriod: { id, summary },
     newPeriod: { id, startDate, status: 'ACTIVE' }
   }
   ```

---

## 🔄 Data Flow Patterns

### Creating an Expense (End-to-End)

```
┌─────────────┐
│   CLIENT    │
└──────┬──────┘
       │ 1. User fills form
       │    amount: $45
       │    Live preview: shows $3,000 → $2,955
       │
       │ 2. User clicks "Save"
       │    Optimistic update: Add expense to local state
       │    Show "Saving..." indicator
       │
       │ 3. POST /api/periods/123/expenses
       │    { expenseName, amount, categoryId, date, comments }
       ↓
┌─────────────┐
│   SERVER    │
├─────────────┤
│ 4. Validate request (Zod schema)
│
│ 5. Calculate budget snapshot:
│    - Query all budgetAdditions: SUM = $3,000
│    - Query all expenses: SUM = $1,955
│    - currentBudget = $3,000 - $1,955 = $1,045
│    - budgetBefore = $1,045
│    - budgetAfter = $1,045 - $45 = $1,000
│
│ 6. Create expense record:
│    INSERT INTO expenses (
│      expenseName, amount, categoryId,
│      budgetBefore: $1,045,
│      budgetAfter: $1,000,
│      snapshotAt: NOW()
│    )
│
│ 7. Return expense with snapshot
└─────┬───────┘
      │
      ↓
┌─────────────┐
│   CLIENT    │
├─────────────┤
│ 8. Receive server response
│
│ 9. Replace optimistic update with server data
│
│ 10. Show Stage 2 modal:
│     "Expense Added!"
│     Budget Before: $1,045
│     Budget After: $1,000
│
│ 11. Update global budget state
└─────────────┘
```

### Offline-First Sync Pattern

**Client Side (IndexedDB Queue)**:
```typescript
// When offline or request fails
interface QueuedAction {
  id: string
  type: 'CREATE_EXPENSE' | 'UPDATE_EXPENSE' | 'DELETE_EXPENSE'
  data: any
  timestamp: number
  retryCount: number
}

// Store in IndexedDB
await db.queue.add({
  id: generateId(),
  type: 'CREATE_EXPENSE',
  data: expenseData,
  timestamp: Date.now(),
  retryCount: 0
})
```

**Sync Process**:
```typescript
// On reconnection or periodic check
const queuedActions = await db.queue.toArray()

for (const action of queuedActions) {
  try {
    await syncAction(action)
    await db.queue.delete(action.id) // Remove from queue
  } catch (error) {
    action.retryCount++
    if (action.retryCount > 5) {
      // Move to failed queue, notify user
      await db.failedQueue.add(action)
      await db.queue.delete(action.id)
    }
  }
}
```

---

## 🔧 Integration with Existing Codebase

### State Management Migration

**Current** (localStorage):
```typescript
// budget-reducer.ts
export const budgetReducer = (state, action) => {
  // Handles all state in memory
  // Saves to localStorage on every change
}
```

**Enhanced** (API + Cache):
```typescript
// Keep existing reducer for UI state
// Add react-query for server state

// hooks/usePeriods.ts
export const useCurrentPeriod = () => {
  return useQuery({
    queryKey: ['periods', 'current'],
    queryFn: () => api.periods.getCurrent(),
    staleTime: 1000 * 60 * 5 // 5 min cache
  })
}

// hooks/useExpenses.ts
export const useCreateExpense = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => api.expenses.create(data),
    onMutate: async (newExpense) => {
      // Optimistic update
      await queryClient.cancelQueries(['expenses'])
      const previous = queryClient.getQueryData(['expenses'])
      queryClient.setQueryData(['expenses'], old => [...old, newExpense])
      return { previous }
    },
    onError: (err, newExpense, context) => {
      // Rollback on error
      queryClient.setQueryData(['expenses'], context.previous)
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries(['expenses'])
    }
  })
}
```

### Component Migration Pattern

**Example: BudgetForm.tsx**

**Current**:
```typescript
const handleSubmit = (e) => {
  e.preventDefault()
  dispatch({ type: "add-budget", payload: { budget } })
}
```

**Enhanced**:
```typescript
const createBudgetMutation = useCreateBudget()

const handleSubmit = async (e) => {
  e.preventDefault()
  
  try {
    const result = await createBudgetMutation.mutateAsync({
      type: 'INCOME',
      amount: budget,
      source: source,
      date: date,
      comments: comments
    })
    
    // Show Stage 2 modal with snapshot
    setShowSuccessModal(true)
    setSnapshot(result.data.budgetSnapshot)
    
  } catch (error) {
    // Show error toast
    toast.error(error.message)
  }
}
```

### Detailed File Structure (Next.js Full-Stack)

```
budget-tracker/                   # Next.js 14 Project Root
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (no auth required)
│   │   ├── page.tsx              # Landing/login page
│   │   └── layout.tsx            # Public layout
│   │
│   ├── (protected)/              # Protected routes (authentication required)
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main budget dashboard
│   │   ├── expenses/
│   │   │   ├── page.tsx          # Expense list view
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Expense detail page
│   │   ├── categories/
│   │   │   └── page.tsx          # Category management
│   │   ├── history/
│   │   │   └── page.tsx          # Historical periods view
│   │   ├── settings/
│   │   │   └── page.tsx          # User settings & preferences
│   │   └── layout.tsx            # Protected layout (auth wrapper)
│   │
│   ├── api/                      # Backend API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth.js authentication
│   │   ├── periods/
│   │   │   ├── route.ts          # GET all periods, POST new period
│   │   │   ├── current/
│   │   │   │   └── route.ts      # GET current active period
│   │   │   ├── close/
│   │   │   │   └── route.ts      # POST close current period
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET, PUT, DELETE specific period
│   │   ├── budgets/
│   │   │   ├── route.ts          # POST create budget addition
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET, DELETE budget addition
│   │   ├── expenses/
│   │   │   ├── route.ts          # GET expenses, POST new expense
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET, PUT, DELETE expense
│   │   └── categories/
│   │       ├── route.ts          # GET categories, POST new category
│   │       └── [id]/
│   │           └── route.ts      # GET, PUT, DELETE category
│   │
│   ├── layout.tsx                # Root layout (global)
│   └── globals.css               # Global styles + Tailwind imports
│
├── components/                   # React Components (Client & Server)
│   ├── periods/
│   │   ├── PeriodHeader.tsx      # Period navigation & info
│   │   ├── PeriodSummary.tsx     # Budget summary display
│   │   └── SavePeriodModal.tsx   # Close period confirmation
│   ├── budgets/
│   │   ├── BudgetForm.tsx        # Add budget with type selector
│   │   ├── BudgetHistory.tsx     # Budget additions list
│   │   └── BudgetSnapshot.tsx    # Budget impact display
│   ├── expenses/
│   │   ├── ExpenseList.tsx       # Compact expense list
│   │   ├── ExpenseForm.tsx       # 2-stage expense form
│   │   ├── ExpenseDetailModal.tsx # Full expense details
│   │   └── CompactExpenseCard.tsx # List item component
│   ├── categories/
│   │   ├── CategoryManager.tsx   # CRUD category management
│   │   ├── CategoryBadge.tsx     # Category display badge
│   │   └── CategoryPicker.tsx    # Category selector
│   └── ui/                       # Reusable UI primitives (Headless UI)
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Select.tsx
│       └── Toast.tsx
│
├── lib/                          # Business logic & utilities
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config & helpers
│   ├── api/                      # API client utilities
│   │   ├── client.ts             # Fetch wrapper with auth headers
│   │   └── error-handler.ts      # Error response parser
│   ├── validations/              # Zod validation schemas
│   │   ├── period.ts             # Period validation
│   │   ├── budget.ts             # Budget addition validation
│   │   ├── expense.ts            # Expense validation
│   │   └── category.ts           # Category validation
│   ├── queries/                  # TanStack Query hooks
│   │   ├── use-periods.ts        # Period queries & mutations
│   │   ├── use-budgets.ts        # Budget queries & mutations
│   │   ├── use-expenses.ts       # Expense queries & mutations
│   │   └── use-categories.ts     # Category queries & mutations
│   ├── offline/                  # Offline-first functionality
│   │   ├── queue.ts              # Dexie.js IndexedDB queue
│   │   └── sync.ts               # Sync manager logic
│   └── utils/
│       ├── date.ts               # Date formatting helpers
│       ├── currency.ts           # Money/number formatting
│       └── budget-calculator.ts  # Budget snapshot calculations
│
├── prisma/
│   ├── schema.prisma             # Database schema (Prisma)
│   ├── migrations/               # SQL migration files
│   └── seed.ts                   # Database seeder (test data)
│
├── types/                        # TypeScript type definitions
│   ├── api.ts                    # API request/response types
│   ├── database.ts               # Prisma-generated types
│   └── index.ts                  # Shared application types
│
├── public/                       # Static assets (served as-is)
│   ├── icons/
│   └── images/
│
├── middleware.ts                 # Next.js middleware (auth, rate limiting)
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS config (color tokens)
├── tsconfig.json                 # TypeScript configuration
├── .env.local                    # Environment variables (gitignored)
└── package.json                  # Dependencies & scripts
```

**Migration from Current `Control-de-gastos` Structure**:

| Current (Vite + React) | New (Next.js) | Notes |
|------------------------|---------------|-------|
| `src/components/` | `components/` | No `src/` folder in Next.js |
| `src/context/BudgetContext.tsx` | `lib/queries/use-*.ts` | Server state via TanStack Query |
| `src/reducers/budget-reducer.ts` | API routes in `app/api/` | Server-side state |
| `src/hooks/useBudget.ts` | `lib/queries/use-budgets.ts` | Query hooks |
| `main.tsx` entry | `app/layout.tsx` + `app/page.tsx` | File-based routing |
| Vite config | `next.config.js` | Different build system |
| Client-only routing | File-system routing | Automatic routes |
| localStorage | API + IndexedDB queue | Server persistence + offline |

**Key Architectural Changes**:
- ✅ Frontend and backend in single Next.js project
- ✅ API routes replace Express server
- ✅ File-based routing replaces React Router
- ✅ Server Components for initial data loading
- ✅ Client Components for interactivity
- ✅ Shared TypeScript types across full stack

---

## 🚀 Migration Strategy

### Phase 1: Next.js Project Setup (Week 1)

1. **Initialize Next.js Project**
   ```bash
   # Create new Next.js 14 project with TypeScript
   npx create-next-app@latest budget-tracker --typescript --tailwind --app --use-npm
   cd budget-tracker
   
   # Install additional dependencies
   npm install @prisma/client prisma
   npm install @tanstack/react-query @tanstack/react-query-devtools
   npm install next-auth
   npm install zod
   npm install dexie dexie-react-hooks
   npm install date-fns
   npm install react-hot-toast
   npm install @headlessui/react @heroicons/react
   
   # Dev dependencies
   npm install -D @types/node
   ```

2. **Setup Prisma + Supabase**
   ```bash
   # Initialize Prisma
   npx prisma init
   
   # Edit prisma/schema.prisma (add Budget Tracker schema)
   # Update .env with Supabase DATABASE_URL
   
   # Create and run initial migration
   npx prisma migrate dev --name init
   
   # Generate Prisma Client
   npx prisma generate
   ```

3. **Configure NextAuth.js**
   - Create `/app/api/auth/[...nextauth]/route.ts`
   - Setup credentials provider
   - Configure session strategy

4. **Setup Tailwind Color Tokens**
   - Update `tailwind.config.js` with color system from PRODUCT.md
   - Test color classes

### Phase 2: Migrate Frontend Components (Week 2)

**Critical Migration Notes for IMPLEMENTATION_GUIDE.md**:

1. **Component Migration Strategy**:
   ```
   Current (Vite + React)         →  New (Next.js)
   ├── src/components/            →  components/
   │   ├── BudgetForm.tsx         →  components/budgets/BudgetForm.tsx
   │   ├── ExpenseForm.tsx        →  components/expenses/ExpenseForm.tsx
   │   └── ExpenseList.tsx        →  components/expenses/ExpenseList.tsx
   ```

2. **Context API → TanStack Query**:
   ```typescript
   // OLD: src/context/BudgetContext.tsx
   const BudgetContext = createContext()
   
   // NEW: lib/queries/use-budgets.ts
   export const useBudgets = () => {
     return useQuery({
       queryKey: ['budgets', periodId],
       queryFn: () => api.budgets.list(periodId)
     })
   }
   ```

3. **State Management Migration**:
   - ❌ Remove: `src/reducers/budget-reducer.ts` (server state now)
   - ✅ Keep: UI state in component `useState` (modals, filters)
   - ✅ Add: TanStack Query for server data

4. **Routing Migration**:
   ```
   OLD (React Router)             →  NEW (Next.js File-based)
   /                               →  app/(public)/page.tsx
   /dashboard                      →  app/(protected)/dashboard/page.tsx
   /expenses                       →  app/(protected)/expenses/page.tsx
   ```

5. **Import Path Changes**:
   ```typescript
   // OLD
   import { Component } from '../components/Component'
   
   // NEW (no src/ folder)
   import { Component } from '@/components/Component'
   ```

6. **Client vs Server Components**:
   - **Server Components** (default): Static displays, initial data fetching
   - **Client Components** (add `'use client'`): Interactive forms, modals, state
   
   ```typescript
   // components/expenses/ExpenseForm.tsx
   'use client' // Add this for components with useState, onClick, etc.
   
   export function ExpenseForm() {
     const [amount, setAmount] = useState(0)
     // ...
   }
   ```

### Phase 3: Build API Routes (Week 2-3)

1. **Create API Endpoints**:
   ```bash
   # Create all route files
   mkdir -p app/api/{periods,budgets,expenses,categories}
   
   # Each endpoint needs route.ts
   touch app/api/periods/route.ts
   touch app/api/budgets/route.ts
   # etc.
   ```

2. **Implement Business Logic**:
   - Budget snapshot calculations
   - Period close logic
   - Validation with Zod

3. **Add Authentication Middleware**:
   - Protect API routes with NextAuth
   - Validate user session

### Phase 4: Data Migration (Week 3)

1. **Create Migration Endpoint**:
   ```typescript
   // app/api/migration/import/route.ts
   POST /api/migration/import
   Body: {
     budget: number,
     expenses: Expense[]
   }
   ```

2. **Migration UI**:
   - One-time import from localStorage
   - Show preview before import
   - Confirm and execute

3. **localStorage → Database**:
   - Read localStorage data
   - Create initial period
   - Create budget addition
   - Import all expenses
   - Clear localStorage after success

### Phase 5: Offline Support (Week 4)

1. **Setup Dexie.js**:
   ```typescript
   // lib/offline/queue.ts
   const db = new Dexie('BudgetTrackerQueue')
   db.version(1).stores({
     queue: '++id, type, timestamp'
   })
   ```

2. **Implement Sync Logic**:
   - Queue failed requests
   - Retry on reconnection
   - Conflict resolution

### Phase 6: Testing & Deploy (Week 4-5)

1. **Testing Checklist**:
   - [ ] All PRODUCT.md user flows work
   - [ ] 2-stage expense modal
   - [ ] Budget snapshots save correctly
   - [ ] Period closing generates summary
   - [ ] Offline queue syncs
   - [ ] Mobile responsive

2. **Deploy to Vercel**:
   ```bash
   # Connect GitHub repo
   # Push to main branch
   # Vercel auto-deploys
   
   # Or manual deploy
   npx vercel --prod
   ```

3. **Environment Variables** (Vercel Dashboard):
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="..."
   NEXTAUTH_URL="https://your-app.vercel.app"
   ```

**Estimated Timeline**:
- Phase 1: 2-3 days
- Phase 2: 3-4 days  
- Phase 3: 3-4 days
- Phase 4: 1-2 days
- Phase 5: 2-3 days
- Phase 6: 2-3 days

**Total: 4-5 weeks for complete migration**

---

## ⚠️ Technical Risks & Mitigation

### Risk 1: Budget Calculation Inconsistency

**Problem**: Budget calculated differently on client vs server

**Mitigation**:
- Server is source of truth for budget snapshots
- Client only displays what server sends
- Use Decimal type (not float) for money
- Validation: `Zod.number().positive().multipleOf(0.01)`

### Risk 2: Concurrent Edits (Multi-Device)

**Problem**: User edits same expense on phone and desktop simultaneously

**Mitigation Strategy**: **Last-Write-Wins with Timestamp**
```typescript
// On update, check lastUpdatedAt
if (expense.updatedAt > clientLastSeen) {
  return {
    error: "CONFLICT",
    message: "Expense was updated on another device",
    serverVersion: expense
  }
}
```

**Client Behavior**:
- Show conflict dialog
- Display server version vs local version
- User chooses which to keep

### Risk 3: Offline Queue Grows Too Large

**Problem**: User offline for days, 100+ queued actions

**Mitigation**:
- Limit queue size: 100 actions max
- After limit, show warning: "Connect to sync"
- Compress queue: Batch similar actions
  ```typescript
  // Instead of 5 separate updates to same expense
  // Keep only the latest update
  ```

### Risk 4: Period Closing Takes Too Long

**Problem**: Period with 1000s of expenses takes seconds to calculate summary

**Mitigation**:
- Pre-calculate metrics incrementally:
  ```typescript
  // In Period table, maintain running totals
  totalBudget: Decimal
  totalSpent: Decimal
  expenseCount: Int
  ```
- Update on each budget/expense change
- Period summary = read these fields (no calculation)

**Performance Target**: Period close < 500ms

### Risk 5: Migration Data Loss

**Problem**: Migration fails mid-process, data corrupted

**Mitigation**:
- Migration is ONE atomic transaction
- Rollback on any error
- Keep localStorage data until user confirms success
- Export localStorage to JSON file before migration (download link)

---

## 🎯 Technical Feasibility Assessment

### PRODUCT.md Requirements vs Technical Reality

| Requirement | Feasibility | Complexity | Notes |
|------------|-------------|-----------|-------|
| Continuous periods | ✅ High | 🟢 Low | Simple NULL check on endDate |
| Budget types (3 types) | ✅ High | 🟢 Low | Enum in database |
| Budget snapshots (immutable) | ✅ High | 🟡 Medium | Calculate on create, store, never update |
| Live budget preview | ✅ High | 🟢 Low | Client-side calculation |
| 2-stage expense modal | ✅ High | 🟢 Low | React state management |
| Dynamic categories | ✅ High | 🟡 Medium | CRUD + reassignment logic |
| Offline support | ✅ High | 🟡 Medium | IndexedDB + sync queue |
| Multi-device sync | ✅ High | 🟡 Medium | React-query cache invalidation |
| Period summary archive | ✅ High | 🟢 Low | JSON field in database |
| Compact list view | ✅ High | 🟢 Low | CSS + component refactor |
| Color token system | ✅ High | 🟢 Low | Tailwind config update |

**Overall Verdict**: ✅ **All requirements are technically feasible with recommended stack.**

**Total Estimated Development Time**: 4-5 weeks for solo developer

---

## 💡 Recommended Development Approach

### Iteration 1: Core Backend (2 weeks)
- Setup Prisma + PostgreSQL
- Implement auth (simple JWT)
- Build periods API
- Build budget additions API
- Build expenses API (with snapshots)
- Deploy to Render

### Iteration 2: Frontend Integration (1.5 weeks)
- Add API client
- Integrate react-query
- Update expense form (2-stage)
- Update budget form (types)
- Add budget snapshot display

### Iteration 3: Enhanced UX (1 week)
- Add category management
- Compact list view
- Color token system
- Period closing flow

### Iteration 4: Offline + Polish (0.5 week)
- IndexedDB offline queue
- Sync indicator
- Error handling
- Migration tool

---

## 🔍 Alternative Approaches Considered

### Alternative 1: Supabase (Backend-as-a-Service)

**Pros**:
- No backend code needed
- Built-in auth
- Real-time subscriptions
- PostgreSQL included

**Cons**:
- Less control over business logic
- Budget snapshot calculation must happen client-side or in Edge Functions
- Learning curve for Supabase-specific patterns
- V1.0 single-user doesn't benefit much from real-time

**Verdict**: ❌ Not recommended for V1.0. Custom backend is simpler and more flexible.

### Alternative 2: Firebase/Firestore

**Pros**:
- No backend code
- Real-time sync built-in
- Offline support automatic

**Cons**:
- NoSQL (Firestore) - awkward for relational data (periods → budgets → expenses)
- Querying complex (can't do JOINs)
- Budget snapshot calculation must be in Cloud Functions
- Decimal type issues (Firestore uses doubles)

**Verdict**: ❌ Not recommended. PostgreSQL is better fit for financial data.

### Alternative 3: Keep localStorage + Add Sync Layer

**Pros**:
- Minimal changes to existing code
- Simpler initial implementation

**Cons**:
- Single-device limitation remains
- Data loss if browser cache cleared
- No multi-user path forward
- No budget snapshots (would be client-calculated, unreliable)

**Verdict**: ❌ Doesn't meet product requirements. Backend is necessary.

---

## 📚 Dependencies & Versioning

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.7.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "prisma": "^5.7.0",
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/express": "^4.17.21",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.2"
  }
}
```

### Frontend New Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "@tanstack/react-query": "^5.14.2",
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "date-fns": "^3.0.6",
    "zod": "^3.22.4",
    "react-hot-toast": "^2.4.1"
  }
}
```

---

## ⚠️ CRITICAL: Frontend Migration to Next.js

### Current State: Vite + React (localStorage)
**Location**: `C:\Users\Fernando\Documents\FerJuan\Control-de-gastos`

The existing Budget Tracker frontend is a Vite + React SPA that stores data in localStorage. This entire frontend will be **migrated to Next.js 14** as part of this project.

### Migration Approach

**NOT** a rewrite from scratch. We will:
1. ✅ **Preserve existing components** (adapt, don't rebuild)
2. ✅ **Keep Tailwind CSS** (same styling system)
3. ✅ **Maintain component logic** (forms, modals, lists)
4. ✅ **Reuse TypeScript types** (expenses, budgets, etc.)

**Key Changes**:
- ❌ Remove: Vite build system → ✅ Next.js build
- ❌ Remove: Context API for server state → ✅ TanStack Query
- ❌ Remove: localStorage → ✅ PostgreSQL via API
- ❌ Remove: Client-only routing → ✅ Next.js file-based routing
- ✅ Keep: All UI components (adapt to Server/Client Components)
- ✅ Keep: Tailwind styles
- ✅ Keep: Component structure and logic

### IMPLEMENTATION_GUIDE.md Requirements

The IMPLEMENTATION_GUIDE.md **MUST** include a comprehensive, error-free migration section covering:

1. **Component Migration Map**:
   ```
   src/components/BudgetForm.tsx       → components/budgets/BudgetForm.tsx
   src/components/ExpenseForm.tsx      → components/expenses/ExpenseForm.tsx
   src/components/ExpenseList.tsx      → components/expenses/ExpenseList.tsx
   src/components/ExpenseFilter.tsx    → components/expenses/ExpenseFilter.tsx
   ```

2. **'use client' Directive Guide**:
   - Which components need `'use client'`
   - Why (uses useState, onClick, etc.)
   - Examples for each component type

3. **Context API → TanStack Query Migration**:
   - Step-by-step conversion of BudgetContext
   - Before/after code examples
   - How to replace useReducer with useQuery/useMutation

4. **Import Path Updates**:
   ```typescript
   // OLD (Vite)
   import { Component } from '../components/Component'
   import { utils } from '@/utils'
   
   // NEW (Next.js)
   import { Component } from '@/components/Component'
   import { utils } from '@/lib/utils'
   ```

5. **Routing Migration**:
   - Map of old routes → new file structure
   - How to handle route parameters
   - Protected routes pattern

6. **localStorage Migration**:
   - One-time import from localStorage → Database
   - Migration UI flow
   - Data preservation strategy

7. **Testing Strategy**:
   - How to test each migrated component
   - Verification checklist
   - Rollback plan if issues found

8. **Common Pitfalls & Solutions**:
   - Server Component errors
   - Hydration mismatches
   - Missing 'use client' directives
   - Import path issues

### Success Criteria

Migration is successful when:
- ✅ All existing functionality works in Next.js
- ✅ No data loss from localStorage → Database
- ✅ All components render correctly
- ✅ Mobile responsive maintained
- ✅ Performance same or better
- ✅ Zero TypeScript errors
- ✅ All existing features from PRODUCT.md work

### Timeline Allocation

Frontend migration accounts for **40% of total project time**:
- Component migration: 3-4 days
- State management refactor: 2-3 days
- Routing setup: 1 day
- Data migration: 1-2 days
- Testing & fixes: 2-3 days

---

## ✅ Next Steps

After approval of this RESEARCH.md:
1. Review technical decisions with team
2. Confirm stack choices (any preferences/restrictions?)
3. Setup development environments
4. Create **IMPLEMENTATION_GUIDE.md** with:
   - Exact file structures
   - API endpoint specifications
   - Component breakdown
   - Step-by-step build instructions
   - Code examples and snippets

---

**Document Status**: Draft v2.0 (Updated for Next.js)  
**Feedback Needed From**:
- Fernando (Technical Owner) - Confirm Next.js approach
- Validate Supabase project #2 availability

**Related Documents**:
- PRODUCT.md (Product Specification)
- IMPLEMENTATION_GUIDE.md (To be created next)

**Change Log**:
- 2025-12-28 v1.0: Initial draft with Express backend
- 2025-12-28 v2.0: Updated to Next.js 14 full-stack approach
  - Changed framework from Express → Next.js API Routes
  - Changed auth from JWT → NextAuth.js
  - Changed deployment from Render → Vercel
  - Added detailed frontend migration section
  - Database remains PostgreSQL via Supabase (project #2)
  - All PRODUCT.md requirements unchanged
