/**
 * Shared date/number formatters used across components.
 * Extracted to avoid duplication between ExpenseDetail, ExpenseList, etc.
 */

/**
 * Compact relative date for expense list rows.
 * - "Hoy, HH:MM" for today
 * - "Ayer" for yesterday
 * - "Hace N días" for this week
 * - "DD mon" for same year
 * - "DD mon YYYY" for older dates
 */
export function formatCompactDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor(
    (todayOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `Hoy, ${hours}:${minutes}`
  }
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`

  // Same year: "15 jun"
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }
  // Older: "15 jun 2024"
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Compact date without the "Hoy, HH:MM" hour component.
 * Used in merged list rows where we only show relative day.
 */
export function formatCompactDay(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor(
    (todayOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
