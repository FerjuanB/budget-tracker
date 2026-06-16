/**
 * Gemini API client - direct Google AI Studio (free tier)
 *
 * Get your free API key at: https://aistudio.google.com/apikey
 *
 * Free tier: rate limits are per-tier and dynamic — check AI Studio for exact numbers
 * for family usage. OCR quality is state-of-the-art.
 *
 * Model history:
 * - gemini-2.0-flash-exp → rejected vision payloads (INVALID_ARGUMENT)
 * - gemini-2.0-flash → quota limit:0 in some regions (RESOURCE_EXHAUSTED)
 * - gemini-1.5-flash → removed, 404 NOT_FOUND
 * - gemini-2.5-flash ✅ latest stable (June 2025), best free-tier OCR
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-2.5-flash' // latest stable multimodal (June 2025)

interface OcrParsedData {
  amount: number | null
  merchant: string | null
  date: string | null // ISO format
  category_hint: string | null
  currency: string
  raw_text?: string
}

const SYSTEM_PROMPT = `Sos un asistente experto en leer tickets de compra argentinos.
Analizá la imagen del ticket y extraé SOLO estos campos en JSON:
- amount: número con el total final en ARS (pesos argentinos), con decimales usando punto. Ejemplo: 18450.50
- merchant: nombre del comercio
- date: fecha en formato YYYY-MM-DD (si no está clara, usar null)
- category_hint: una de [alimentación, transporte, farmacia, vestimenta, hogar, entretenimiento, servicios, educación, otros]
- currency: "ARS" (salvo que sea claramente otra moneda)

Respondé SOLAMENTE un JSON compacto, sin markdown fences, sin explicaciones, sin raw_text. Keep it short.
Si no podés leer algún campo, usá null.`

export async function analyzeReceiptImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<OcrParsedData> {
  // eslint-disable-next-line no-process-env
  const apiKey = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process?.env?.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada. Obtener gratis en https://aistudio.google.com/apikey')
  }

  // Guardrail: base64 no debe estar vacío ni muy grande
  if (!imageBase64 || imageBase64.length < 100) {
    throw new Error('Imagen vacía o corrupta')
  }

  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: SYSTEM_PROMPT },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096, // generous — gemini-2.5 is a thinking model, budget includes thinking tokens
      responseMimeType: 'application/json', // force JSON output
      thinkingConfig: { thinkingBudget: 0 }, // disable thinking for OCR (faster + no budget waste)
    },
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (networkError) {
    console.error('[Gemini OCR Network Error]', networkError)
    throw new Error('No se pudo conectar con Gemini. Revisá tu conexión.')
  }

  if (!response.ok) {
    // Preserve full error details for debugging
    const errText = await response.text()
    console.error('[Gemini OCR Error]', {
      status: response.status,
      statusText: response.statusText,
      body: errText,
      payloadSize: imageBase64.length,
      mimeType,
    })

    // Parse Gemini error for human-readable message + retryDelay
    let humanMessage = `Gemini rechazó la imagen (${response.status})`
    let retryDelaySeconds = 0
    try {
      const errJson = JSON.parse(errText)
      const msg = errJson?.error?.message || errJson?.error?.status
      if (msg) humanMessage = msg

      // Parse retryDelay (e.g., "13.025238652s" → 14)
      const retryDelayStr = errJson?.error?.details?.find(
        (d: { '@type'?: string }) => d['@type']?.includes('RetryInfo')
      )?.retryDelay
      if (retryDelayStr && typeof retryDelayStr === 'string') {
        const parsed = parseFloat(retryDelayStr.replace('s', ''))
        if (!isNaN(parsed)) retryDelaySeconds = Math.ceil(parsed)
      }

      // Quota exhausted — if we haven't already retried, do it once
      if (response.status === 429 && retryDelaySeconds > 0 && retryDelaySeconds <= 30) {
        console.log(`[Gemini OCR] 429 quota exceeded, retrying after ${retryDelaySeconds}s`)
        await new Promise((r) => setTimeout(r, retryDelaySeconds * 1000))
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (retryResponse.ok) {
          // Swap and continue as if nothing happened
          const retryResultText = await retryResponse.text()
          return parseGeminiResponse(retryResultText)
        }
        // Retry also failed — fall through to normal error handling
      }
    } catch {
      // not JSON, use raw text truncated to 500 chars for visibility
      humanMessage = errText.slice(0, 500)
    }

    // Friendly 429 message
    if (response.status === 429) {
      const waitMsg = retryDelaySeconds > 0 ? ` Esperá ${retryDelaySeconds}s y probá de nuevo.` : ''
      throw new Error(`Cuota de Gemini excedida.${waitMsg} El servicio gratuito tiene un límite por día; si lo excedés seguido, avisá al administrador.`)
    }

    throw new Error(humanMessage)
  }

  const resultText = await response.text()
  return parseGeminiResponse(resultText)
}

function parseGeminiResponse(resultText: string): OcrParsedData {
  let result: any
  try {
    result = JSON.parse(resultText)
  } catch {
    console.error('[Gemini OCR] Response not valid JSON:', resultText.slice(0, 300))
    throw new Error('Gemini devolvió una respuesta inválida. Probá de nuevo.')
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    // Check if Gemini blocked the request (safety filters)
    const blockReason = result.candidates?.[0]?.finishReason
    if (blockReason === 'SAFETY' || blockReason === 'PROHIBITED_CONTENT') {
      throw new Error('Gemini rechazó la imagen por política de contenido. Probá con otra foto.')
    }
    throw new Error('Gemini no pudo extraer texto del ticket. Probá con una foto más nítida.')
  }

  // Parse the JSON from Gemini, handling markdown fences
  const cleanedText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleanedText) as OcrParsedData
    return {
      amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(String(parsed.amount)) || null,
      merchant: parsed.merchant ?? null,
      date: parsed.date ?? null,
      category_hint: parsed.category_hint ?? null,
      currency: parsed.currency ?? 'ARS',
    }
  } catch (parseError) {
    // Fallback: try to extract fields from truncated JSON
    // Gemini may cut off the output if the response is long
    console.warn('[Gemini OCR] JSON truncated, attempting partial recovery:', cleanedText.slice(0, 100))

    const extractString = (key: string): string | null => {
      const m = cleanedText.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 's'))
      return m ? m[1].trim() : null
    }

    const extractNumber = (key: string): number | null => {
      const m = cleanedText.match(new RegExp(`"${key}"\\s*:\\s*([\\d.]+)`, 's'))
      return m ? parseFloat(m[1]) : null
    }

    const amount = extractNumber('amount')
    const merchant = extractString('merchant')

    if (amount !== null || merchant !== null) {
      console.log('[Gemini OCR] Partial recovery succeeded:', { amount, merchant })
      return {
        amount,
        merchant,
        date: extractString('date'),
        category_hint: extractString('category_hint'),
        currency: extractString('currency') ?? 'ARS',
      }
    }

    console.error('[Gemini OCR Parse Error]', { cleanedText, parseError })
    throw new Error('Gemini devolvió una respuesta inválida. Probá de nuevo.')
  }
}

export type { OcrParsedData }
