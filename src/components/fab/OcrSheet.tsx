'use client'

import { useState, useRef, useEffect } from 'react'
import { useCategories, useCurrentPeriod } from '@/hooks/useBudgetData'
import { useAnalyzeReceipt, useConfirmOcrScan, OcrParsedData } from '@/hooks/useOcr'

interface OcrSheetProps {
  onSuccess?: () => void
  onBack?: () => void
}

type Stage = 'select' | 'analyzing' | 'preview' | 'error'

/**
 * Convert a File to base64 string (without the data:... prefix).
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data:mime/type;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Fuzzy-match Gemini's category_hint to the user's existing categories.
 * Returns category id or empty string if no match.
 */
function matchCategoryFromHint(
  hint: string | null,
  categories: Array<{ id: string; name: string; icon: string }>
): string {
  if (!hint) return ''
  const normalized = hint.toLowerCase().trim()

  // Direct name match (case-insensitive)
  const direct = categories.find((c) => c.name.toLowerCase() === normalized)
  if (direct) return direct.id

  // Partial match: either contains the other
  const partial = categories.find(
    (c) =>
      c.name.toLowerCase().includes(normalized) ||
      normalized.includes(c.name.toLowerCase())
  )
  if (partial) return partial.id

  // Synonyms for Argentine common categories
  const synonymMap: Record<string, string[]> = {
    alimentación: ['comida', 'supermercado', 'almacén', 'kiosco', 'panadería'],
    transporte: ['nafta', 'combustible', 'subte', 'colectivo', 'taxi', 'uber'],
    farmacia: ['medicamentos', 'salud', 'droguería'],
    hogar: ['casa', 'limpieza', 'electrodomésticos'],
    entretenimiento: ['ocio', 'cine', 'streaming', 'suscripciones'],
    servicios: ['luz', 'gas', 'agua', 'internet', 'celular', 'edenor', 'edesur', 'metrogas'],
    vestimenta: ['ropa', 'indumentaria'],
    educación: ['colegio', 'universidad', 'cursos', 'libros'],
  }

  const canonical = Object.keys(synonymMap).find(
    (k) => synonymMap[k].includes(normalized) || k === normalized
  )
  if (canonical) {
    const match = categories.find((c) => c.name.toLowerCase() === canonical)
    if (match) return match.id
  }

  return ''
}

/**
 * OCR Sheet: upload image → Gemini analyzes → user previews & confirms → Expense created.
 * 
 * Flow:
 *   1. select: user picks/takes photo
 *   2. analyzing: spinner while Gemini works
 *   3. preview: editable form with pre-filled data + Confirm button
 *   4. error: shown if Gemini fails (with fallback to manual)
 */
