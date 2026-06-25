import { NextResponse } from 'next/server'
import {
  observeDayWithOpenAi,
  OpenAiObservationError,
  type OpenAiObservationInput,
} from '@/lib/openai-observer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'OPENAI_API_KEYが未設定です。VercelのEnvironment Variablesに追加してください。',
      },
      { status: 500 },
    )
  }

  let input: OpenAiObservationInput
  try {
    input = (await request.json()) as OpenAiObservationInput
  } catch {
    return NextResponse.json(
      { error: 'リクエストを読み取れませんでした。' },
      { status: 400 },
    )
  }

  try {
    const insight = await observeDayWithOpenAi(input, apiKey)
    return NextResponse.json({ insight })
  } catch (error) {
    const message =
      error instanceof OpenAiObservationError
        ? error.message
        : 'AI分析に失敗しました。'

    return NextResponse.json({ error: message }, { status: 502 })
  }
}
