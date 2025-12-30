# 🚀 Database Setup - Supabase Free Tier

## ⚠️ IMPORTANTE: Shadow Database Error

Si viste este error:
```
ERROR: database "prisma_migrate_shadow_db_..." is being accessed by other users
```

**Esto es NORMAL con Supabase Free Tier.** Supabase no permite crear bases de datos temporales (shadow databases) que Prisma necesita para `migrate dev`.

## ✅ Solución: Usar `db push`

Para Supabase Free Tier, usamos `prisma db push` en lugar de `prisma migrate dev`.

### Diferencias:

| Aspecto | `migrate dev` | `db push` |
|---------|---------------|-----------|
| Shadow DB | ✅ Requiere | ❌ No requiere |
| Archivos migración | ✅ Crea archivos SQL | ❌ No crea archivos |
| Supabase Free | ❌ No funciona | ✅ Funciona |
| Producción | ✅ Recomendado | ❌ Solo dev |
| Historial | ✅ Trackeable | ❌ No trackeable |

**Para este proyecto:** Usamos `db push` porque:
1. ✅ Funciona con Supabase Free Tier
2. ✅ Es más simple para desarrollo
3. ✅ No necesitamos historial de migraciones en MVP
4. ❌ Solo es un proyecto personal (no producción)

---

## 🚀 Setup Rápido

### Paso 1: Cerrar Prisma Studio (si está abierto)

Si tenés Prisma Studio corriendo (`npx prisma studio`), **cerralo** porque mantiene conexiones activas.

### Paso 2: Ejecutar setup

```powershell
cd C:\Users\Fernando\Documents\FerJuan\budget-tracker
.\setup-db.bat
```

### Paso 3: Verificar en Supabase

1. Ve a: https://supabase.com/dashboard
2. Proyecto "Budget Tracker"
3. Table Editor
4. Deberías ver **5 tablas**

---

## 🔧 Troubleshooting

### Error persiste después de cerrar Prisma Studio

**Solución 1: Esperar unos segundos**
```powershell
# Esperá 10 segundos
timeout /t 10

# Intentá de nuevo
.\setup-db.bat
```

**Solución 2: Verificar conexiones en Supabase**
1. Ve a Supabase Dashboard
2. Project Settings → Database → Connection Pooling
3. Si hay conexiones activas, esperá que terminen

**Solución 3: Usar script interactivo**
```powershell
# Este script tiene una pausa para cerrar conexiones
.\setup-db-interactive.bat
```

### Error: "Can't reach database server"

**Verificá `.env`:**
```env
# Debe tener AMBAS URLs
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

**IMPORTANTE:** 
- `DATABASE_URL` → Puerto 6543 (pooler)
- `DIRECT_URL` → Puerto 5432 (direct)

### Error en el seed: "bcryptjs not found"

```powershell
npm install bcryptjs
npm run seed
```

---

## 📝 Comandos Útiles

```powershell
# Ver estructura de la DB
npx prisma studio

# Sincronizar schema (si cambiás schema.prisma)
npx prisma db push

# Re-ejecutar seed
npm run seed

# Verificar conexión
npx prisma db pull
```

---

## 🎯 Después del Setup Exitoso

1. ✅ Verificá en Supabase Table Editor (5 tablas)
2. ✅ Probá Prisma Studio (`npx prisma studio`)
3. ✅ Verificá que tenés:
   - 1 usuario (test@example.com)
   - 9 categorías
   - 1 período activo

4. ➡️ Continuá con **Phase 2** del IMPLEMENTATION_GUIDE.md

---

## ⚙️ Para Producción (Futuro)

Si en el futuro querés migrar a Supabase Pro o un PostgreSQL propio:

1. Cambiar a `migrate dev` (tendrá shadow DB)
2. Crear historial de migraciones
3. Deploy con `migrate deploy`

Por ahora, `db push` es perfecto para desarrollo. 👍

---

## 🆘 Ayuda

Si seguís teniendo problemas:
1. Verificá que Supabase no esté pausado
2. Cerrá todas las conexiones (Prisma Studio, DBeaver, etc.)
3. Esperá 1 minuto y reintentá
4. Verificá tu `.env` tiene URLs correctas

**Estado Actual:** ✅ Script actualizado para Supabase Free Tier
