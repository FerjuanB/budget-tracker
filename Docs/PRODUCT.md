# Family Budget Tracker - Product Specification

**Version:** 1.0  
**Date:** December 28, 2025  
**Author:** Fernando @ ProjectXInnovation  
**Project:** Control-de-gastos (Enhanced Version)

---

## 🎯 Problem Statement

### Current Pain Points
Families need to track monthly expenses against their budget, but traditional calendar months don't align with income deposit dates. Current solution limitations:

1. **Fixed Calendar Months**: Budget resets on the 1st of each month regardless of when salary is deposited
2. **No Persistence**: Data stored only in localStorage, can't access from multiple devices
3. **Lost History**: Previous months' data isn't accessible for comparison or analysis
4. **Single Budget Entry**: Can't add additional income during the month (bonuses, side income)
5. **Poor Space Usage**: Current expense list UI takes too much vertical space

### User Need
A family budget management system that:
- Tracks expenses based on **custom pay periods** (not calendar months)
- Persists data to a backend for **multi-device access**
- Maintains **historical records** of all past periods
- Allows **multiple budget additions** throughout a period
- Provides an **efficient, mobile-friendly** expense viewing experience

---

## 👥 Target Users

### Primary User: Head of Household
- **Age Range**: 25-55
- **Tech Savvy**: Medium (comfortable with mobile apps)
- **Usage Pattern**: Daily expense entry, weekly budget review
- **Devices**: Mobile phone (primary), desktop (secondary)

### Secondary User: Family Members
- **Role**: Add expenses they make
- **Access Level**: Can add/edit their own expenses
- **Usage Pattern**: Sporadic expense entry

---

## ✨ Core Functionality

### 1. Continuous Budget Periods

#### 1.1 Period Lifecycle
**User Story**: As a family manager, I want my budget period to continue running until I manually decide to close it and start a new one.

**Key Concept**: Periods are **not automatic** or calendar-based. They run continuously until the user explicitly saves/closes them.

**Acceptance Criteria**:
- Period starts when user defines first budget
- Period has a start date but **no automatic end date**
- Period continues indefinitely (days, weeks, months) until user clicks "Save Period"
- User decides when to close the period based on their own criteria (salary cycle, personal preference)

**"Save Period" Action**:
- Button always visible: "💾 Save Current Period"
- Click triggers confirmation: "Close this period and start fresh? You won't be able to add more expenses to this period."
- On confirm:
  - Current period is closed and archived with end date = today
  - New period automatically starts with:
    - Start date = today
    - Budget = 0 (user must add new budget)
    - Expenses = empty
- Closed periods become read-only historical records

**Example Flow**:
```
Day 1 (Jan 20): User adds $3,000 budget → Period starts
Day 15 (Feb 3): User adds more expenses
Day 30 (Feb 19): User receives salary
Day 31 (Feb 20): User clicks "Save Period"
                 → Period "Jan 20 - Feb 20" archived
                 → New period starts "Feb 20 - ..."
```

#### 1.3 Saving/Closing Current Period
**User Story**: As a user, I want to manually close my current period when I'm ready to start fresh, and see a detailed summary before confirming.

**Save Period Button**: "💾 Save Period" - Always visible in header when viewing current period

**Confirmation Modal** (Informative with Summary):
```
┌─────────────────────────────────────┐
│         Close Current Period?       │
├─────────────────────────────────────┤
│  📊 Period Summary:                 │
│                                      │
│  📅 Started: Jan 20, 2025           │
│  📅 Duration: 32 days               │
│                                      │
│  💰 Budget:                         │
│    Total Added: $3,500              │
│    (3 additions)                    │
│                                      │
│  💸 Expenses:                       │
│    Total Spent: $2,847              │
│    (45 expenses)                    │
│                                      │
│  💵 Final Balance:                  │
│    Remaining: $653 (18.7%)          │
│                                      │
│  🏷️ Top Categories:                 │
│    🍔 Alimentación: $892 (31%)      │
│    🚗 Transporte: $645 (23%)        │
│    🏠 Vivienda: $450 (16%)          │
│                                      │
│  ℹ️ This period will be archived    │
│     and you'll start a fresh        │
│     period with zero budget.        │
│                                      │
│     [Cancel] [Save & Close Period]  │
└─────────────────────────────────────┘
```

**After Confirmation**:
1. Current period is closed and archived:
   - End date set to today
   - Status changed to "Closed"
   - Becomes read-only
   - Period summary saved permanently

2. New period automatically starts:
   - Start date = today
   - Budget = $0 (user must add new budget)
   - Expenses = empty
   - Status = "Active"

3. Success notification:
   ```
   ✅ Period Closed Successfully
   
   Jan 20 - Feb 20, 2025 has been archived.
   New period started.
   
   [View Archived Period] [Add Budget]
   ```

**Period Summary Archive**:
The summary shown in the confirmation modal is permanently saved with the closed period and can be viewed later in historical period view.

---

### 2. Multi-Budget System

#### 2.1 Adding Budget with Types
**User Story**: As a user, I want to add income, make corrections, or deduct budget with clear categorization and audit trail.

**Budget Addition Types**:

**Type 1: Income (+)** - Default
- Adding money to budget (salary, bonus, freelance, etc)
- Amount is always positive
- Increases total budget

**Type 2: Adjustment (-)** - Correction
- Fixing errors in previous budget entries
- Amount is always negative (deducted)
- Requires explanation in comments
- Examples: "Duplicate entry correction", "Wrong amount fix"

**Type 3: Deduction (-)** - Withdrawal
- Removing money from budget for external use
- Amount is always negative (deducted)
- Requires explanation in comments
- Examples: "Emergency withdrawal", "Transfer to savings", "Loan to family"

**Form Fields**:
- **Type** (required, dropdown):
  - Income (+) [default]
  - Adjustment (-) [correction]
  - Deduction (-) [withdrawal]
- **Amount** (required, always entered as positive number, sign determined by Type)
- **Source/Description** (required, max 50 chars)
- **Date** (defaults to today, can be changed)
- **Comments/Notes** (REQUIRED for Adjustment/Deduction, optional for Income, max 200 chars)

**Validation Rules**:
- Amount must be > 0 (system adds sign based on Type)
- Amount must be a valid number
- Description required, max 50 characters
- Comments REQUIRED if Type is Adjustment or Deduction
- Comments max 200 characters

**Budget Snapshot Saved**:
Each budget addition captures:
```typescript
{
  id: string
  type: 'income' | 'adjustment' | 'deduction'
  amount: number  // Positive for income, negative for adj/ded
  source: string
  comments: string
  date: Date
  budgetSnapshot: {
    before: number
    after: number
    capturedAt: Date
  }
  createdAt: Date
}
```

