# Variant: Home Redesign (mobile-first)

## Design stance
Transformar el dashboard "AI scaffold" actual en un home iOS-nativo donde el balance sea el protagonista absoluto y la navegación siga las convenciones mobile modernas. Prioriza thumb-zone, feedback inmediato, y coherencia con los sheets del FAB.

## Key choices

### Layout
- Header mínimo (logo + avatar menu en lugar de barra pesada con logout)
- Hero section con balance gigante (52px Cabinet Grotesk 700)
- Segmented progress bar (16 segmentos, color cambia: verde → amarillo → rojo)
- 2 stat cards rápidas (Hoy / Promedio diario) con deltas
- Filtros como pills horizontales scrolleables (SIN emojis, solo texto + count)
- Lista de gastos cards simples con SVG icons coloreados (no emojis)
- Bottom navigation iOS-style con 3 tabs (Inicio / Historial / Categorías)
- FAB flotando sobre bottom nav (tap-safe, no conflict)

### Typography
- Cabinet Grotesk 800/700 para montos + headings
- Inter 500/600 para body
- Balance: 52px con tabular-nums
- Stat cards: 20px
- Expense amounts: 15px

### Color
- iOS blue (#007aff) como acento principal
- Success (#34c759) para balance healthy
- Warning (#ff9500) para precaución
- Destructive (#ff3b30) para delete + over-budget
- Surface: blanco/gris iOS nativo
- Bottom nav: translucent blur (iOS tab bar)

### Interaction
- Pills con tap + active state inverso (fondo oscuro cuando activos)
- Expense rows con swipe (simulado como long-press/right-click en mockup)
- Avatar menu reemplaza el botón de logout siempre visible
- Toast de "Deshacer" en lugar de confirmar delete
- FAB tap feedback (scale 0.94)
- Bottom nav tap feedback (scale 0.92)

## Trade-offs

### Strong at
- El balance es imposible de ignorar (52px)
- Thumb-zone perfecta: acciones principales abajo
- Coherencia visual con FAB sheets iOS ya implementados
- Filtros sin emojis (user request): texto limpio, escaneable
- Bottom nav libera espacio en el header
- Segmented bar comunica status sin necesidad de leer números

### Weak at
- Perder el PeriodSelector visible (se mueve al avatar menu o historial)
- Bottom nav añade complejidad de routing (3 pantallas en lugar de 1)
- Avatar menu esconde logout (1 tap extra para salir)
- Sin emojis en categorías se pierde reconocimiento instantáneo para algunos users

## Best for
- App mobile daily-driver donde el balance y los gastos se consultan 10-20x al día
- Usuarios familiares (no tech) que valoran simplicidad sobre densidad
- Ecosistema de features iOS-style (ya tenemos FAB y sheets con ese feel)

## Not for
- Power users que quieren todo visible sin tabs
- Quien usa casi todo en desktop (el bottom nav no aplica bien ahí)

## Screens left to sketch
- **Historial tab**: períodos cerrados con cards resumen + tap para drill-down
- **Categorías tab**: gestión con drag-to-reorder + crear/editar/delete
- **Expense detail sheet** al tappear una fila
- **Avatar menu**: popover con Perfil, Config, Cerrar sesión

## Implementation notes
- Los tokens CSS ya están en `globals.css` — no hay que reinventar nada
- Bottom nav requiere routing de Next.js (actualmente todo es `/dashboard`)
  - Opción A: tabs client-side sin routing (componente con states)
  - Opción B: routes reales `/dashboard/history`, `/dashboard/categories`
  - Recomendado: A para Fase 1, B en Fase 2 cuando haya más features por pantalla
- Hero con balance gigante puede reemplazar el BudgetTracker legacy
- Filtros pills reemplazan FilterByCategory legacy sin romperlo (convivir durante migrate)
- FAB necesita ajuste de `bottom` para no quedar sobre bottom nav (~84px + safe-area)
