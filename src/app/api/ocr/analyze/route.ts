import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/api-helpers'
import { prisma } from '@/lib/prisma'
import { analyzeReceiptImage } from '@/lib/ocr/gemini-client'
import { z } from 'zod'

const analyzeSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().optional().default('image/jpeg'),
})

/**
 * POST /api/ocr/analyze
 * 
 * Accepts an image as base64 string, sends it to Gemini for OCR,
 * persists the OcrScan record (status=PENDING) and returns the parsed data.
 * 
 * Does NOT persist the image itself (v1 simplification — no Supabase Storage).
 * If you later want image persistence, extend this route to upload to Storage
 * and save the URL in OcrScan.imageUrl.
 * 
 * Body: { imageBase64: string, mimeType?: "image/jpeg" | "image/png" }
 * Response: { ocrScanId, parsed: { amount, merchant, date, category_hint, currency } }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const validated = analyzeSchema.parse(body)

    // Guard: max base64 length = ~5MB raw image → ~6.7MB base64
    if (validated.imageBase64.length > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Imagen demasiado grande. Máximo 5MB.' },
        { status: 413 }
      )
    }

    // Call Gemini (can take 2-5s)
    const parsed = await analyzeReceiptImage(validated.imageBase64, validated.mimeType)

    // Persist scan for audit trail (v1: no image storage, only JSON)
    const scan = await prisma.ocrScan.create({
      data: {
        userId: user.id,
        imageUrl: null,
        rawResponse: parsed as any,       // v1: same as parsed (no extra LLM output to keep)
        parsed: parsed as any,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      ocrScanId: scan.id,
      parsed,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('POST /api/ocr/analyze error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
