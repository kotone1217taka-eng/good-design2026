import { createObservationJson, type ObservationInput } from './mock-ai'
import type { AiInsight } from './types'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_MODEL = 'gpt-5.4-mini'

const observationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    standout: {
      type: 'array',
      description: '写真の中で目立ったもの。具体物、配置、色、端の要素など。',
      items: { type: 'string' },
    },
    interesting: {
      type: 'array',
      description: 'AIが写真と音声を合わせて面白いと感じたポイント。評価や励ましではなく観察。',
      items: { type: 'string' },
    },
    atmosphere: {
      type: 'array',
      description: '写真と音声から感じたその場の雰囲気。背景や状況の仮説を含める。',
      items: { type: 'string' },
    },
    comment: {
      type: 'string',
      description: 'あとで見返したときに瞬間を思い出せる、背景の仮説を含む短い観察日記のようなコメント。',
    },
    keywords: {
      type: 'object',
      additionalProperties: false,
      properties: {
        photo: {
          type: 'array',
          description: '写真から読み取れた具体的なキーワード。',
          items: { type: 'string' },
        },
        voice: {
          type: 'array',
          description: '音声から読み取れた言葉、声の調子、周囲の音のキーワード。',
          items: { type: 'string' },
        },
      },
      required: ['photo', 'voice'],
    },
  },
  required: ['standout', 'interesting', 'atmosphere', 'comment', 'keywords'],
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
  const reactions = input.reactionProfile
  const customReactions = reactions?.custom
    .map((reaction) => {
      const examples = reaction.examples.length
        ? ` 反応したコメント: ${reaction.examples.join(' / ')}`
        : ''
      return `${reaction.label}: ${reaction.description}${examples}`
    })
    .join('\n')

  return [
    'あなたは写真に対して静かに反応する観察者です。',
    'ユーザーはアプリを開いて30秒以内に、その場で「面白いと思ったもの」を撮っています。',
    '外に出すためではなく、あとで自分だけが見返すための個人的な記録です。',
    'アプリのテーマは「30秒の余白。同じ毎日を、記憶に残る一日に。」です。',
    '写真に写っている具体物、端にある小さな要素、色、光、配置、背景の違和感をよく見てください。',
    '写真と音声から、場所、時間帯、状況、撮影者がそこにいた理由を背景として推測してください。',
    '背景の推測は断定せず、「〜のように見える」「〜かもしれない」「〜の途中に見える」のような仮説として書いてください。',
    '音声は、何が面白かったか、何をメインで撮ったかを本人がその場で話した重要な手がかりです。',
    '音声の文字起こし、声の調子、周囲の音を使って、写真のどこを主役として見るべきかを決めてください。',
    '過去のリアクションを参考にしてください。「さいこう」と「グッド」がついた見方は優先し、「ちがう」がついた見方や断定は繰り返さないでください。',
    'ユーザー作成リアクションがある場合、その名前よりも説明文を重視してください。説明文は、その人が何を面白いと感じるか、どの視点に共感するかを表しています。',
    'interesting には、写真の具体物と音声の内容がつながる観察を少なくとも1つ入れてください。',
    'atmosphere には、声の質感や話された言葉が写真の空気をどう変えるか、さらに背景の仮説を1つ含めてください。',
    'keywords.voice には、音声から読めた言葉や声の質感を2〜6個入れてください。音声が空の場合だけ空配列にします。',
    '励まし、評価、人生のアドバイスは禁止です。「頑張った」「素敵」「大丈夫」のような言葉は使いません。',
    '見えていないものを断定しないでください。具体的に見える範囲から観察し、推測は推測として扱ってください。',
    'comment は1つだけ、40〜90字程度。写真の具体的な要素を1つ以上、背景の仮説を1つ含めてください。',
    '',
    `音声の文字起こし: ${clean(voice?.transcript) || 'なし'}`,
    `音声の長さ: ${voice ? `${voice.durationSeconds}秒 / ${voice.texture ?? voice.pace}` : 'なし'}`,
    `過去に「さいこう」だった見方: ${reactions?.loved.length ? reactions.loved.join(' / ') : 'なし'}`,
    `過去に「グッド」だった見方: ${reactions?.liked.length ? reactions.liked.join(' / ') : 'なし'}`,
    `過去に「ちがう」だった見方: ${reactions?.rejected.length ? reactions.rejected.join(' / ') : 'なし'}`,
    `ユーザー作成リアクションの意味:\n${customReactions || 'なし'}`,
    `写真の簡易分析: ${
      photoAnalysis
        ? [
            photoAnalysis.microDetail,
            photoAnalysis.edgeDetail,
            photoAnalysis.focalArea,
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

function sanitizeList(values: unknown, max = 6): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()
  return values
    .map((value) => clean(typeof value === 'string' ? value : ''))
    .filter((value) => {
      if (!value || seen.has(value)) return false
      seen.add(value)
      return true
    })
    .slice(0, max)
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
    photo: sanitizeList(parsed.keywords?.photo),
    voice: sanitizeList(parsed.keywords?.voice),
  }
  const insight: AiInsight = {
    standout: sanitizeList(parsed.standout, 5),
    interesting: sanitizeList(parsed.interesting, 5),
    atmosphere: sanitizeList(parsed.atmosphere, 4),
    comment: clean(parsed.comment),
    keywords,
  }

  if (
    !insight.standout.length ||
    !insight.interesting.length ||
    !insight.atmosphere.length ||
    !insight.comment
  ) {
    throw new OpenAiObservationError('AIの返答に必要な観察項目が足りませんでした。')
  }

  return insight
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
          name: 'personal_photo_observation',
          strict: true,
          schema: observationSchema,
        },
      },
      max_output_tokens: 900,
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