**Example Flow**:
```
Jan 20: Add Income: +$3,000 (Salary)
        Before: $0 → After: $3,000
        Comment: "Monthly salary deposit"

Jan 25: Add Income: +$500 (Freelance)
        Before: $3,000 → After: $3,500
        Comment: "Web design project for Client X"

Jan 26: Add Adjustment: -$500 (Correction)
        Before: $3,500 → After: $3,000
        Comment: "Accidentally added freelance income twice"

Total Budget: $3,000
```

#### 2.2 Budget History Display
**User Story**: As a user, I want to see all budget additions with their types and impact on total budget.

**Acceptance Criteria**:
- Collapsible "Budget History" section shows all additions
- **List View** shows:
  - Date added
  - Type icon: 💵 Income | 🔧 Adjustment | ⬇️ Deduction
  - Amount (with sign: +$3,000 or -$500)
  - Source/Description
  - Running total after each entry
- **Tap to expand** individual entry shows:
  - Full comments/notes
  - Budget snapshot (before → after)
  - Timestamp (exact time added)
  - Delete action (with confirmation)
- Budget additions are IMMUTABLE (cannot edit amount)
- Can only delete budget additions (no editing)
- Each entry shows its budget impact

**Visual Display**:
```
┌─────────────────────────────────────┐
│ Budget History ▼                    │
├─────────────────────────────────────┤
│ 💵 Jan 20  +$3,000  Salary         │
│    Running Total: $3,000            │
│                                      │
│ 💵 Jan 25  +$500    Freelance      │
│    Running Total: $3,500            │
│                                      │
│ 🔧 Jan 26  -$500    Correction     │ ← Adjustment
│    Running Total: $3,000            │
│                                      │
│ ⬇️  Jan 28  -$200    Emergency      │ ← Deduction
│    Running Total: $2,800            │
├─────────────────────────────────────┤
│ Total Budget: $2,800                │
│                                      │
│ Filter: [All Types ▼]               │
└─────────────────────────────────────┘
```

**Expanded Budget Entry Detail**:
```
┌─────────────────────────────────────┐
│ Budget Addition Details             │
├─────────────────────────────────────┤
│ 🔧 Adjustment (Correction)          │
│ -$500                               │
│                                      │
│ Source: Duplicate entry fix         │
│ Date: Jan 26, 2025                  │
│                                      │
│ 💬 Comments:                         │
│ "Accidentally added freelance       │
│  income twice on Jan 25. This       │
│  corrects the error."                │
│                                      │
│ 💰 Budget Impact:                   │
│ Before: $3,500                      │
│ After:  $3,000                      │
│                                      │
│ ⏰ Added: Jan 26, 4:32 PM           │
│                                      │
│         [🗑️ Delete] [Close]          │
└─────────────────────────────────────┘
```

**Immutability Note**:
- Budget additions CANNOT be edited (amount, type, or date)
- Only description/comments can be viewed
- If mistake in amount: Delete and create new entry
- This maintains accurate budget snapshots and audit trail

---

### 3. Expense Management with Budget Snapshots

#### 3.1 Adding Expenses with Budget Impact Preview
**User Story**: As a user, I want to see the budget impact in real-time as I enter an expense, and receive confirmation after saving.

**2-Stage Process**:
1. **Stage 1**: Expense Form with Live Budget Preview
2. **Stage 2**: Success Confirmation with Budget Snapshot

**Stage 1: Form with Live Preview**

**Form Fields**:
- **Expense Name** (required, max 50 chars)
- **Amount** (required, positive number)
- **Category** (required, select/create custom category)
- **Date** (defaults to today, can be changed to any date in current period)
- **Comments/Notes** (optional, max 500 chars)

**Live Budget Impact Preview** (Updates as user types amount):
```
┌─────────────────────────────────────┐
│  ✕              [New Expense]       │
├─────────────────────────────────────┤
│  Expense Name *                     │
│  [Supermercado Día______]          │
│                                      │
│  Amount *                           │
│  $ [45.00_______________]           │
│                                      │
│  💰 Budget Impact Preview:          │ ← LIVE PREVIEW
│  Current Budget: $3,000             │
│  After Expense:  $2,955 (-$45)     │
│  ─────────────────────────           │
│  Status: ✅ Within Budget            │
│  (or ⚠️ Over Budget by $X)          │
│                                      │
│  Category *                         │
│  [🍔 Alimentación ▼]                │
│  [+ Create New Category]            │
│                                      │
│  Date                               │
│  [Jan 22, 2025 📅]                  │
│                                      │
│  Comments (optional)                │
│  [________________________]         │
│  [________________________]         │
│  [________________________]         │
│  [________________________]         │
│  Max 500 characters                 │
│                                      │
│           [Cancel] [Save]           │
└─────────────────────────────────────┘
```

**Over Budget Warning** (if expense exceeds remaining):
```
💰 Budget Impact Preview:
Current Budget: $450
After Expense:  -$50 (-$500)

⚠️ Warning: Over Budget
This expense exceeds your remaining 
budget by $50. You can still add it.

[Cancel] [Add Anyway]
```

**Stage 2: Success Confirmation Modal**

After clicking "Save", modal transforms to show:
```
┌─────────────────────────────────────┐
│ ✅ Expense Added Successfully!      │
├─────────────────────────────────────┤
│  Supermercado Día                   │
│  🍔 Alimentación                    │
│  $45.00                             │
│  📅 Jan 22, 2025, 3:45 PM           │
│                                      │
│  💰 Budget Impact:                  │
│  Before: $3,000                     │
│  After:  $2,955                     │
│  ─────────────────────────           │
│                                      │
│  📊 Budget Status:                  │
│  Remaining: $2,955 (98.5% left)     │
│  [████████████████████░░] 1.5%      │
│                                      │
│       [Add Another] [Close]         │
└─────────────────────────────────────┘
```

**Budget Snapshot Saved** (Immutable):
```typescript
interface Expense {
  id: string
  expenseName: string
  amount: number
  category: string
  date: Date
  comments?: string
  budgetSnapshot: {
    before: number      // Budget available BEFORE expense
    after: number       // Budget available AFTER expense
    capturedAt: Date    // When expense was created
  }  // IMMUTABLE - never changes, even if expense edited
  createdAt: Date
  lastEditedAt?: Date
}
```

**Validation Rules**:
- Amount must be > 0
- Expense name required
- Category must be valid selection or newly created
- Date must be within current budget period
- Budget snapshot warning if over budget (not blocking)

#### 3.2 Expense List View (Compact Display)
**User Story**: As a mobile user, I want to see expenses at a glance without unnecessary details cluttering the view.

**List View Shows ONLY**:
- 📅 **Date** (format: "Jan 22" or "Today")
- 💰 **Amount** (format: "$45.00")
- 🏷️ **Category Icon + Name** (truncated if needed)

