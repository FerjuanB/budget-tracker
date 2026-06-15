# 🚀 Plan de Features 2.5 — Quick Add, OCR, Recurrentes

**Fecha:** 15 Junio 2026
**Autor:** Fernando + Hermes
**Estado:** Pendiente aprobación
**Base:** Budget Tracker v1 (MVP @85%) + Next.js 14 + Prisma + Supabase

---

## 📋 Resumen Ejecutivo

Implementar 3 features que reducen la fricción diaria de cargar gastos, en orden:

1. **FAB + Action Sheet + Quick Add** — Agregar gasto en 3 segundos/2 taps
2. **OCR por foto de ticket** — Gemini/OpenRouter detecta total, comercio, categoría
3. **Gastos recurrentes** — Con soporte bimensual (Edenor), cuotas, monto variable

**Al final**: refresh global de UI para dejar atrás el look "AI scaffold".

**Principio rector**: cada línea de CSS que agreguemos ahora usa tokens/variables, no colores hardcodeados, para que el refactor visual después sea cambiar un archivo.

---

## 🎯 Filosofía de Diseño para Features Nuevas

Las features nuevas siguen el **mockup 002-action-sheet** (la variante que elegiste). Convenciones:

- **Bottom sheets** (no modales centrados) para toda acción de carga. Mejor en mobile.
- **FAB fijo bottom-right** (w-16 h-16) siempre visible en `/dashboard`.
- **Transiciones de sheet → sheet** en lugar de múltiples modales anidados.
- **Categorías con grid 4-columnas** (emoji + nombre) en quick-add, no dropdown.
- **OCR siempre confirma antes de guardar**, nunca guarda solo.

---

## 🗂 Fases de Ejecución

### **FASE A: Schema + Infra (preparación) — ~2h**

**Objetivo:** Agregar modelos para OCR y Recurrentes. No toca UI todavía.

**Cambios a `prisma/schema.prisma`:**

```prisma
// ─── NUEVO: Recurrentes ────────────────────────────────────
model RecurringExpense {
  id              String             @id @default(cuid())
  userId          String
  categoryId      String
  name            String             // "Netflix", "Edenor", "Visa"
  icon            String?            // emoji o identifier
  baseAmount      Decimal            @db.Decimal(10, 2) // monto default
  isVariable      Boolean            @default(false)    // true = pedir monto cada vez
  
  // Frecuencia
  frequency       RecurrenceFrequency @default(MONTHLY)
  dayOfMonth      Int?               // 1-28 (capado para evitar feb 30)
  everyNMonths    Int                @default(1)        // 1=mes, 2=bimensual, 3=trimestral
  
  // Solo para servicios con cuotas (Edenor bimensual 2 cuotas)
  splitInto       Int                @default(1)        // 1 = normal, 2 = 2 cuotas/mes
  
  // Control
  isActive        Boolean            @default(true)
  startDate       DateTime
  endDate         DateTime?
  lastGeneratedAt DateTime?          // cuándo se generó la última instancia
  
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  category        Category           @relation(fields: [categoryId], references: [id])
  instances       RecurringInstance[]
  
  @@index([userId, isActive, frequency, dayOfMonth])
  @@map("recurring_expenses")
}

model RecurringInstance {
  id              String             @id @default(cuid())
  recurringId     String
  expenseId       String?            // NULL = pending, filled = already created
  
  // Datos snapshot en el momento de generar (pueden diferir del template si se editó)
  amount          Decimal            @db.Decimal(10, 2)
  dueDate         DateTime           // fecha en que debería auto-agregarse
  installmentNum  Int                @default(1) // cuota 1 de N
  installmentTotal Int               @default(1) // N total
  
  status          RecurringStatus    @default(PENDING)
  appliedAt       DateTime?
  skippedAt       DateTime?
  notes           String?
  
  createdAt       DateTime           @default(now())
  
  recurring       RecurringExpense   @relation(fields: [recurringId], references: [id], onDelete: Cascade)
  expense         Expense?           @relation(fields: [expenseId], references: [id])
  
  @@unique([recurringId, dueDate, installmentNum])
  @@index([status, dueDate])
  @@map("recurring_instances")
}

enum RecurrenceFrequency {
  MONTHLY
  BIMONTHLY  // cada 2 meses (pero genera 2 cuotas en cada mes de emisión)
  QUARTERLY
}

enum RecurringStatus {
  PENDING
  APPLIED
  SKIPPED
  EDITED   // el usuario cambió el monto manualmente
}

// ─── NUEVO: Log de OCR ─────────────────────────────────────
model OcrScan {
  id           String   @id @default(cuid())
  userId       String
  imageUrl     String   // Supabase Storage path
  rawResponse  Json     // salida cruda de Gemini/OpenRouter
  parsed       Json     // {amount, merchant, category_hint, date}
  expenseId    String?  // si se confirmó y creó expense
  createdAt    DateTime @default(now())
  
  @@index([userId, createdAt])
  @@map("ocr_scans")
}

// ─── EXTENSIÓN a modelos existentes ────────────────────────
// User: agregar relations
// Category: agregar relation a RecurringExpense
// Expense: agregar relation optional a RecurringInstance + campo sourceType

enum ExpenseSource {
  MANUAL         // creado por usuario directamente
  QUICK_ADD      // creado desde FAB quick add
  OCR            // creado desde foto (puede requerir confirmación)
  RECURRING_AUTO // generado automáticamente
  RECURRING_ED   // recurrente con monto editado manualmente
}

// agregar a Expense model:
//   source        ExpenseSource @default(MANUAL)
//   recurringInstanceId String?
//   recurringInstance  RecurringInstance? @relation(...)
```

