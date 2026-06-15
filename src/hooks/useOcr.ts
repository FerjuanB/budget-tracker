'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================
// TYPES
// ============================================

export interface OcrParsedData {
  amount: number | null
  merchant: string | null
  date: string | null       // ISO YYYY-MM-DD if detected, else null
  category_hint: string | null
  currency: string
  raw_text?: string
}

export interface AnalyzeResult {
  ocrScanId: string
  parsed: OcrParsedData
}

interface AnalyzeInput {
  imageBase64: string
  mimeType: string
}

interface ConfirmInput {
  ocrScanId: string
  periodId: string
  categoryId: string
  expenseName: string
  amount: number
  date: string         // ISO datetime
  comments?: string
}

// ============================================
// API FUNCTIONS
// ============================================

async function analyzeReceipt(input: AnalyzeInput): Promise<AnalyzeResult> {
  const res = await fetch('/api/ocr/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error analizando ticket' }))
    throw new Error(error.error || `Error al analizar (${res.status})`)
  }
  return res.json()
}

async function confirmOcrScan(input: ConfirmInput) {
  const res = await fetch('/api/ocr/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error al confirmar' }))
    throw new Error(error.error || `Error al confirmar (${res.status})`)
  }
  return res.json()
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to analyze an image via Gemini OCR.
 * Returns: { mutateAsync, isPending, error, data }
 */
export function useAnalyzeReceipt() {
  return useMutation({
    mutationFn: analyzeReceipt,
  })
}

/**
 * Hook to confirm and create the Expense from an OCR scan.
 * Invalidates expenses + period queries on success.
 */
export function useConfirmOcrScan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmOcrScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['period', 'current'] })
      queryClient.invalidateQueries({ queryKey: ['periods'] })
    },
  })
}