**What's Hidden in List View**:
- ❌ Expense name (visible only in detail modal)
- ❌ Comments/notes (visible only in detail modal)
- ❌ Timestamp (visible only in detail modal)

**Acceptance Criteria**:
- Compact card: ~50px height
- Tap expense to open detailed modal
- Swipe left to reveal edit/delete quick actions
- Visual grouping by date

**Example List View**:
```
┌─────────────────────────────────────┐
│ Today - $133.50 ▼                   │
├─────────────────────────────────────┤
│ Jan 22  🍔 Alimentación    $45.00  │ ← Tap for details
│ Jan 22  ⛽ Transporte       $60.00  │
│ Jan 22  🍕 Alimentación    $28.50  │
└─────────────────────────────────────┘
```

#### 3.3 Expense Detail Modal with Budget Snapshot
**User Story**: As a user, I want to see complete information about an expense including the budget impact at the time it was created.

**Modal Triggered By**:
- Tapping on any expense in the list

**Detail Modal Shows**:
```
┌─────────────────────────────────────┐
│  ✕                [Expense Details] │
├─────────────────────────────────────┤
│  Supermercado Día                   │
│  🍔 Alimentación                    │
│  $45.00                             │
│  📅 Jan 22, 2025, 3:45 PM           │
│                                      │
│  💬 Comments:                        │
│  "Compra mensual: leche, pan,       │
│   verduras, carne. Recibo guardado  │
│   en carpeta física."                │
│                                      │
│  💰 Budget Snapshot (at creation):  │ ← IMMUTABLE
│  Before: $3,000                     │
│  After:  $2,955                     │
│  Impact: -$45.00                    │
│                                      │
│  ℹ️ This snapshot reflects budget   │
│     at time of creation and does    │
│     not change if expense edited.   │
│                                      │
│  ⏰ Created: Jan 22, 3:45 PM        │
│  ✏️ Last Edited: Jan 23, 10:12 AM   │ ← If edited
│     (Changed from $40 to $45)       │
│                                      │
│       [Edit] [Delete] [Close]       │
└─────────────────────────────────────┘
```

**If Expense Was Edited**:
Shows additional info about the edit:
```
💰 Budget Snapshot (at creation):
Before: $3,000
After:  $2,955
Impact: -$45.00

ℹ️ Note: Original amount was $40
Changed to $45 on Jan 23, 10:12 AM
Current budget impact: -$45 from available budget
```

**Key Behaviors**:
- Budget snapshot is IMMUTABLE - shows budget at creation time
- If expense edited, snapshot does NOT change
- Shows note about edit with original amount
- Clear distinction between historical snapshot and current impact

#### 3.4 Editing Expenses
**User Story**: As a user, I want to correct mistakes in expenses I entered.

**Acceptance Criteria**:
- Edit button in detail modal OR swipe left in list view
- Edit opens form modal with pre-filled data
- All fields editable:
  - Expense name
  - Amount
  - Category (can change or create new)
  - Date
  - Comments
- Changes saved with "last edited" timestamp
- Can only edit expenses in current period (past periods read-only)

#### 3.5 Deleting Expenses
**User Story**: As a user, I want to remove expenses that were entered by mistake.

**Acceptance Criteria**:
- Delete button in detail modal OR swipe left in list view
- Confirmation dialog: "Delete [Expense Name]? This cannot be undone."
- Soft delete (marked as deleted, recoverable for 30 days)
- Budget automatically recalculates after deletion

#### 3.6 Dynamic Category Management

##### 3.6.1 Category System Overview
**User Story**: As a user, I want to create and manage my own expense categories instead of being limited to predefined ones.

**Key Concept**: Categories are **dynamic and user-defined**. Users can create, edit, and delete categories at any time.

**Default Categories** (Provided on First Setup):
- 🍔 Alimentación (Food)
- 🏠 Vivienda (Housing)
- 🚗 Transporte (Transportation)
- 💊 Salud (Health)
- 👕 Ropa (Clothing)
- 🎭 Entretenimiento (Entertainment)
- 📚 Educación (Education)
- 💡 Servicios (Utilities)
- 🛒 Otros (Other)

**Note**: These are just starting suggestions. Users can modify/delete any of them.

##### 3.6.2 Creating Categories
**User Story**: As a user, I want to create a new category on-the-fly when adding an expense.

**Method 1: During Expense Creation**
- In "Add Expense" modal, Category dropdown includes option: "+ Create New Category"
- Clicking opens inline form:
  - **Category Name** (required, max 30 chars)
  - **Icon Selector** (choose from emoji picker or icon library)
  - **Color** (optional, for visual grouping)
- New category immediately available for current expense
- Category saved to user's personal category list

**Method 2: From Settings**
- Settings → "Manage Categories"
- Button: "+ Add New Category"
- Same form as Method 1
- Categories created here available for future expenses

**Validation Rules**:
- Category name must be unique (case-insensitive)
- Name max 30 characters
- Name required
- Icon optional (defaults to 📌 if not selected)

**Example Flow**:
```
Adding expense "Netflix"
→ Category dropdown open
→ Don't see "Streaming" category
→ Click "+ Create New Category"
→ Enter: "Streaming" with 📺 icon
→ Category created and auto-selected
→ Expense saved with new category
```

##### 3.6.3 Editing Categories
**User Story**: As a user, I want to rename or change the icon of existing categories.

**Acceptance Criteria**:
- Settings → "Manage Categories" shows all categories
- Tap category to edit:
  - Change name
  - Change icon
  - Change color
- Changes apply to:
  - Future expenses immediately
  - Past expenses retroactively (same category, new name/icon)
- Warning if category has existing expenses: "X expenses use this category. Changes will affect all of them."

**Validation**:
- Cannot rename to match existing category name
- Changes saved immediately

##### 3.6.4 Deleting Categories
**User Story**: As a user, I want to remove categories I no longer use.

**Acceptance Criteria**:
- Settings → "Manage Categories"
- Swipe left on category or tap delete button
- Confirmation required: "Delete [Category Name]?"

**Smart Deletion Logic**:
- **If category has NO expenses**: Delete immediately
- **If category HAS expenses**: Show options:
  1. "Reassign expenses to..." (dropdown of other categories)
  2. "Move to 'Other'" (default fallback category)
  3. "Cancel" (keep category)

**Example Flow**:
```
User wants to delete "Entretenimiento"
→ Has 15 expenses using this category
→ Dialog: "15 expenses use Entretenimiento. What should we do?"
   Option 1: Reassign to [Streaming ▼]
   Option 2: Move to 'Other'
   Cancel
→ User selects "Move to Other"
→ All 15 expenses now categorized as "Other"
→ "Entretenimiento" category deleted
```