**Cambios adicionales:**
- Instalar `@google/generative-ai` o usar fetch a OpenRouter para OCR
- Configurar Supabase Storage para subir tickets (bucket `receipts`)
- Agregar variable de entorno `GEMINI_API_KEY` o usar `AI_GATEWAY_API_KEY` que ya tenés

**Output:** `prisma migrate dev` exitoso.

---

### **FASE B: FAB + Action Sheet + Quick Add — ~4-5h**

**Objetivo:** El entry point principal de la app es ahora el FAB. Reemplaza los botones "Nuevo Gasto" y "Agregar Presupuesto" grandes del dashboard.

**Archivos a crear:**

```
src/components/fab/
├── FloatingAddButton.tsx      // FAB con ícono +
├── ActionSheet.tsx            // bottom-sheet con 3 options
├── QuickAddSheet.tsx          // el form rápido (monto + categoría)
└── shared/
    ├── BottomSheet.tsx         // wrapper reutilizable (drag-to-close, overlay)
    └── useSheetStack.ts        // hook para navegar: actions → quick → cerrar
```

**Archivos a modificar:**
- `src/app/dashboard/page.tsx` — agregar `<FloatingAddButton />` al final del layout
- `src/app/dashboard/layout.tsx` — agregar padding-bottom al contenedor (pb-24) para que el FAB no tape contenido

**Quick Add sheet — especificación técnica:**

```tsx
// Campos mínimos para 3 segundos
- Monto (input type="number", autofocus, grande)
- Categoría (grid 2 filas × 4 cols del top 8 más usadas por este user)
- Nombre (opcional, oculto por defecto, expandible con "Añadir descripción")
- Fecha (hidden, default = hoy)

// On submit:
POST /api/expenses con source: 'QUICK_ADD'
→ invalidate queries de expenses y period actual
→ toast de éxito con botón "Deshacer" (5 segundos)
→ volver al dashboard
```

**Smart category ordering:**
- Query: `top 8 categorías por count de expenses de los últimos 60 días`
- Fallback: 9 categorías default si el user es nuevo

**Output:** FAB funcional en dashboard, quick-add agrega expenses con source correcto.

---

### **FASE C: Gastos Recurrentes — ~5-6h**

**Objetivo:** Sistema completo de recurrentes con los 3 casos de uso argentinos:

1. **Monto fijo mensual** — Netflix, Spotify (sin intervención del user)
2. **Bimensual con cuotas** — Edenor/Edesur (2 cuotas de igual monto, cada 2 meses)
3. **Monto variable** — Visa, Mastercard (el user elige monto cada mes)

**Archivos a crear:**

```
src/components/recurring/
├── RecurringSheet.tsx         // lista + botón "+ Nuevo"
├── RecurringForm.tsx          // crear/editar recurrente
├── RecurringCard.tsx          // card individual en lista
└── RecurringPendingList.tsx   // muestra las instancias PENDING del mes

src/app/api/recurring/
├── route.ts                   // GET list, POST create
├── [id]/route.ts              // GET/PUT/DELETE
├── pending/route.ts           // GET instancias pending del mes actual
├── [id]/apply/route.ts        // POST: marca como aplicada, crea Expense
└── [id]/skip/route.ts         // POST: marca como skipped

src/lib/cron/
└── recurring-generator.ts     // Vercel Cron (1x día), instancia PENDINGs del mes
```

**Endpoint cron (Vercel Cron Jobs):**
```typescript
// /api/cron/generate-recurring-instances
// Se llama automaticamente via Vercel Cron config en vercel.json
// Cada día a las 00:05, genera instancias PENDING para recurrentes cuyo día de mes ≤ hoy
// y no tienen instancia aún para este mes.
```