export default function OcrSheet({ onSuccess, onBack }: OcrSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: categories } = useCategories()
  const { data: currentPeriod } = useCurrentPeriod()

  const analyzeMutation = useAnalyzeReceipt()
  const confirmMutation = useConfirmOcrScan()

  const [stage, setStage] = useState<Stage>('select')
  const [error, setError] = useState('')
  const [ocrScanId, setOcrScanId] = useState('')
  const [parsed, setParsed] = useState<OcrParsedData | null>(null)

  // Editable fields (prefilled from parsed + editable)
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Reset on mount
  useEffect(() => {
    setStage('select')
    setError('')
    setOcrScanId('')
    setParsed(null)
  }, [])

  // Prefill form fields when parsed data arrives
  useEffect(() => {
    if (parsed && categories) {
      if (parsed.amount) setAmount(parsed.amount.toString())
      if (parsed.merchant) setMerchant(parsed.merchant)
      if (parsed.date) setDate(parsed.date)
      const matched = matchCategoryFromHint(parsed.category_hint, categories as any)
      if (matched) setCategoryId(matched)
    }
  }, [parsed, categories])

  const handleFile = async (file: File) => {
    setError('')
    setStage('analyzing')
    try {
      const imageBase64 = await fileToBase64(file)
      const result = await analyzeMutation.mutateAsync({
        imageBase64,
        mimeType: file.type || 'image/jpeg',
      })
      setOcrScanId(result.ocrScanId)
      setParsed(result.parsed)
      setStage('preview')
    } catch (err: any) {
      setError(err.message || 'Error al analizar la imagen')
      setStage('error')
    }
  }

  const triggerPick = () => {
    fileInputRef.current?.click()
  }

  const canSubmit =
    ocrScanId &&
    amount &&
    parseFloat(amount) > 0 &&
    categoryId &&
    currentPeriod &&
    !confirmMutation.isPending

  const handleConfirm = async () => {
    if (!canSubmit || !currentPeriod) return

    try {
      await confirmMutation.mutateAsync({
        ocrScanId,
        periodId: currentPeriod!.id,
        categoryId,
        expenseName: merchant.trim() || 'Gasto escaneado',
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
      })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al confirmar')
    }
  }

  const remaining = currentPeriod?.summary?.remainingBudget
  const overBudget = amount && parseFloat(amount) > (remaining || 0)

  return (
    <div className="px-1 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={stage === 'select' ? onBack : () => setStage('select')}
          className="text-[var(--color-label-secondary)] text-sm"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          ← {stage === 'select' ? 'Volver' : 'Reintentar'}
        </button>
        <span className="w-16" />
      </div>

      <h2 className="heading text-[22px] mb-4 flex items-center gap-2">
        <span>📷</span>
        <span>Foto del ticket</span>
      </h2>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
        className="hidden"
      />

      {/* STAGE: select */}
      {stage === 'select' && (
        <div className="space-y-3">
          <button
            onClick={triggerPick}
            className="fab-tap w-full p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-quaternary)] border-2 border-dashed border-[var(--color-label-quaternary)] text-left"
          >
            <div className="text-center">
              <div className="text-5xl mb-3">📸</div>
              <div className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                Tomar foto o elegir imagen
              </div>
              <div className="text-xs text-[var(--color-label-secondary)]">
                Acepta tickets, facturas, comprobantes
              </div>
            </div>
          </button>

          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-accent)]10 border border-[var(--color-accent)]20">
            <div className="text-[11px] text-[var(--color-label-secondary)] leading-relaxed">
              💡 Gemini detecta: monto, comercio, fecha y categoría sugerida.
              Siempre confirmás/editás antes de guardar.
            </div>
          </div>
        </div>
      )}

      {/* STAGE: analyzing */}
      {stage === 'analyzing' && (
        <div className="py-12 text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-4" />
          <div className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            Analizando ticket...
          </div>
          <div className="text-xs text-[var(--color-label-secondary)] mt-1">
            Gemini está leyendo el ticket (5-10 segundos)
          </div>
        </div>
      )}

      {/* STAGE: error */}
      {stage === 'error' && (
        <div className="space-y-3">
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-destructive)]10 border border-[var(--color-destructive)]30">
            <div className="font-semibold text-[var(--color-destructive)] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              No pudimos leer el ticket
            </div>
            <div className="text-xs text-[var(--color-label-secondary)]">{error}</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={triggerPick}
              className="flex-1 py-3 rounded-[var(--radius-md)] font-medium"
              style={{
                background: 'var(--color-surface-quaternary)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Reintentar
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-[var(--radius-md)] font-medium"
              style={{
                background: 'var(--color-surface-quaternary)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Cargar manual
            </button>
          </div>
        </div>
      )}

      {/* STAGE: preview (edit + confirm) */}
      {stage === 'preview' && parsed && (
        <div className="space-y-4">
          <div className="text-[11px] text-[var(--color-label-secondary)] text-center mb-2">
            Datos detectados · podés editarlos antes de confirmar
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
              Monto
            </label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-3">
              <span className="text-xl text-[var(--color-label-secondary)]">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="amount bg-transparent flex-1 text-2xl outline-none"
              />
            </div>
            {amount && parseFloat(amount) > 0 && remaining !== undefined && (
              <div className={`mt-2 text-xs ${overBudget ? 'text-[var(--color-destructive)]' : 'text-[var(--color-success)]'}`}>
                {overBudget
                  ? `⚠️ Supera el disponible ($${remaining.toLocaleString()})`
                  : `✓ Quedarían $${(remaining - parseFloat(amount)).toLocaleString()}`}
              </div>
            )}
          </div>

          {/* Merchant */}
          <div>
            <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
              Comercio
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Ej: Coto, YPF..."
              className="w-full bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-3 outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-3 outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-[var(--color-label-secondary)] mb-2 block uppercase tracking-wide">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-3 py-3 outline-none"
            >
              <option value="">Elegir categoría...</option>
              {(categories as any[])?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-xs text-[var(--color-destructive)] bg-[var(--color-destructive)]10 p-3 rounded-[var(--radius-sm)]">
              {error}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="fab-tap w-full py-4 rounded-[var(--radius-md)] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-accent)',
              fontFamily: 'var(--font-heading)',
              fontSize: 17,
            }}
          >
            {confirmMutation.isPending ? 'Guardando...' : 'Confirmar y agregar gasto'}
          </button>
        </div>
      )}
    </div>
  )
}