##### 3.6.5 Category Display in Expense List
**User Story**: As a user, I want to quickly identify expenses by their category icon and name.

**List View Display**:
```
┌─────────────────────────────────────┐
│ Jan 22  🍔 Alimentación    $45.00  │
│ Jan 22  📺 Streaming       $12.99  │ ← Custom category
│ Jan 22  🚗 Transporte      $60.00  │
└─────────────────────────────────────┘
```

**Filtering**:
- Filter dropdown shows all active categories (including custom ones)
- Categories sorted alphabetically
- Categories with no expenses shown in gray (optional: hide if no expenses)

##### 3.6.6 Category Management Screen
**User Story**: As a user, I want a dedicated screen to manage all my categories.

**Access**: Settings → "Manage Categories"

**Screen Layout**:
```
┌─────────────────────────────────────┐
│  ← Manage Categories                │
│                                      │
│  [+ Add New Category]                │
│                                      │
│  Your Categories (12)                │
│  ├─────────────────────────────────┤
│  │ 🍔 Alimentación      (45 uses)  │ → Tap to edit
│  │ 🏠 Vivienda           (3 uses)  │
│  │ 📺 Streaming          (1 use)   │ ← Custom
│  │ 🚗 Transporte        (28 uses)  │
│  │ 💊 Salud             (0 uses)   │ ← Can delete
│  │ ...                              │
│  └─────────────────────────────────┘
│                                      │
│  Swipe left to delete                │
└─────────────────────────────────────┘
```

**Features**:
- Shows usage count (how many expenses per category)
- Sorted by usage (most used first)
- Quick edit: tap to edit
- Quick delete: swipe left
- Search bar if many categories

---

### 4. Expense List Display (UX Optimization)

#### 4.1 Compact List View
**User Story**: As a mobile user, I want to see more expenses on screen without scrolling, showing only essential information.

**Current Problem**: Large expense cards waste space, showing only 2-3 expenses per screen.

**Proposed Solution - Ultra-Compact Cards**:
- Card height: ~50px (down from ~100px)
- **Displays ONLY**: Date | Category Icon + Name | Amount
- **Hidden until detail modal**: Expense name, comments, timestamps
- Tap card to open detail modal with full information

**Visual Layout**:
```
┌─────────────────────────────────────┐
│ Today - $133.50 ▼                   │ ← Date Group Header
├─────────────────────────────────────┤
│ Jan 22  🍔 Alimentación    $45.00  │ ← Compact card
│ Jan 22  ⛽ Transporte       $60.00  │
│ Jan 22  🍕 Alimentación    $28.50  │
├─────────────────────────────────────┤
│ Yesterday - $87.25 ▼                │
│ Jan 21  💊 Salud           $32.00  │
│ Jan 21  🚗 Transporte      $15.25  │
└─────────────────────────────────────┘
```

**Interaction**:
- **Tap**: Opens expense detail modal
- **Swipe left**: Reveals edit/delete quick actions
- **Long press**: Multi-select mode (future feature)

**Benefits**:
- See 6-8 expenses per mobile screen (vs 2-3 current)
- Faster scanning and scrolling
- Cleaner, less cluttered interface
- Details available on-demand via modal

#### 4.2 Grouped by Date
**User Story**: As a user, I want to see expenses organized by day to understand daily spending patterns.

**Acceptance Criteria**:
- Expenses grouped by date (most recent first)
- Date headers show: "Today", "Yesterday", or "Mon, Jan 22"
- Daily subtotal displayed in each date group
- Collapsible date groups (tap header to expand/collapse)

**Example**:
```
Today - $133.50 ▼
  🍔 Supermercado      -$45.00
  ⛽ Gasolina          -$60.00
  🍕 Pizza Express     -$28.50

Yesterday - $87.25 ▼
  💊 Farmacia          -$32.00
  🚗 Uber              -$15.25
  ...
```

#### 4.3 Empty States
**User Story**: As a new user, I want clear guidance when no expenses exist yet.

**Acceptance Criteria**:
- Empty state shows:
  - Friendly illustration
  - "No expenses yet"
  - "Tap the + button to add your first expense"
- Different message for filtered view: "No expenses in this category"

---

### 5. Budget Tracking & Visualization

#### 5.1 Budget Summary Card
**User Story**: As a user, I want to see at a glance how much budget remains.

**Acceptance Criteria**:
- Fixed position at top (always visible when scrolling)
- Displays:
  - Total Budget (all additions summed)
  - Total Spent
  - Remaining (with color coding)
  - Progress bar or circular indicator
- Color coding:
  - Green: 0-60% spent
  - Yellow: 61-85% spent
  - Orange: 86-95% spent
  - Red: 96-100% spent
  - Dark Red: Over budget (>100%)

**Layout** (Compact for Mobile):
```
┌─────────────────────────────────────┐
│  Period: Dec 20 - Jan 19           │
│  ━━━━━━━━━━━━━━━━━━━░░░░░░ 75%     │
│  Budget: $3,500 | Spent: $2,625    │
│  Remaining: $875                    │
└─────────────────────────────────────┘
```

#### 5.2 Category Breakdown
**User Story**: As a user, I want to understand where my money goes by category.

**Acceptance Criteria**:
- Collapsible "Category Breakdown" section
- Shows each category with:
  - Category icon + name
  - Amount spent
  - Percentage of total spending
  - Mini progress bar
- Sorted by highest spending first
- Tap category to filter expenses by that category

---

### 6. Historical Period Access

#### 6.1 Period Navigation
**User Story**: As a user, I want to review my spending from previous closed periods.

**Acceptance Criteria**:
- Navigation controls: ◀ Previous Period | **Current** | Next Period ▶
- "Current Period" badge: Green with "Active" indicator
- Historical periods shown with gray "Closed" badge
- Dropdown selector: "Jump to Period" shows all closed periods (most recent first)
- Historical periods are READ-ONLY (cannot add/edit expenses)
- Cannot add/edit expenses in closed periods
- Clear visual distinction: 
  - Current period header: Green background
  - Historical period header: Gray background with "🔒 Closed on [date]"

**Period List Example**:
```
Current Period (Active) - Started Feb 20, 2025 (8 days)
──────────────────────────────────
Jan 20 - Feb 20, 2025 (32 days) - Closed
Dec 15 - Jan 19, 2025 (36 days) - Closed
Nov 10 - Dec 14, 2024 (35 days) - Closed
```

#### 6.2 Period Comparison
**User Story**: As a user, I want to compare my current spending with previous periods.

**Acceptance Criteria**:
- Optional comparison view: "Compare with Previous Period"
- Shows side-by-side or overlaid data:
  - Total budget
  - Total spent
  - Days running (current vs closed period duration)
  - Category breakdown differences
