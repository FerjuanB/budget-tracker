# Variant: Home Redesign v2

## Design stance
Iteración sobre `003-home-redesign` ajustando: pill de cerrar período visible, contador de días sutil, y botón de agregar ingreso como pill `+` dentro del row de filtros.

## Cambios clave respecto a v1

### 1. Pills de status (doble badge en fila)
- **`Vas bien · 39% usado`** → se mantiene como pill verde (success)
- **`Cerrar período`** → pill rojo (danger) al lado, con icono de archive a la izquierda
- Ambos son clickeables, con tap feedback (`scale 0.94`)
- Mismo formato visual, colores distintos según propósito: informativo vs. acción destructiva

### 2. Day counter (contador sutil)
- Texto "Día 18 de 32" debajo de los pills en color label-tertiary (muy sutil)
- Font Cabinet Grotesk, 11px, tabular-nums
- No compite con el balance pero queda visible

### 3. Pill `+` dentro de filtros
- Botón circular azul (40x40) al final del row de filtros
- Icono de + centrado (sin texto para no romper el ritmo de las pills)
- Sombra azul sutil para diferenciarse de las pills de categorías
- Abre el modal de budget addition (tu actual BudgetForm legacy)

### 4. Avatar menu refinado (reemplaza el header con logout)
Menú popover al tappear "FJ" (arriba derecha) con:
- Perfil
- Configuración
- ──── separator
- **Cerrar período** (rojo, duplicado del pill visible — redundancia intencional: si el usuario no ve el badge en scroll largo, lo tiene acá también)
- Cerrar sesión

### 5. Dialog de confirmación para cerrar período
- Modal central, backdrop blur
- Título claro: "¿Cerrar el período?"
- Descripción contextual: menciona el día actual y qué pasa con los datos
- Botones: Cancelar (gris) / Cerrar (rojo)
- Animación scale + spring

## Trade-offs

### Strong at
- "Cerrar período" accesible desde dos lugares (pill visible + menu)
- Agregar ingreso mezclado con filtros = muy accesible al estar siempre visible
- Day counter sutil: información sin competir con el balance
- Redundancia inteligente: acciones importantes tienen 2 entry points

### Weak at
- Pill rojo "Cerrar período" puede alarmar si el usuario lo ve como "error" en vez de "acción"
- Pill `+` azul en row de pills puede confundirse con filtro si el usuario no nota el círculo
- "Cerrar período" aparece DOS VECES — podría considerarse ruido, pero es intencional por seguridad

## Decisión de diseño: ¿pill `+` o CTA separado?

El user pidió explícitamente que "Agregar ingreso" esté dentro de la fila de pills como un botón `+`. Lo implementé así porque:
1. El usuario lo pidió
2. Es coherente con el flujo visual (las acciones de "agregar" siguen el patrón de pills)
3. Aprovecha una zona de la UI que ya es scrolleable → no necesita espacio nuevo

Alternativas descartadas (menciono por si en otra iteración queremos reconsiderar):
- CTA grande separado → ocupa más espacio valioso en mobile
- Icono dentro del header → lejos del thumb zone
- En avatar menu → menos descubierto

## Screens pendientes de sketch
- **Modal de agregar ingreso** (reutilizar BudgetForm legacy con nuevo diseño)
- **Tab Historial** (lista de períodos cerrados)
- **Tab Categorías** (gestión CRUD)
- **Expense detail sheet** al tappear una fila
- **Expense edit/delete slide actions** (implementación real del swipe iOS)

## Implementación notes
- **Pills de status:** component `StatusRow` — recibe percentage y dayCount como props
- **Pill `+`:** parte del `FilterPills` component existente, añadido al final con prop `onAddIncome`
- **Avatar menu:** nuevo component `AvatarMenu` con popover + click-outside
- **Dialog:** component reutilizable `ConfirmDialog` (lo vamos a usar para otras acciones destructivas también)
- **Day counter:** texto simple, no necesita component
- **Bottom nav:** client-side tabs con state (Opción A), no Next.js routing todavía

## Recomendación al user
Antes de implementar:
- Probar el mockup en mobile real (no desktop browser) para validar tamaños
- Decidir si "Cerrar período" aparece SIEMPRE o solo cuando el período tiene > 7 días y al menos 1 gasto (evitar cerrar períodos vacíos por error)
- Decidir si el dialog de cerrar período muestra el resumen (monto total, gastos, top categoría) para que el usuario confirme con información
