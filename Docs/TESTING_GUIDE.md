# 🧪 Testing Guide - Budget Tracker

**Version:** 1.0.0  
**Date:** December 29, 2025  
**Status:** Ready for Testing

---

## 🚀 Getting Started

### **Prerequisites:**
- Node.js installed
- Database seeded with test user
- Project running

### **Start the Application:**
```bash
cd C:\Users\Fernando\Documents\FerJuan\budget-tracker
npm run dev
```

**URL:** http://localhost:3000

---

## 🔐 Test 1: Authentication

### **1.1 Login with Demo User**

**Steps:**
1. Go to: http://localhost:3000
2. Click "Iniciar Sesión"
3. Enter credentials:
   ```
   Email: test@example.com
   Password: testpassword123
   ```
4. Click "Iniciar Sesión"

**Expected Result:**
- ✅ Redirects to /dashboard
- ✅ Shows welcome message with "test"
- ✅ Navbar shows user email
- ✅ "Cerrar Sesión" button visible

### **1.2 Register New User**

**Steps:**
1. Go to: http://localhost:3000
2. Click "Crear Cuenta"
3. Fill form:
   ```
   Nombre: Tu Nombre
   Email: tunombre@test.com
   Password: password123
   Confirmar: password123
   ```
4. Click "Crear Cuenta"

**Expected Result:**
- ✅ User created in database
- ✅ Auto-login
- ✅ 9 categories created
- ✅ 1 active period created
- ✅ Redirects to dashboard

### **1.3 Logout**

**Steps:**
1. Click "Cerrar Sesión" in navbar

**Expected Result:**
- ✅ Redirects to /auth/signin
- ✅ Session cleared
- ✅ Cannot access /dashboard without login

---

## 💰 Test 2: Budget Management

### **2.1 Add Income (First Budget)**

**Steps:**
1. Login to dashboard
2. You should see blue info box: "Define tu presupuesto"
3. Click "Agregar presupuesto"
4. Fill form:
   ```
   Tipo: Ingreso
   Monto: 50000
   Fuente/Concepto: Salario Mensual
   Comentarios: (empty - optional)
   ```
5. Click "Agregar al Presupuesto"

**Expected Result:**
- ✅ Form clears
- ✅ Budget Tracker appears with circular progress
- ✅ Shows: Presupuesto Total: $50,000.00
- ✅ Shows: Disponible: $50,000.00
- ✅ Shows: Gastado: $0.00
- ✅ Circular progress at 0%
- ✅ Status: "¡Excelente!"

### **2.2 Add Adjustment**

**Steps:**
1. Click "Agregar Presupuesto" button
2. Fill form:
   ```
   Tipo: Ajuste
   Monto: 5000
   Fuente/Concepto: Bono extra
   Comentarios: Bono por cumplimiento de metas
   ```
3. Click "Agregar al Presupuesto"

**Expected Result:**
- ✅ Presupuesto Total: $55,000.00
- ✅ Disponible: $55,000.00
- ✅ Circular progress still at 0%

**Note:** Comentarios is required for ADJUSTMENT and DEDUCTION

### **2.3 Add Deduction**

**Steps:**
1. Click "Agregar Presupuesto" button
2. Fill form:
   ```
   Tipo: Deducción
   Monto: 3000
   Fuente/Concepto: Descuento impuestos
   Comentarios: Retención mensual
   ```
3. Click "Agregar al Presupuesto"

**Expected Result:**
- ✅ Presupuesto Total: $52,000.00 (55000 - 3000)
- ✅ Disponible: $52,000.00
- ✅ All displays update instantly

---

## 📝 Test 3: Expense Management

### **3.1 Create First Expense**

**Steps:**
1. Click "Nuevo Gasto" (green button)
2. Modal opens with ExpenseForm
3. Fill form:
   ```
   Nombre del Gasto: Supermercado
   Monto: 8500
   Categoría: 🍔 Alimentación
   Fecha: (today's date)
   Comentarios: Compra semanal
   ```
4. Click "Agregar Gasto"

**Expected Result:**
- ✅ Modal closes
- ✅ Expense appears in list
- ✅ Shows category icon and color
- ✅ Budget updates:
  - Presupuesto Total: $52,000.00
  - Disponible: $43,500.00
  - Gastado: $8,500.00
- ✅ Circular progress updates (~16.3%)
- ✅ Expense card shows budget snapshot

### **3.2 Create Multiple Expenses**

**Create these expenses one by one:**

```
1. Transporte: $2,000 (🚗 Transporte)
2. Gasolina: $5,000 (🚗 Transporte)
3. Netflix: $1,500 (🎬 Entretenimiento)
4. Farmacia: $3,000 (💊 Salud)
5. Electricidad: $4,000 (💡 Servicios)
```