- Visual indicators: ↑ increased, ↓ decreased, → similar
- Comparison only available for closed periods (can't compare active period yet)

---

### 7. Data Persistence & Sync

#### 7.1 Backend Integration
**User Story**: As a user, I want my data saved to the cloud so I can access it from any device.

**Acceptance Criteria**:
- All data persisted to backend database (not localStorage)
- Changes auto-save within 2 seconds
- Visual indicator: "Saving..." → "Saved ✓"
- Offline support: Queue changes, sync when connection restored
- Conflict resolution: Last write wins (timestamp-based)

#### 7.2 Initial Migration
**User Story**: As an existing user, I want to import my localStorage data to the new backend.

**Acceptance Criteria**:
- On first login after deployment, detect localStorage data
- Offer: "Import existing data?" Yes/No
- If Yes: Migrate budget and expenses to backend, assign to first period
- If No: Start fresh, offer to export localStorage data as JSON backup

---

### 8. Multi-Device & User Management

#### 8.1 Authentication (Future Phase)
**Note**: V1.0 will be single-user, family shared login. Future versions will support:
- Multiple user accounts
- Family member sub-accounts
- Permission levels (admin, editor, viewer)

**V1.0 Workaround**:
- Single login (family shares credentials)
- All family members add expenses to same pool
- Optional "Added by" field in expense form

---

## 🎨 Design System: Tailwind Color Tokens

### Color System Overview
The app uses a centralized color token system in Tailwind config. All colors are defined once and referenced throughout the app, making it easy to rebrand or adjust the entire color scheme by changing values in one place.

### Tailwind Configuration

**File**: `tailwind.config.js`

```javascript
export default {
  theme: {
    extend: {
      colors: {
        // ============================================
        // PRIMARY BRAND COLORS
        // ============================================
        // Main app branding - Blues
        'primary': {
          50:  '#eff6ff',  // Lightest blue - backgrounds
          100: '#dbeafe',  // Very light blue - hover states
          200: '#bfdbfe',  // Light blue - borders
          300: '#93c5fd',  // Medium-light blue - accents
          400: '#60a5fa',  // Medium blue - interactive elements
          500: '#3b82f6',  // Main brand blue - PRIMARY COLOR
          600: '#2563eb',  // Darker blue - active states
          700: '#1d4ed8',  // Dark blue - headers
          800: '#1e40af',  // Very dark blue - text
          900: '#1e3a8a',  // Darkest blue - emphasis
        },
        
        // ============================================
        // BUDGET STATUS COLORS
        // ============================================
        // Visual indicators for budget health
        'budget': {
          'safe':    '#10b981',  // Green (0-60% spent) - Healthy
          'caution': '#f59e0b',  // Yellow (61-85% spent) - Watch it
          'warning': '#f97316',  // Orange (86-95% spent) - Careful
          'danger':  '#ef4444',  // Red (96-100% spent) - Critical
          'over':    '#dc2626',  // Dark red (>100% spent) - Over budget
        },
        
        // ============================================
        // EXPENSE CATEGORIES
        // ============================================
        // Default background colors for category badges
        // Users can customize these per category
        'category': {
          'food':          '#fbbf24', // Amber/Yellow
          'housing':       '#8b5cf6', // Purple
          'transport':     '#3b82f6', // Blue
          'health':        '#ef4444', // Red
          'clothing':      '#ec4899', // Pink
          'entertainment': '#f97316', // Orange
          'education':     '#10b981', // Green
          'utilities':     '#6366f1', // Indigo
          'other':         '#6b7280', // Gray
          // Users can add custom categories with custom colors
        },
        
        // ============================================
        // UI STATE COLORS
        // ============================================
        // Feedback and system messages
        'success': '#10b981',  // Green - Success messages
        'error':   '#ef4444',  // Red - Error messages
        'info':    '#3b82f6',  // Blue - Info messages
        'warning': '#f59e0b',  // Yellow - Warning messages
        'neutral': '#6b7280',  // Gray - Neutral/inactive
        
        // ============================================
        // PERIOD STATUS COLORS
        // ============================================
        // Period state indicators
        'period': {
          'active': '#10b981',  // Green - Current running period
          'closed': '#6b7280',  // Gray - Archived/historical
        },
        
        // ============================================
        // BUDGET TYPE COLORS
        // ============================================
        // Budget addition type indicators
        'budget-type': {
          'income':     '#10b981',  // Green - Money coming in
          'adjustment': '#f59e0b',  // Yellow - Correction
          'deduction':  '#ef4444',  // Red - Money going out
        },
      }
    }
  },
  plugins: [],
}
```

### Usage Examples

#### Budget Status Indicator
```jsx
// Dynamic color based on percentage spent
const BudgetProgress = ({ percentSpent }) => {
  const getStatusColor = () => {
    if (percentSpent < 60) return 'text-budget-safe border-budget-safe'
    if (percentSpent < 85) return 'text-budget-caution border-budget-caution'
    if (percentSpent < 95) return 'text-budget-warning border-budget-warning'
    if (percentSpent <= 100) return 'text-budget-danger border-budget-danger'
    return 'text-budget-over border-budget-over'
  }
  
  return (
    <div className={`p-4 border-2 rounded-lg ${getStatusColor()}`}>
      {percentSpent}% spent
    </div>
  )
}
```

#### Category Badge
```jsx
// Category with custom or default color
const CategoryBadge = ({ category, customColor }) => {
  const bgColor = customColor || `bg-category-${category.id}`
  
  return (
    <div className={`${bgColor} rounded-full p-2 text-white`}>
      {category.icon} {category.name}
    </div>
  )
}
```

#### Budget Type Icons
```jsx
// Budget addition with type-based styling
const BudgetAddition = ({ type, amount }) => {
  const typeConfig = {
    income: { icon: '💵', color: 'text-budget-type-income' },
    adjustment: { icon: '🔧', color: 'text-budget-type-adjustment' },
    deduction: { icon: '⬇️', color: 'text-budget-type-deduction' }
  }
  
  const config = typeConfig[type]
  
  return (
    <div className={`flex items-center ${config.color}`}>
      <span>{config.icon}</span>
      <span className="ml-2">{amount}</span>
    </div>
  )
}
```

#### Period Status Badge
```jsx
// Active vs closed period indicator
const PeriodBadge = ({ isActive }) => {
  const statusClass = isActive 
    ? 'bg-period-active text-white' 
    : 'bg-period-closed text-white'
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm ${statusClass}`}>
      {isActive ? '🟢 Active' : '🔒 Closed'}
    </span>
  )
}
```

### Color Modification Guide

To change the entire app's color scheme, simply modify values in `tailwind.config.js`:

**Example: Change from Blue to Purple branding**
```javascript
'primary': {
  500: '#8b5cf6',  // Change main brand color to purple
  600: '#7c3aed',  // Adjust related shades accordingly
  700: '#6d28d9',
  // ... etc
}
```

All components using `primary-500`, `primary-600`, etc. will automatically update throughout the app.

**Example: Adjust Budget Status Thresholds**
```javascript
'budget': {
  'safe':    '#22c55e',  // Make "safe" a brighter green
  'danger':  '#dc2626',  // Make "danger" a darker red
}
```

### Adding New Category Colors

When users create custom categories, allow them to pick from these predefined colors or enter custom hex:

```javascript
// Predefined color palette for category selection
const categoryColorOptions = [
  { name: 'Amber', value: '#fbbf24' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#10b981' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Cyan', value: '#06b6d4' },
  // ... add more as needed
]
```

Store custom colors in database with category:
```typescript
interface Category {
  id: string
  name: string
  icon: string
  color: string  // Hex color or Tailwind class name
  isCustom: boolean
}
```

### Dark Mode Support (Future)

The color system is prepared for dark mode by using Tailwind's `dark:` variant:

```jsx
<div className="bg-primary-500 dark:bg-primary-700 text-white">
  {/* Automatically adjusts in dark mode */}
</div>
```

### Accessibility Notes

All color combinations meet WCAG AA contrast ratios:
- Text on backgrounds: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: Clear focus states with `ring` utilities

```jsx
// Example with focus states
<button className="
  bg-primary-500 
  text-white 
  focus:ring-4 
  focus:ring-primary-300
  hover:bg-primary-600
">
  Click me
</button>
```

---

### Mobile-First Design
**Priority**: High (90% of usage expected on mobile)

**Improvements**:
1. ✅ Compact expense cards (60px height vs current 100px+)
2. ✅ Date grouping with collapsible sections
3. ✅ Sticky budget summary at top
4. ✅ Bottom floating action button (FAB) for adding expenses
5. ✅ Swipe gestures for edit/delete
6. ✅ Pull-to-refresh for data sync
7. ✅ Optimized touch targets (minimum 44x44px)

### Desktop Experience
**Priority**: Medium

**Improvements**:
1. ✅ Sidebar navigation (left: period selector, category filter)
2. ✅ Main area: Budget summary + Expense list (wider cards)
3. ✅ Right sidebar: Category breakdown, quick stats
4. ✅ Keyboard shortcuts (N = new expense, E = edit, Del = delete)

### Performance Optimization
1. ✅ Virtualized list for expenses (only render visible items)
2. ✅ Lazy load historical periods (load on demand)
3. ✅ Optimistic UI updates (show change immediately, sync in background)
4. ✅ Image/icon optimization (use SVG sprites)
5. ✅ Code splitting (load period comparison only when accessed)

---

## 📊 Success Metrics

### User Engagement
- **Daily Active Users**: Target 80% of registered users check app daily
- **Expense Entry**: Average 3-5 expenses added per day
- **Period Completion**: 90% of periods have budget defined

### Data Quality
- **Budget Accuracy**: Budget vs actual spending within 5% variance
- **Categorization**: 95% of expenses properly categorized

### Performance
- **Load Time**: < 2 seconds initial load on 3G
- **Sync Time**: < 1 second for expense save
- **Offline Support**: 100% of actions work offline, sync when online

---

## 🚫 Out of Scope (V1.0)

The following features are explicitly **NOT** included in V1.0:

1. ❌ Multi-user authentication with individual accounts
2. ❌ Receipt photo upload/OCR
3. ❌ Recurring expense templates
4. ❌ Budget goals/savings targets
5. ❌ Financial reports/charts (beyond category breakdown)
6. ❌ Bill payment reminders
7. ❌ Export to CSV/PDF
8. ❌ Integration with bank accounts
9. ❌ Currency conversion
10. ❌ Shopping list management

These may be considered for future versions based on user feedback.

---

## 🎯 Success Criteria

### Definition of Done
V1.0 is complete when:

1. ✅ User can start a budget period that runs continuously
2. ✅ User can manually save/close current period with "Save Period" button
3. ✅ User can add multiple budget entries per period (with comments)
4. ✅ User can add/edit/delete expenses within current period (with comments)
5. ✅ User can create custom categories on-the-fly or from settings
6. ✅ User can edit/delete existing categories with smart reassignment
7. ✅ Expense list shows only: date, category, amount (tap for details)
8. ✅ Expense detail modal shows full info: name, comments, timestamps
9. ✅ User can view historical closed periods (read-only)
10. ✅ User can filter expenses by any category (including custom)
11. ✅ All data persists to backend database
12. ✅ Budget summary shows real-time remaining balance
13. ✅ App works offline with sync queue
14. ✅ Existing localStorage data can be migrated

### User Acceptance Test Scenarios

#### Scenario 1: First-Time User Setup
```
1. User opens app for first time
2. Sees onboarding: "Start your first budget period"
3. Adds initial budget: $3,000 (Salary) with comment "January paycheck"
4. Period automatically starts (no date selection needed)
5. Sees budget summary showing $3,000 available
6. Adds first expense: Groceries, $50, Alimentación category
7. Sees updated budget: $2,950 remaining
8. Taps expense to view detail modal with full info
✅ PASS if all data persists after closing/reopening app
```

#### Scenario 2: Mid-Period Budget Addition
```
1. User in current period (started Jan 20, now Jan 25)
2. Already has $3,000 budget, spent $1,200
3. Receives bonus: $500
4. Clicks "Add Budget"
5. Enters: $500, "Performance Bonus", comment: "Q4 bonus payment"
6. Sees total budget: $3,500, remaining: $2,300
7. Opens Budget History, sees both entries with comments
✅ PASS if budget history shows both entries with full details
```

#### Scenario 3: Creating Custom Category During Expense Entry
```
1. User clicks [+] to add expense
2. Enters: "Netflix Subscription", $12.99
3. Opens category dropdown, doesn't see "Streaming"
4. Clicks "+ Create New Category"
5. Enters: "Streaming" with 📺 icon
6. Category created and auto-selected
7. Completes expense with comment: "Monthly subscription"
8. Expense saved and appears in list with new category
✅ PASS if new category persists and appears in category filter
```

#### Scenario 4: Closing Period and Starting New One
```
1. User in current period (Jan 20 - ongoing, 30 days)
2. Decides period should end (received new salary)
3. Clicks "💾 Save Period" button
4. Confirmation: "Close this period and start fresh?"
5. Confirms
6. Previous period archived as "Jan 20 - Feb 19, 2025 (30 days)"
7. New period starts: "Started Feb 19, 2025 (0 days)"
8. Budget = $0, must add new budget
9. Can navigate to previous period (read-only)
✅ PASS if previous period is read-only and new period is active
```

#### Scenario 5: Viewing Expense Details from Compact List
```
1. User viewing expense list (compact view)
2. Sees: "Jan 22  🍔 Alimentación    $45.00"
3. Taps on expense
4. Detail modal opens showing:
   - Full name: "Supermercado Día"
   - Amount: $45.00
   - Category: 🍔 Alimentación
   - Date: Jan 22, 2025
   - Comments: "Compra mensual: leche, pan..."
   - Created: Jan 22, 3:45 PM
5. Can edit or delete from modal
✅ PASS if all details accurate and actions work
```

#### Scenario 6: Historical Period Review
```
1. User in current period: Feb 20 - ongoing
2. Clicks "◀ Previous Period" button
3. Sees: Jan 20 - Feb 19, 2025 (30 days) - 🔒 Closed
4. Can view all expenses from that period
5. "+ Add Expense" button is disabled/hidden
6. Cannot edit or delete expenses
7. Can view expense details in read-only mode
8. Clicks "Current" to return to active period
✅ PASS if historical data accurate and completely read-only
```

#### Scenario 7: Multi-Device Sync
```
1. User adds expense on phone: $25, Coffee, with comment
2. Opens app on desktop within 5 seconds
3. Sees $25 expense appear with full details
4. Deletes expense on desktop
5. Returns to phone, sees expense removed
6. Budget recalculated on both devices
✅ PASS if changes sync bidirectionally including comments
```

#### Scenario 8: Category Management
```
1. User goes to Settings → Manage Categories
2. Sees all categories with usage counts
3. Creates new category: "Subscriptions" with 📱 icon
4. Edits "Entretenimiento" to "Entertainment"
5. Deletes "Salud" category (has 5 expenses)
6. Chooses to reassign to "Otros"
7. All 5 expenses now show "Otros" category
8. New expenses can use "Subscriptions" category
✅ PASS if all category operations work correctly
```

---

## 📱 Screen-by-Screen Flow

### Main Dashboard (Current Period)
```
┌─────────────────────────────────────┐
│  [☰] Family Budget    [⚙️ Settings] │ ← Header
├─────────────────────────────────────┤
│  Current Period                      │
│  Started: Jan 20, 2025 (32 days) 🟢 │ ← Period info
│  [◀ Prev]   [💾 Save Period]   [→]  │
│                                      │
│  Budget: $2,800 ━━━━━━━━━░░░ 68%    │ ← Sticky Summary
│  Spent: $1,904 | Left: $896         │
│  [+ Add Budget]  [📊 Breakdown]      │
├─────────────────────────────────────┤
│  🔍 Filter by Category: [All ▼]     │
├─────────────────────────────────────┤
│  Today - $133.50 ▼                  │ ← Date Group
│  Jan 22  🍔 Alimentación    $45.00  │ ← Tap for detail
│  Jan 22  ⛽ Transporte       $60.00  │
│  Jan 22  🍕 Alimentación    $28.50  │
│                                      │
│  Yesterday - $87.25 ▼                │
│  Jan 21  💊 Salud           $32.00  │
│  Jan 21  🚗 Transporte      $15.25  │
│  ...                                 │
│                                      │
│                                      │
│                      [+] ← Floating │
└─────────────────────────────────────┘
```

---

### Add Budget Modal (with Type Selector)
```
┌─────────────────────────────────────┐
│  ✕                 [Add Budget]     │
├─────────────────────────────────────┤
│  Type *                             │
│  [ 💵 Income ▼ ]                    │
│     ├─ 💵 Income (+)                │
│     ├─ 🔧 Adjustment (-) Correction │
│     └─ ⬇️  Deduction (-) Withdrawal  │
│                                      │
│  Amount * (always positive)         │
│  $ [500_________________]           │
│  ℹ️ Sign determined by Type         │
│                                      │
│  Source *                           │
│  [Salary____________]               │
│                                      │
│  Date                               │
│  [Jan 22, 2025 📅]                  │
│                                      │
│  Comments                           │
│  (Required for Adjustment/Deduction)│
│  [________________________]         │
│  [________________________]         │
│  Max 200 characters                 │
│                                      │
│           [Cancel] [Add]            │
└─────────────────────────────────────┘
```

---

### Budget History (Expanded)
```
┌─────────────────────────────────────┐
│  Budget History ▼                   │
├─────────────────────────────────────┤
│  💵 Jan 20  +$3,000  Salary        │ ← Tap to expand
│     Running Total: $3,000           │
│                                      │
│  💵 Jan 25  +$500    Freelance     │
│     Running Total: $3,500           │
│                                      │
│  🔧 Jan 26  -$500    Correction    │ ← Adjustment
│     Running Total: $3,000           │
│     "Duplicate entry fix"           │
│                                      │
│  ⬇️  Jan 28  -$200    Emergency     │ ← Deduction
│     Running Total: $2,800           │
│     "Medical emergency"             │
├─────────────────────────────────────┤
│  Total Budget: $2,800               │
│                                      │
│  Filter: [All Types ▼]              │
│    ├─ All                           │
│    ├─ Income only                   │
│    ├─ Adjustments only              │
│    └─ Deductions only               │
└─────────────────────────────────────┘
```

---

### Add Expense Modal - Stage 1 (Form with Live Preview)
```
┌─────────────────────────────────────┐
│  ✕              [New Expense]       │
├─────────────────────────────────────┤
│  Expense Name *                     │
│  [Supermercado Día______]          │
│                                      │
│  Amount *                           │
│  $ [45.00_______________]           │
│                                      │
│  💰 Budget Impact Preview:          │ ← LIVE
│  Current: $2,800                    │
│  After:   $2,755 (-$45)            │
│  ─────────────────────────           │
│  Status: ✅ Within Budget            │
│                                      │
│  Category *                         │
│  [🍔 Alimentación ▼]                │
│  [+ Create New Category]            │
│                                      │
│  Date                               │
│  [Jan 22, 2025 📅]                  │
│                                      │
│  Comments (optional)                │
│  [________________________]         │
│  [________________________]         │
│  [________________________]         │
│  [________________________]         │
│  Max 500 characters                 │
│                                      │
│           [Cancel] [Save]           │
└─────────────────────────────────────┘
```

---

### Add Expense Modal - Stage 2 (Success Confirmation)
```
┌─────────────────────────────────────┐
│ ✅ Expense Added Successfully!      │
├─────────────────────────────────────┤
│  Supermercado Día                   │
│  🍔 Alimentación                    │
│  $45.00                             │
│  📅 Jan 22, 2025, 3:45 PM           │
│                                      │
│  💰 Budget Impact:                  │
│  Before: $2,800                     │
│  After:  $2,755                     │
│  ─────────────────────────           │
│                                      │
│  📊 Budget Status:                  │
│  Remaining: $2,755 (98.4% left)     │
│  [████████████████████░░] 1.6%      │
│                                      │
│       [Add Another] [Close]         │
└─────────────────────────────────────┘
```

---

### Expense Detail Modal (Tap on expense)
```
┌─────────────────────────────────────┐
│  ✕                [Expense Details] │
├─────────────────────────────────────┤
│  Supermercado Día                   │
│  🍔 Alimentación                    │
│  $45.00                             │
│  📅 Jan 22, 2025, 3:45 PM           │
│                                      │
│  💬 Comments:                        │
│  "Compra mensual: leche, pan,       │
│   verduras, carne. Recibo guardado  │
│   en carpeta física."                │
│                                      │
│  💰 Budget Snapshot (at creation):  │
│  Before: $2,800                     │
│  After:  $2,755                     │
│  Impact: -$45.00                    │
│                                      │
│  ℹ️ This snapshot reflects budget   │
│     at time of creation             │
│                                      │
│  ⏰ Created: Jan 22, 3:45 PM        │
│  ✏️ Last Edited: Jan 23, 10:12 AM   │
│     (Changed from $40 to $45)       │
│                                      │
│       [Edit] [Delete] [Close]       │
└─────────────────────────────────────┘
```

---

### Save Period Confirmation Modal
```
┌─────────────────────────────────────┐
│         Close Current Period?       │
├─────────────────────────────────────┤
│  📊 Period Summary:                 │
│                                      │
│  📅 Started: Jan 20, 2025           │
│  📅 Duration: 32 days               │
│                                      │
│  💰 Budget:                         │
│    Total Added: $2,800              │
│    Income: $3,500                   │
│    Adjustments: -$500               │
│    Deductions: -$200                │
│                                      │
│  💸 Expenses:                       │
│    Total Spent: $1,904              │
│    (45 expenses)                    │
│                                      │
│  💵 Final Balance:                  │
│    Remaining: $896 (32%)            │
│                                      │
│  🏷️ Top Categories:                 │
│    🍔 Alimentación: $612 (32%)      │
│    🚗 Transporte: $483 (25%)        │
│    🏠 Vivienda: $380 (20%)          │
│                                      │
│  ℹ️ This period will be archived    │
│     and you'll start a fresh        │
│     period with zero budget.        │
│     This summary will be saved.     │
│                                      │
│     [Cancel] [Save & Close Period]  │
└─────────────────────────────────────┘
```

---

### Historical Period View (Read-Only)
```
┌─────────────────────────────────────┐
│  [☰] Family Budget    [⚙️ Settings] │
├─────────────────────────────────────┤
│  🔒 Jan 20 - Feb 20, 2025          │ ← Gray header
│  Closed on Feb 20, 2025 (32 days)  │
│  [◀ Prev]      [Current]      [Next▶]│
│                                      │
│  📊 Period Summary                  │
│  Budget: $2,800 | Spent: $1,904     │
│  Saved: $896 (32%)                  │
│  [View Full Summary]                │
├─────────────────────────────────────┤
│  🔍 Filter: [All ▼]                 │
├─────────────────────────────────────┤
│  Feb 20 - $87.25                    │
│  Feb 20  🍔 Alimentación    $45.00  │ ← Can view
│  Feb 20  ⛽ Transporte       $42.25  │ ← Cannot edit
│                                      │
│  Feb 19 - $122.00                   │
│  Feb 19  💊 Salud           $78.00  │
│  Feb 19  🍕 Alimentación    $44.00  │
│  ...                                 │
│                                      │
│  ⚠️ This is a closed period         │
│     You cannot add or edit expenses │
└─────────────────────────────────────┘
```

---

### Category Management Screen
```
┌─────────────────────────────────────┐
│  ← Manage Categories                │
│                                      │
│  [+ Add New Category]                │
│                                      │
│  Your Categories (12)                │
│  ├─────────────────────────────────┤
│  │ 🍔 Alimentación      (45 uses)  │ → Tap to edit
│  │ 🏠 Vivienda           (3 uses)  │
│  │ 📺 Streaming          (1 use)   │ ← Custom
│  │ 🚗 Transporte        (28 uses)  │
│  │ 💊 Salud             (0 uses)   │ ← Can delete
│  │ ...                              │
│  └─────────────────────────────────┘
│                                      │
│  Swipe left to delete                │
│  Tap to edit name, icon, or color   │
└─────────────────────────────────────┘
```
```
┌─────────────────────────────────────┐
│  Category Breakdown ▼                │
├─────────────────────────────────────┤
│  🍔 Alimentación    $892  (34%)     │
│  ━━━━━━━━━━━━━░░░░░░░░░░            │
│                                      │
│  🚗 Transporte      $645  (25%)     │
│  ━━━━━━━━━░░░░░░░░░░░░░░            │
│                                      │
│  🏠 Vivienda        $450  (17%)     │
│  ━━━━━━░░░░░░░░░░░░░░░░░            │
│  ...                                 │
│  [View All Categories]               │
└─────────────────────────────────────┘
```

---

## 🌐 SEO Optimization (Web Version)

### Meta Information
```html
<title>Family Budget Tracker | Manage Monthly Expenses</title>
<meta name="description" content="Track your family budget with custom pay periods. Manage expenses, categorize spending, and access history from any device.">
<meta name="keywords" content="budget tracker, expense manager, family budget, personal finance, monthly budget">
```

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- Semantic elements: `<nav>`, `<main>`, `<section>`, `<article>`
- ARIA labels for accessibility

### Performance
- Lazy load images/icons
- Minimize JavaScript bundle (code splitting)
- Use CDN for static assets
- Implement Service Worker for offline caching

### Accessibility
- Keyboard navigation support
- Screen reader compatible
- Color contrast ratio > 4.5:1
- Focus indicators on all interactive elements

---

## 📚 User Documentation Requirements

### In-App Help
- Onboarding tour (first-time users)
- Tooltips on key features
- Help icon linking to FAQ

### FAQ Topics
1. How do I set my budget period?
2. Can I add budget multiple times?
3. How do I view past months?
4. What happens if I go over budget?
5. How do I import my old data?

---

## ✅ Next Steps

After approval of this PRODUCT.md:
1. Create **RESEARCH.md** - Technical feasibility, backend architecture, database schema
2. Create **IMPLEMENTATION_GUIDE.md** - File structure, API endpoints, component breakdown
3. Begin development following THREE-DOC-APPROACH

---

**Document Status**: Draft v1.0  
**Feedback Needed From**:
- Fernando (Product Owner)
- Potential Users (Family members)
- UX/UI Review (Design validation)

**Change Log**:
- 2025-12-28: Initial draft based on existing Control-de-gastos app
