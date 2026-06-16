/**
 * Gemini API client - direct Google AI Studio (free tier)
 *
 * Get your free API key at: https://aistudio.google.com/apikey
 *
 * Free tier: 15 RPM, 1M tokens/min, 1500 RPD — plenty for family usage
 * Model: gemini-2.0-flash (stable, best OCR for receipts, vision-enabled)
 *
 * NOTE: we previously used gemini-2.0-flash-exp (experimental) but it
 * rejects vision payloads with INVALID_ARGUMENT 400. The stable model
 * handles inlineData reliably.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-2.0-flash' // stable vision model

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
- raw_text: texto completo del ticket si es legible

Respondé SOLAMENTE JSON válido, sin markdown fences, sin explicaciones adicionales.
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
      maxOutputTokens: 1024,
      responseMimeType: 'application/json', // force JSON output
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

    // Parse Gemini error for human-readable message
    let humanMessage = `Gemini rechazó la imagen (${response.status})`
    try {
      const errJson = JSON.parse(errText)
      const msg = errJson?.error?.message || errJson?.error?.status
      if (msg) humanMessage = msg
    } catch {
      // not JSON, use raw text truncated to 500 chars for visibility
      humanMessage = errText.slice(0, 500)
    }

    throw new Error(humanMessage)
  }

  const result = await response.json()
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
      raw_text: parsed.raw_text ?? undefined,
    }
  } catch (parseError) {
    console.error('[Gemini OCR Parse Error]', { cleanedText, parseError })
    throw new Error('Gemini devolvió una respuesta inválida. Probá de nuevo.')
  }
}

export type { OcrParsedData }
