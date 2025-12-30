# Database Scripts

## 📂 Available Scripts

### 🔄 reset-database.bat (RECOMENDADO AHORA)

**Uso:** Primera vez o cuando querés empezar de cero

```bash
.\scripts\reset-database.bat
```

**Qué hace:**
1. Instala bcryptjs (si falta)
2. Borra carpeta `prisma/migrations` (limpia todo)
3. Genera Prisma Client nuevo
4. Crea migración inicial contra Supabase
5. Ejecuta seed (usuario test + categorías + período)
6. Verifica estado

**Cuándo usarlo:**
- ✅ Primera vez configurando la DB
- ✅ Cambió el schema y querés empezar de cero
- ✅ Tenés problemas con migraciones anteriores
- ⚠️ **CUIDADO:** Borra TODOS los datos

---

### 🔧 migrate.bat

**Uso:** Cuando tenés data y solo querés actualizar el schema

```bash
.\scripts\migrate.bat
```

**Qué hace:**
1. Instala/verifica bcryptjs
2. Genera Prisma Client
3. Crea migración incremental (mantiene data existente)
4. Verifica estado

**Cuándo usarlo:**
- ✅ Ya tenés data en la DB
- ✅ Solo agregaste/modificaste columnas
- ✅ Querés mantener los datos existentes

---

### 📦 install-deps.bat

**Uso:** Solo instalar dependencias

```bash
.\scripts\install-deps.bat
```

**Qué hace:**
- Instala bcryptjs

**Cuándo usarlo:**
- ✅ Solo necesitás instalar bcryptjs
- ✅ Antes de ejecutar el seed manualmente

---

## 🚀 Primera Vez - Pasos Recomendados

### Paso 1: Reset completo de DB

```bash
# Ejecutá esto desde la raíz del proyecto
.\scripts\reset-database.bat
```

### Paso 2: Verificá en Supabase

1. Ve a https://supabase.com/dashboard
2. Abrí tu proyecto "Budget Tracker"
3. Click en "Table Editor"
4. Deberías ver **5 tablas**:
   - ✅ users (1 registro: test@example.com)
   - ✅ categories (9 registros: Alimentación, Vivienda, etc.)
   - ✅ periods (1 registro: ACTIVE period)
   - ✅ budget_additions (vacía)
   - ✅ expenses (vacía)

### Paso 3: Probá Prisma Studio

```bash
npx prisma studio
```

Deberías ver las mismas tablas y data en http://localhost:5555

---

## ❓ Troubleshooting

### Error: "Can't reach database server"

**Solución:**
1. Verificá que `.env` tenga `DATABASE_URL` y `DIRECT_URL`
2. Verificá que Supabase no esté pausado
3. Verificá tu internet

### Error: "bcryptjs not found"

**Solución:**
```bash
npm install bcryptjs
```

### Error: "Migration failed"

**Solución:**
1. Ejecutá `reset-database.bat` para empezar de cero
2. Si persiste, verificá los logs de Supabase

### Las tablas están en Prisma Studio pero NO en Supabase

**Problema:** Prisma Studio muestra el schema, no la data real

**Solución:**
1. Ejecutá `reset-database.bat`
2. Verificá en Supabase Table Editor (no en Prisma Studio)

---

## 🎯 Schema Actual

Este proyecto usa el schema del IMPLEMENTATION_GUIDE:

- **User** - Usuarios del sistema
- **Period** - Períodos presupuestarios (continuo hasta cerrar)
- **BudgetAddition** - Adiciones al presupuesto (Income/Adjustment/Deduction)
- **Expense** - Gastos con snapshots inmutables
- **Category** - Categorías de gastos

---

## 📝 Test User

Después del seed, podés loguearte con:

```
Email: test@example.com
Password: testpassword123
```

---

## 🔗 Links Útiles

- Supabase Dashboard: https://supabase.com/dashboard
- Prisma Docs: https://www.prisma.io/docs
- IMPLEMENTATION_GUIDE.md: ../Docs/IMPLEMENTATION_GUIDE.md
