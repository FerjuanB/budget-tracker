import { useCallback, useState } from 'react'

export type SheetName = 'actions' | 'quick' | 'ocr' | 'recurring'

/**
 * Hook for managing navigation between stacked bottom sheets
 * (action sheet → quick add, action sheet → ocr, etc)
 */
export function useSheetStack(initial: SheetName | null = null) {
  const [stack, setStack] = useState<SheetName[]>(initial ? [initial] : [])

  const open = useCallback((name: SheetName) => {
    setStack([name])
  }, [])

  const push = useCallback((name: SheetName) => {
    setStack((prev) => [...prev, name])
  }, [])

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : []))
  }, [])

  const close = useCallback(() => {
    setStack([])
  }, [])

  const current = stack.length > 0 ? stack[stack.length - 1] : null
  const isOpen = stack.length > 0

  return { current, isOpen, open, push, back, close }
}