**Expected Result:**
- ✅ All expenses appear in list
- ✅ Budget updates after each one
- ✅ Total Gastado: $24,000.00
- ✅ Disponible: $28,000.00
- ✅ Circular progress: ~46%
- ✅ Status: "Vas bien" (green/yellow)

### **3.3 Edit Expense**

**Steps:**
1. Find "Supermercado" expense in list
2. Click "Editar" button
3. Modal opens with pre-filled data
4. Change amount: 10000 (was 8500)
5. Change category to "🏠 Vivienda"
6. Click "Actualizar Gasto"

**Expected Result:**
- ✅ Modal closes
- ✅ Expense updated in list
- ✅ New category icon shows
- ✅ Budget recalculates:
  - Gastado increases by $1,500
  - Total Gastado: $25,500.00
  - Disponible: $26,500.00

### **3.4 Delete Expense**

**Steps:**
1. Find "Netflix" expense
2. Click "Eliminar" button
3. Confirm dialog appears
4. Click "Aceptar"

**Expected Result:**
- ✅ Expense disappears from list
- ✅ Budget recalculates:
  - Gastado decreases by $1,500
  - Total Gastado: $24,000.00
  - Disponible: $28,000.00

### **3.5 Try Exceeding Budget**

**Steps:**
1. Click "Nuevo Gasto"
2. Fill form:
   ```
   Nombre: Compra grande
   Monto: 30000 (more than available $28,000)
   Categoría: Any
   ```
3. Click "Agregar Gasto"

**Expected Result:**
- ✅ Error message appears
- ✅ "El gasto ($30,000) supera el presupuesto disponible ($28,000)"
- ✅ Expense NOT created
- ✅ Budget unchanged

---

## 🔍 Test 4: Filtering

### **4.1 Filter by Category**

**Steps:**
1. In "Filtrar gastos por categoría" dropdown
2. Select "🚗 Transporte"

**Expected Result:**
- ✅ Shows only Transport expenses
- ✅ Header shows: "2 gastos en Transporte"
- ✅ Budget tracker unchanged (shows all)

### **4.2 Clear Filter**

**Steps:**
1. Select "Todas las categorías"

**Expected Result:**
- ✅ Shows all expenses again
- ✅ Count updates

---

## 📊 Test 5: Budget Status Indicators

### **5.1 Test Status Colors**

Create expenses to reach different thresholds:

**< 50% = Green "¡Excelente!"**
- Current: ~46% ✅ Should be green

**50-75% = Yellow "Vas bien"**
```
Add expense: $10,000
New total: $34,000 / $52,000 = 65%
```
**Expected:** ✅ Yellow color, "Vas bien"

**75-90% = Orange "Ten precaución"**
```
Add expense: $7,000
New total: $41,000 / $52,000 = 79%
```
**Expected:** ✅ Orange color, "Ten precaución"

**> 90% = Red "¡Cuidado! Casi agotado"**
```
Add expense: $6,000
New total: $47,000 / $52,000 = 90%
```
**Expected:** ✅ Red color, "¡Cuidado! Casi agotado"

**> 100% = Red "¡Presupuesto excedido!"**
```
Add expense: $6,000
New total: $53,000 / $52,000 = 102%
```
**Expected:** ✅ Red color, negative available, "¡Presupuesto excedido!"

---

## 🔒 Test 6: Period Management

### **6.1 Close Period**

**Setup:**
Have at least a few expenses and budget additions

**Steps:**
1. Scroll to Budget Tracker
2. Click "Cerrar Período" (red button)
3. Confirm dialog:
   ```
   "¿Estás seguro de que deseas cerrar este período?
   Se generará un resumen y no podrás agregar más gastos..."
   ```
4. Click "Aceptar"

**Expected Result:**
- ✅ Period closes
- ✅ Summary generated (JSON in database)
- ✅ Success message appears
- ✅ Dashboard should show new active period
- ✅ Budget resets to $0 (new period)

### **6.2 Verify Closed Period in Database**

**Steps:**
1. Open Prisma Studio: `npx prisma studio`
2. Go to "periods" table
3. Find the closed period

**Expected Data:**
```
status: "CLOSED"
endDate: (current date)
closedAt: (timestamp)
durationDays: (calculated)
summaryJson: (complete JSON summary)
```

**Summary should contain:**
- Budget breakdown (income, adjustments, deductions)
- Expense totals and averages
- Category breakdown
- Duration info
- Over/under budget result

---

## 🎨 Test 7: UI/UX Features

### **7.1 Dark Mode**

**Steps:**
1. Check if ThemeToggle exists in navbar
2. Toggle between light/dark

**Expected Result:**
- ✅ All colors invert properly
- ✅ Cards maintain readability
- ✅ Borders visible in both modes