**UI Flow — recurrentes en action sheet:**
1. FAB → "Gasto recurrente" → muestra lista de recurrentes + button "+ Nuevo"
2. Cada recurrente muestra:
   - Nombre, categoría, icono
   - Badge de tipo (Mensual fijo / Bimensual 2 cuotas / Variable)
   - Próxima fecha o estado "Editá el monto del mes"
3. Tap en recurrente → abre form para editar SOLO ese mes (amount override)
4. Botón "Ver template" → edita el recurrente base

**Lógica bimensual (Edenor):**
```
frequency: BIMONTHLY (every 2 months)
splitInto: 2 (genera 2 cuotas en cada mes activo)

Ejemplo Edenor, día 5, $32.500 x 2:
- Enero (activo): instancias día 5 cuota 1/2 y día 20 cuota 2/2
- Febrero (inactivo): nada
- Marzo (activo): se repite
```

**Output:** Usuario puede configurar Netflix ($7.999 mes fijo día 8), Edenor (bimensual 2 cuotas), Visa (variable). Las auto-aplicadas no requieren acción, las variables muestran prompt.

---

### **FASE D: OCR por Ticket — ~4-5h**

**Objetivo:** Usar Gemini 2.0 Flash vía OpenRouter para extraer datos de tickets argentinos.

**Stack seleccionado:**
- **Proveedor:** OpenRouter (ya tenés key, termina en `f5a816b`)
- **Modelo:** `google/gemini-2.0-flash-001` (excellent OCR, barata)
- **Storage:** Supabase Storage bucket `receipts` para persistir imagen

**Archivos a crear:**

```
src/components/ocr/
├── OcrSheet.tsx               // flujo: upload → processing → preview → confirm
├── TicketUploader.tsx         // input file + preview
└── OcrPreview.tsx             // pre-fill form con datos detectados

src/app/api/ocr/
├── upload/route.ts            // POST: sube imagen a Storage, llama a Gemini
└── confirm/route.ts           // POST: crea Expense desde OCR con source: 'OCR'

src/lib/ocr/
├── gemini-client.ts           // wrapper de OpenRouter con prompt system
└── parsers.ts                 // normaliza respuesta Gemini a nuestro schema
```

**Prompt system para Gemini:**
```
Analizá este ticket de compra argentino. Extraé:
- total: número con decimales (usar coma como decimal si está en formato argentino)
- merchant: nombre del comercio
- date: fecha en formato ISO 8601
- category_hint: una de [alimentación, transporte, salud, vestimenta, hogar, entretenimiento, servicios, otros]
- items: (opcional) array de items si se ven claramente

Respondé SOLO en JSON válido, sin markdown fences.
```

**UI Flow:**
1. FAB → "Foto del ticket"
2. Usuario: tomar foto o seleccionar de galería
3. Upload + preview chica del ticket arriba
4. Barra "Procesando con IA..." con spinner
5. Cuando Gemini responde: pre-llenar campos (monto, comercio, categoría, fecha)
6. Usuario: confirmar o editar campos
7. Botón "Confirmar" → crea Expense con source: 'OCR' y guarda OcrScan

**Fallback si OpenRouter falla:**
- Mostrar mensaje: "No pudimos leer el ticket. Cargalo manual:" y abrir QuickAddSheet con imagen adjunta.

**Rate limit / costos:**
- Gemini Flash 001 en OpenRouter: ~$0.10 / 1M input tokens
- Un ticket típico: ~2-3k tokens → ~$0.0003 por scan
- Familia de 4 personas, 50 tickets/mes = ~$0.015/mes (free tier amplio)

**Output:** Usuario saca foto a ticket, 4 segundos después tiene expense pre-cargado para confirmar.

---

### **FASE E: Integración + Testing — ~2h**

- Integrar las 3 features en el action sheet final
- End-to-end manual testing (30 casos del TESTING_GUIDE + casos nuevos)
- Seed data con 3 recurrentes de ejemplo (Netflix, Edenor, Visa)
- Smoke test OCR con 5 tickets reales del user (solicitados)

---

## 💅 Visión Estética Global (para ejecutar al final)

**Diagnóstico del look actual (qué lo delata como "AI created"):**
- `bg-white dark:bg-gray-800` + `rounded-lg` + `shadow-sm` + `border-gray-200` en TODO
- SVG inline de Heroicons sin consistencia
- Paleta Tailwind default (emerald-500, blue-600, yellow-50)
- Inter font sin personalidad
- Dark mode que es solo invertir blanco/gris sin criterio

**Direcciones estéticas candidatas (a elegir antes del refactor):**

### **Opción 1: Warm Minimalist** (recomendada para app familiar)
Inspirada en Notion + Bear + Monarch Money.

