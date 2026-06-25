import { createObservationJson, type ObservationInput } from './mock-ai'
import type { AiInsight } from './types'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_MODEL = 'gpt-5.4-mini'

const observationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    discovery: {
      type: 'string',
      description: '写真や声から読み取った、今日の具体的な発見。',
    },
    margin: {
      type: 'string',
      description: '今日の余白を表す短い名詞句。',
    },
    key: {
      type: 'string',
      description: '明日の通学時間を見るための短い問い。',
    },
    sentence: {
      type: 'string',
      description: '明日の通学時間が少し違って見える一文。',
    },
    keywords: {
      type: 'object',
      additionalProperties: false,
      properties: {
        photo: {
          type: 'array',
          description:
            '写真から読み取れた具体物、場所、色、端の要素。3〜6個。',
          items: {
            type: 'string',
          },
        },
        voice: {
          type: 'array',
          description:
            '声やメモから読み取れた言葉、気配、音、身体感覚。1〜5個。',
          items: {
            type: 'string',
          },
        },
      },
      required: ['photo', 'voice'],
    },
  },
  required: ['discovery', 'margin', 'key', 'sentence', 'keywords'],
} as const

export type OpenAiObservationInput = ObservationInput & {
  photoSrc?: string
}

type ResponsesApiResponse = {
  output_text?: string
  output?: Array<{
    content?: Array<{
      text?: string
      type?: string
    }>
  }>
  error?: {
    message?: string
  }
}

export class OpenAiObservationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenAiObservationError'
  }
}

function clean(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function isDataImage(src: string | undefined): src is string {
  return Boolean(src?.startsWith('data:image/'))
}

function buildPrompt(input: OpenAiObservationInput): string {
  const voice = input.voiceAnalysis
  const photoAnalysis = input.photoAnalysis

  return [
    'あなたは日記を励ます人ではなく、通学前の観察者です。',
    '写真がある場合は、写真の内容を具体的に見てください。主役だけでなく、端、背景、植え込み、光、影、文字、小さな色の点、置かれ方を観察します。',
    '見えないことは断定しないでください。写っている具体物から言える範囲で書きます。',
    '声やメモは、感情を慰める材料ではなく、写真の見方を変える補助情報として扱います。',
    '「今日も頑張った」「大丈夫」「素敵」「宝物」「特別な一日」のような励ましやテンプレートは禁止です。',
    'keywords.photo には、写真から読み取れた具体物、場所、色、小さな要素を3〜6個入れてください。例: 駅の床、端の植え込み、白い花、夕方の光。',
    'keywords.voice には、声やメモから読み取れた言葉、気配、身体感覚を1〜5個入れてください。例: 眠い、急いでいた、笑い声、雨の音。',
    'sentence は一文だけ。28字から56字くらい。keywordsのうち1〜2個を使い、明日の通学時間に新しい発見をするための視点で終えてください。',
    'key はアドバイスではなく、短い問いにしてください。',
    '',
    `メモ: ${clean(input.note) || 'なし'}`,
    `声に残った言葉: ${clean(voice?.transcript) || 'なし'}`,
    `声の長さ: ${voice ? `${voice.durationSeconds}秒 / ${voice.texture ?? voice.pace}` : 'なし'}`,
    `写真の簡易分析: ${
      photoAnalysis
        ? [
            photoAnalysis.microDetail,
            photoAnalysis.edgeDetail,
            photoAnalysis.brightness,
            photoAnalysis.tone,
          ]
            .filter(Boolean)
            .join(' / ')
        : 'なし'
    }`,
    '',
    'JSONだけを返してください。',
  ].join('\n')
}

function extractResponseText(data: ResponsesApiResponse): string {
  if (typeof data.output_text === 'string') return data.output_text

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === 'string') return content.text
    }
  }

  return ''
}

function parseInsight(text: string): AiInsight {
  const trimmed = text.trim()
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : trimmed.match(/\{[\s\S]*\}/)?.[0]

  if (!jsonText) {
    throw new OpenAiObservationError('AIの返答をJSONとして読めませんでした。')
  }

  const parsed = JSON.parse(jsonText) as Partial<AiInsight>
  const keywords = {
    photo: sanitizeKeywords(parsed.keywords?.photo),
    voice: sanitizeKeywords(parsed.keywords?.voice),
  }
  const insight: AiInsight = {
    discovery: clean(parsed.discovery),
    margin: clean(parsed.margin),
    key: clean(parsed.key),
    sentence: clean(parsed.sentence),
    keywords,
  }

  if (
    !insight.discovery ||
    !insight.margin ||
    !insight.key ||
    !insight.sentence ||
    keywords.photo.length + keywords.voice.length === 0
  ) {
    throw new OpenAiObservationError('AIの返答に必要な項目が足りませんでした。')
  }

  return insight
}

function sanitizeKeywords(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()
  return values
    .map((value) => clean(typeof value === 'string' ? value : ''))
    .filter((value) => {
      if (!value || seen.has(value)) return false
      seen.add(value)
      return true
    })
    .slice(0, 6)
}

export async function observeDayWithOpenAi(
  input: OpenAiObservationInput,
  apiKey: string,
): Promise<AiInsight> {
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) return createObservationJson(input)

  const content: Array<
    | {
        type: 'input_text'
        text: string
      }
    | {
        type: 'input_image'
        image_url: string
      }
  > = [
    {
      type: 'input_text',
      text: buildPrompt(input),
    },
  ]

  if (input.hasPhoto && isDataImage(input.photoSrc)) {
    content.push({
      type: 'input_image',
      image_url: input.photoSrc,
    })
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${trimmedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'user',
          content,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'daily_observation',
          strict: true,
          schema: observationSchema,
        },
      },
      max_output_tokens: 700,
    }),
  })

  const data = (await response.json().catch(() => ({}))) as ResponsesApiResponse

  if (!response.ok) {
    throw new OpenAiObservationError(
      data.error?.message ?? 'AI分析に失敗しました。',
    )
  }

  return parseInsight(extractResponseText(data))
}
