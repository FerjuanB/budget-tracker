'use client'

import { useState, useRef, useEffect } from 'react'
import { useCategories, useCurrentPeriod } from '@/hooks/useBudgetData'
import { useAnalyzeReceipt, useConfirmOcrScan, OcrParsedData } from '@/hooks/useOcr'

interface OcrSheetProps {
  onSuccess?: () => void
  onBack?: () => void
  /** Called when user taps "Cargar manual" fallback → navigates to QuickAdd */
  onFallbackToManual?: () => void
}

type Stage = 'select' | 'compressing' | 'analyzing' | 'preview' | 'error'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Resize an image file to max 1600px on the longest side and JPEG quality 0.8.
 * This typically reduces file size by 70-90% — important for mobile uploads
 * where photos can be 8-12MB. Gemini doesn't need 12MP to read text.
 */
async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        let { width, height } = img
        const scale = Math.min(1, maxDim / Math.max(width, height))
        width = Math.round(width * scale)
        height = Math.round(height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas no disponible')
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]
        resolve(base64)
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('No se pudo leer la imagen'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Fuzzy-match Gemini's category_hint to the user's existing categories.
 */
function matchCategoryFromHint(
  hint: string | null,
  categories: Array<{ id: string; name: string; icon: string }>
): string {
  if (!hint) return ''
  const normalized = hint.toLowerCase().trim()

  const direct = categories.find((c) => c.name.toLowerCase() === normalized)
  if (direct) return direct.id

  const partial = categories.find(
    (c) =>
      c.name.toLowerCase().includes(normalized) ||
      normalized.includes(c.name.toLowerCase())
  )
  if (partial) return partial.id

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
 *   1. select: user picks/takes photo (2 buttons: camera or gallery)
 *   2. compressing: resize image locally (fast)
 *   3. analyzing: spinner while Gemini works remotely
 *   4. preview: editable form with pre-filled data + Confirm button
 *   5. error: shown if anything fails (with fallback to manual entry)
 */
export default function OcrSheet({ onSuccess, onBack, onFallbackToManual }: OcrSheetProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const { data: categories } = useCategories()
  const { data: currentPeriod } = useCurrentPeriod()

  const analyzeMutation = useAnalyzeReceipt()
  const confirmMutation = useConfirmOcrScan()

  const [stage, setStage] = useState<Stage>('select')
  const [error, setError] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [ocrScanId, setOcrScanId] = useState('')
  const [parsed, setParsed] = useState<OcrParsedData | null>(null)

  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    setStage('select')
    setError('')
    setErrorDetail('')
    setOcrScanId('')
    setParsed(null)
  }, [])

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
    // Basic type check
    if (!file.type.startsWith('image/')) {
      setError('Archivo no válido')
      setErrorDetail(`Se esperaba una imagen, recibimos: ${file.type || 'desconocido'}`)
      setStage('error')
      return
    }

    // Guardrail: reject files > 20MB (likely a video)
    if (file.size > 20 * 1024 * 1024) {
      setError('Imagen muy grande')
      setErrorDetail(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. Usá una foto clara del ticket (menos de 5MB).`)
      setStage('error')
      return
    }

    setError('')
    setErrorDetail('')
    setStage('compressing')

    try {
      const imageBase64 = await compressImage(file)

      setStage('analyzing')
      const result = await analyzeMutation.mutateAsync({
        imageBase64,
        mimeType: 'image/jpeg', // compression always produces jpeg
      })

      // Guardrail: parsed must have at least an amount
      if (!result.parsed?.amount || result.parsed.amount <= 0) {
        setError('No pudimos detectar el monto')
        setErrorDetail('Gemini procesó la imagen pero no encontró un total claro. Probá con una foto más nítida, bien iluminada y sin reflejos.')
        setStage('error')
        return
      }

      setOcrScanId(result.ocrScanId)
      setParsed(result.parsed)
      setStage('preview')
    } catch (err: any) {
      console.error('OCR error:', err)
      const msg = err?.message || 'Error desconocido'
      const isNetwork = msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')
      const isTimeout = msg.includes('timeout') || msg.includes('Timeout')

      if (isNetwork || isTimeout) {
        setError('Problema de conexión')
        setErrorDetail('Revisá tu internet e intentá de vuelta. Si persiste, cargalo manual.')
      } else if (msg.includes('401') || msg.includes('403')) {
        setError('Error de configuración')
        setErrorDetail('La API de Gemini no tiene permisos. Avisá al administrador.')
      } else if (msg.includes('500') || msg.includes('503')) {
        setError('Gemini está saturado')
        setErrorDetail('El servicio de IA rechazó el pedido. Probá en unos segundos o cargá el ticket manual.')
      } else {
        setError('No pudimos leer el ticket')
        setErrorDetail(`${msg}. Probá con otra foto más nítida o cargá manual.`)
      }
      setStage('error')
    }
  }

  const triggerCamera = () => cameraInputRef.current?.click()
  const triggerGallery = () => galleryInputRef.current?.click()

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
      setErrorDetail('')
      setStage('error')
    }
  }

  const handleManualFallback = () => {
    if (onFallbackToManual) {
      onFallbackToManual()
    } else {
      onBack?.()
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#C4782B' }}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>Foto del ticket</span>
      </h2>

      {/* Two hidden inputs: camera (with capture) and gallery (without capture) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = '' // reset para poder seleccionar el mismo archivo otra vez
        }}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
        className="hidden"
      />

      {/* STAGE: select */}
      {stage === 'select' && (
        <div className="space-y-3">
          {/* Camera button */}
          <button
            onClick={triggerCamera}
            className="fab-tap w-full p-5 rounded-[var(--radius-lg)] text-left flex items-center gap-4"
            style={{
              background: 'rgba(196, 120, 43, 0.10)',
              border: '1px solid rgba(196, 120, 43, 0.25)',
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: '#C4782B',
                color: '#fff',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: '#C4782B' }}>
                Tomar foto
              </div>
              <div className="text-xs" style={{ color: 'var(--color-label-secondary)' }}>
                Abrí la cámara del celular
              </div>
            </div>
            <div style={{ color: '#C4782B', fontSize: 22 }}>›</div>
          </button>

          {/* Gallery button */}
          <button
            onClick={triggerGallery}
            className="fab-tap w-full p-5 rounded-[var(--radius-lg)] text-left flex items-center gap-4"
            style={{
              background: 'var(--color-surface-quaternary)',
              border: '1px solid var(--color-separator)',
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-label-secondary)',
                color: '#fff',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-label-primary)' }}>
                Elegir de la galería
              </div>
              <div className="text-xs" style={{ color: 'var(--color-label-secondary)' }}>
                Subí una foto ya tomada
              </div>
            </div>
            <div style={{ color: 'var(--color-label-secondary)', fontSize: 22 }}>›</div>
          </button>

          <div
            className="p-3 rounded-[var(--radius-md)]"
            style={{
              background: 'rgba(45, 74, 62, 0.08)',
              border: '1px solid rgba(45, 74, 62, 0.18)',
            }}
          >
            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--color-label-secondary)' }}>
              💡 Gemini detecta monto, comercio, fecha y categoría.
              Siempre confirmás o editás antes de guardar.
            </div>
          </div>
        </div>
      )}

      {/* STAGE: compressing */}
      {stage === 'compressing' && (
        <div className="py-12 text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-4" />
          <div className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            Preparando imagen...
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-label-secondary)' }}>
            Optimizando la foto (1-2 segundos)
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
          <div className="text-xs mt-1" style={{ color: 'var(--color-label-secondary)' }}>
            Gemini está leyendo el ticket (5-10 segundos)
          </div>
        </div>
      )}

      {/* STAGE: error */}
      {stage === 'error' && (
        <div className="space-y-3">
          <div
            className="p-4 rounded-[var(--radius-md)]"
            style={{
              background: 'rgba(179, 74, 60, 0.08)',
              border: '1px solid rgba(179, 74, 60, 0.25)',
            }}
          >
            <div
              className="font-semibold mb-2 flex items-center gap-2"
              style={{ fontFamily: 'var(--font-heading)', color: '#B34A3C' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {error}
            </div>
            {errorDetail && (
              <div className="text-xs" style={{ color: 'var(--color-label-secondary)', lineHeight: '1.5' }}>
                {errorDetail}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStage('select')}
              className="flex-1 py-3 rounded-[var(--radius-md)] font-medium font-heading"
              style={{
                background: 'var(--color-surface-quaternary)',
                color: 'var(--color-label-primary)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Reintentar
            </button>
            <button
              onClick={handleManualFallback}
              className="flex-1 py-3 rounded-[var(--radius-md)] font-medium text-white"
              style={{
                background: 'var(--color-accent)',
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
          <div className="text-[11px] text-center mb-2" style={{ color: 'var(--color-label-secondary)' }}>
            Datos detectados · podés editarlos antes de confirmar
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs mb-2 block uppercase tracking-wide" style={{ color: 'var(--color-label-secondary)' }}>
              Monto
            </label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-quaternary)] rounded-[var(--radius-md)] px-4 py-3">
              <span className="text-xl" style={{ color: 'var(--color-label-secondary)' }}>$</span>
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
            <label className="text-xs mb-2 block uppercase tracking-wide" style={{ color: 'var(--color-label-secondary)' }}>
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
            <label className="text-xs mb-2 block uppercase tracking-wide" style={{ color: 'var(--color-label-secondary)' }}>
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
            <label className="text-xs mb-2 block uppercase tracking-wide" style={{ color: 'var(--color-label-secondary)' }}>
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
