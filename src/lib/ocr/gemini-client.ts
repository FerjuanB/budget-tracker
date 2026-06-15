/**
 * Gemini API client - direct Google AI Studio (free tier)
 * 
 * Get your free API key at: https://aistudio.google.com/apikey
 * 
 * Free tier: 15 RPM, 1M tokens/min, 1500 RPD — plenty for family usage
 * Model: gemini-2.0-flash-exp (best OCR for receipts)
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-2.0-flash-exp'

interface GeminiVisionResult {
  content: Array<{
    parts: Array<{
      text?: string
      inlineData?: { mimeType: string; data: string }
    }>
  }>
}

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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada. Obtener gratis en https://aistudio.google.com/apikey')
  }

  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body: GeminiVisionResult = {
    content: [
      {
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
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('[Gemini OCR Error]', response.status, errText)
    throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`)
  }

  const result = await response.json()
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini no pudo extraer texto del ticket')
  }

  // Parse the JSON from Gemini, being defensive about markdown fences
  const cleanedText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleanedText) as OcrParsedData
    return {
      amount: parsed.amount ?? null,
      merchant: parsed.merchant ?? null,
      date: parsed.date ?? null,
      category_hint: parsed.category_hint ?? null,
      currency: parsed.currency ?? 'ARS',
      raw_text: parsed.raw_text ?? undefined,
    }
  } catch (parseError) {
    console.error('[Gemini OCR Parse Error]', cleanedText)
    throw new Error('Respuesta de Gemini no es JSON válido')
  }
}

export type { OcrParsedData }