- **Fondo:** `#FAFAF7` (crema/off-white), no `#F5F5F5` frío
- **Cards:** `#FFFFFF` con border muy sutil `#EDE8E0` (beige), sin sombra excepto en hover
- **Tipografía:** `Instrument Serif` para headings (personalidad) + `Inter` para body
- **Acentos:** `#8B6F47` (bronze) en lugar de indigo/blue genéricos
- **Iconos:** Phosphor Icons en peso `duotone` consistente
- **Dark mode:** `#1C1917` (stone-900) no gray, acentos más suaves

### **Opción 2: iOS Native Feel**
Inspirada en Apple Reminders + Fantastical.

- **Fondo:** system default con blur y translucencias
- **Tipografía:** SF Pro (o `Inter` closest match)
- **Bottom sheets reales** con `backdrop-blur` y drag handle
- **Iconos:** SF Symbols via `lucide` con pesos finos
- **Animaciones:** spring physics (framer-motion)
- **Color:** accent dinámico por categoría, no uno global

### **Opción 3: Editorial/Monetary**
Inspirada en Revolut + Nubank (estilo fintech moderno).

- **Tipografía:** `DM Sans` (geométrica, moderna) grande en montos
- **Paleta:** monochromatic con un único acento fuerte (verde menta `#00D4AA` o indigo)
- **Montos:** display XL con `$` chico al lado, números como protagonistas
- **Iconos:** line icons minimal (Lucide thin)
- **Layout:** más airy, más whitespace intencional

**Principios que aplicamos durante el build de features (para no tener que rehacer):**

1. **Tokens, no colores hardcodeados** — Toda nueva clase de color va en `globals.css` como variables CSS (`--color-surface`, `--color-accent`, etc).
2. **No emoji como iconos** — Usar librería consistente (Phosphor o Lucide) desde ahora.
3. **Números grandes** — Los montos usan `font-variant-numeric: tabular-nums` desde ahora.
4. **Mobile-first siempre** — Cada nuevo component se diseña a 375px primero.
5. **Sin "rounded-lg" por defecto** — Cada border-radius pensado por tipo.

**Plan de refactor al final (post features):**
1. Definir sistema de design tokens en `tailwind.config.js`
2. Migrar todos los componentes legacy a tokens
3. Introducir tipografía con personalidad (Instrument Serif o DM Sans)
4. Pulir dark mode con paleta intencional
5. Refinar micro-interacciones (hover, tap, transitions)

---

## ⏱ Tiempo total estimado

| Fase | Tiempo | Acumulado |
|------|--------|-----------|
| A — Schema + Infra | 2h | 2h |
| B — FAB + Quick Add | 5h | 7h |
| C — Recurrentes | 6h | 13h |
| D — OCR | 5h | 18h |
| E — Integración | 2h | 20h |

**Sesiones sugeridas:** 3 sesiones de ~6h cada una.
- Sesión 1: A + B (FAB + quick add funcional)
- Sesión 2: C (recurrentes completo con Edenor case)
- Sesión 3: D + E (OCR + testing)

Luego una sesión aparte de 4-6h para el refresh visual cuando quieras.

---

## ✅ Checklist de Aprobación

- [ ] Aprobar variante 2 (Action Sheet) del FAB ← ya aprobado
- [ ] Aprobar dirección estética preferida (opción 1, 2 o 3) para guiar el build
- [ ] Aprobar scope de recurrentes (Edenor bimensual + variable Visa + fijos)
- [ ] Aprobar usar OpenRouter + Gemini Flash 001 para OCR (vs. Gemini directo o GPT-4o-mini)
- [ ] Aprobar plan de ejecución en 3 sesiones

---

## 🚩 Riesgos y mitigaciones

**1. Vercel Cron tiene límites en free tier (1x día).**
→ Suficiente para generar instancias de recurrentes. No necesitamos más frecuencia.

**2. Gemini puede fallar con tickets muy dañados.**
→ Fallback automático a Quick Add con la imagen adjunta.

**3. Supabase Storage no está configurado.**
→ Se configura junto con Fase A (5 min).

**4. Bimensual con cuotas es edge case.**
→ Lo testeamos con datos reales de Edenor que vos proveas.

**5. Refactor visual puede tocar mucho código legacy.**
→ Usar tokens desde ahora minimiza el impacto. El refactor será mayormente CSS.

---

## 📚 Referencias de UI

- [Monarch Money mobile](https://www.monarchmoney.com) — clean, family-friendly
- [Copilot Money](https://www.copilot.money) — quick-add UX
- [Revolut](https://revolut.com) — typography-forward monetary display
- [Notion](https://www.notion.so) — warm minimalism
- [YNAB mobile](https://www.youneedabudget.com) — zero-based budgeting UX