### **7.2 Responsive Design**

**Steps:**
1. Resize browser to mobile size (375px)
2. Test all features

**Expected Result:**
- ✅ Dashboard stacks vertically
- ✅ Buttons full-width
- ✅ Modal fits screen
- ✅ Circular progress readable
- ✅ Expense cards stack nicely

### **7.3 Loading States**

**Steps:**
1. Refresh dashboard
2. Observe loading indicators

**Expected Result:**
- ✅ Skeleton loaders while fetching
- ✅ Spinner on buttons during submit
- ✅ Disabled state during loading
- ✅ No content flash

---

## ⚠️ Test 8: Edge Cases

### **8.1 Empty States**

**Test 1: No Budget**
- New user should see "Define tu presupuesto" box

**Test 2: No Expenses**
- Should show empty state: "No hay gastos registrados"

**Test 3: No Category Match**
- Filter by category with no expenses
- Should show: "No hay gastos en esta categoría"

### **8.2 Validation**

**Test Required Fields:**
```
BudgetForm:
- ✅ Empty amount → Error
- ✅ Negative amount → Error
- ✅ Empty source → Error
- ✅ ADJUSTMENT without comments → Error

ExpenseForm:
- ✅ Empty name → Error
- ✅ Empty amount → Error
- ✅ No category selected → Error
- ✅ Amount > available → Error
```

### **8.3 Concurrent Updates**

**Steps:**
1. Open dashboard in 2 tabs
2. Create expense in Tab 1
3. Check Tab 2

**Expected Result:**
- ✅ Tab 2 updates automatically (React Query refetch)

---

## 📈 Test 9: Data Persistence

### **9.1 Refresh Page**

**Steps:**
1. Create several expenses
2. Refresh page (F5)

**Expected Result:**
- ✅ All data persists
- ✅ Budget tracker shows correct values
- ✅ Expenses still visible

### **9.2 Logout/Login**

**Steps:**
1. Create data as user A
2. Logout
3. Login as user B
4. Check data

**Expected Result:**
- ✅ User B sees only their own data
- ✅ User B cannot see User A's data
- ✅ Login as User A again → data still there

---

## 🔐 Test 10: Security

### **10.1 API Protection**

**Steps:**
1. Logout
2. Try to access: http://localhost:3000/api/expenses?periodId=xxx

**Expected Result:**
- ✅ Returns 401 Unauthorized
- ✅ No data exposed

### **10.2 Route Protection**

**Steps:**
1. Logout
2. Try to access: http://localhost:3000/dashboard

**Expected Result:**
- ✅ Redirects to /auth/signin
- ✅ Cannot access dashboard

---

## ✅ Test Results Checklist

### **Authentication:** ___/3
- [ ] Login works
- [ ] Register works
- [ ] Logout works

### **Budget Management:** ___/3
- [ ] Add income works
- [ ] Add adjustment works
- [ ] Add deduction works

### **Expense Management:** ___/5
- [ ] Create expense works
- [ ] Edit expense works
- [ ] Delete expense works
- [ ] Budget validation works
- [ ] Expense appears in list

### **Filtering:** ___/2
- [ ] Filter by category works
- [ ] Clear filter works

### **Visual Indicators:** ___/5
- [ ] Circular progress updates
- [ ] Color coding works
- [ ] Status messages correct
- [ ] Budget displays accurate
- [ ] Snapshots visible

### **Period Management:** ___/2
- [ ] Close period works
- [ ] Summary generated

### **UI/UX:** ___/3
- [ ] Dark mode works
- [ ] Responsive design works
- [ ] Loading states show

### **Edge Cases:** ___/3
- [ ] Empty states show
- [ ] Validation works
- [ ] Errors handled

### **Persistence:** ___/2
- [ ] Refresh works
- [ ] Multi-user works

### **Security:** ___/2
- [ ] API protected
- [ ] Routes protected

---

## 🎯 Total Score: ___/30

### **Scoring:**
- **30/30:** ✅ Perfect! Ready for production
- **25-29:** ✅ Excellent! Minor tweaks needed
- **20-24:** ⚠️ Good! Some issues to fix
- **< 20:** ❌ Major issues found

---

## 🐛 Bug Report Template

If you find any issues, report them like this:

```markdown
**Bug Title:** Short description

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshot/Error:**
(if applicable)

**Environment:**
- Browser: Chrome/Firefox/Safari
- OS: Windows/Mac/Linux
- Screen size: Desktop/Mobile
```

---

## 📞 Support

If you encounter any issues during testing:

1. Check browser console for errors (F12)
2. Check server logs in terminal
3. Verify database with `npx prisma studio`
4. Review API responses in Network tab

---

**Happy Testing!** 🚀
