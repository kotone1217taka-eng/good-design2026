import type { AiInsight, PhotoAnalysis, VoiceAnalysis } from './types'

export type ObservationInput = {
  note: string
  hasPhoto: boolean
  hasVoice?: boolean
  photoAnalysis?: PhotoAnalysis
  voiceAnalysis?: VoiceAnalysis
}

type Lens = {
  match: RegExp
  hint: string
  question: string
}

const LENSES: Lens[] = [
  {
    match: /(通学|電車|駅|バス|歩|道|帰り道|コンビニ|自転車)/,
    hint: 'いつもの道の端を一つ見る',
    question: 'いつもの道で、端に残る一点はどこか。',
  },
  {
    match: /(空|雲|雨|風|光|夕方|朝|夜|水たまり|影|天気)/,
    hint: '光が引っかかる場所を見る',
    question: '時間は、どんな色で見えていたか。',
  },
  {
    match: /(声|話|友達|先生|家族|人|会話|電話|LINE|音)/,
    hint: '言葉のあとに残る音を聞く',
    question: '言葉より長く残った音は何か。',
  },
  {
    match: /(疲|眠|だる|焦|不安|嫌|つら|静か|ぼーっと)/,
    hint: '体が遅い朝の景色を見る',
    question: '体が朝に追いつく前、何が見えていたか。',
  },
  {
    match: /(嬉|楽|安心|好き|きれい|面白|笑|落ち着|よかった)/,
    hint: '少し軽くなる場所を見る',
    question: 'その軽さは、どこから来ていたか。',
  },
]

const DEFAULT_LENS: Lens = {
  match: /.*/,
  hint: '昨日と違う一点だけを見る',
  question: 'なぜ、その一点だけが残ったのか。',
}

const DETAIL_WORDS = [
  '植え込み',
  '小さい花',
  '花',
  '葉',
  '緑',
  '白',
  '黄色',
  'ピンク',
  '光',
  '影',
  '水たまり',
  '窓',
  '空',
  '雨',
  '風',
  '駅',
  'コンビニ',
  '帰り道',
  '笑い',
  '声',
  '眠い',
  '疲れた',
  'だるい',
] as const

function cleanNote(note: string): string {
  return note.replace(/\s+/g, ' ').trim()
}

function pickLens(note: string): Lens {
  return LENSES.find((lens) => lens.match.test(note)) ?? DEFAULT_LENS
}

function shorten(value: string, maxLength: number): string {
  const cleaned = cleanNote(value)
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}…` : cleaned
}

function photoDetail(input: ObservationInput): string {
  if (!input.hasPhoto) return ''
  const analysis = input.photoAnalysis
  if (!analysis) return '今日の写真の端'
  if (analysis.microDetail) return shorten(analysis.microDetail, 28)
  if (analysis.edgeDetail) return shorten(analysis.edgeDetail, 24)
  return `${analysis.brightness}の${analysis.tone}`
}

function extractKeyword(text: string, lens: Lens): string {
  const cleaned = cleanNote(text)
  const detailWord = DETAIL_WORDS.find((word) => cleaned.includes(word))
  if (detailWord) return detailWord

  const fragments = cleaned
    .split(/[。！？!?、,.，\n]/)
    .map((fragment) => fragment.trim())
    .filter(Boolean)
  const matched = fragments.find((fragment) => lens.match.test(fragment))
  const picked = matched ?? fragments[0]

  if (!picked) return ''
  return shorten(picked, 10)
}

function voiceKeyword(input: ObservationInput, note: string, lens: Lens): string {
  if (!input.hasVoice) return ''
  const transcript = cleanNote(input.voiceAnalysis?.transcript ?? '')
  return extractKeyword(transcript || note, lens)
}

function uniqueKeywords(values: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const keywords: string[] = []

  values.forEach((value) => {
    const cleaned = shorten(value ?? '', 12)
    if (!cleaned || seen.has(cleaned)) return
    seen.add(cleaned)
    keywords.push(cleaned)
  })

  return keywords.slice(0, 6)
}

function buildKeywords(input: ObservationInput, note: string, lens: Lens) {
  const photo = input.photoAnalysis
  const voice = input.voiceAnalysis
  const transcript = cleanNote(voice?.transcript ?? '')

  const photoKeywords = uniqueKeywords([
    photo?.focalArea,
    photo?.microDetail,
    photo?.edgeDetail,
    photo?.tone,
    input.hasPhoto ? '写真の端' : undefined,
  ])

  const voiceKeywords = uniqueKeywords([
    transcript ? extractKeyword(transcript, lens) : undefined,
    voice?.texture,
    voice?.hint,
    note ? extractKeyword(note, lens) : undefined,
  ])

  return {
    photo: photoKeywords,
    voice: voiceKeywords,
  }
}

function resolveHint(input: ObservationInput, lens: Lens): string {
  return (
    input.photoAnalysis?.commuteHint ??
    input.voiceAnalysis?.hint ??
    lens.hint
  )
}

function resolveQuestion(
  photoAnalysis: PhotoAnalysis | undefined,
  voiceAnalysis: VoiceAnalysis | undefined,
  lens: Lens,
): string {
  const hint = photoAnalysis?.commuteHint ?? voiceAnalysis?.hint ?? ''

  if (/植え込み|緑|葉/.test(hint)) {
    return '明日の植え込みに、一点だけ違う色はあるか。'
  }
  if (/光|影|窓|水/.test(hint)) {
    return '明日の道で、いちばん小さい光はどこにあるか。'
  }
  if (/音|声|言葉/.test(hint)) {
    return '言葉が消えたあと、どんな音が残るか。'
  }
  if (/体|朝/.test(hint)) {
    return '体がまだ遅いとき、景色はどこから動き出すか。'
  }

  return lens.question
}

function buildSentence(input: ObservationInput, note: string, lens: Lens): string {
  const photo = photoDetail(input)
  const voice = voiceKeyword(input, note, lens)
  const hint = shorten(resolveHint(input, lens), 18)
  const voiceCanSharpenPhoto =
    voice && !photo.includes(voice) && !/(眠い|疲れた|だるい)/.test(voice)

  if (photo && voiceCanSharpenPhoto) {
    return `${photo}と「${shorten(voice, 8)}」、明日は${hint}。`
  }
  if (photo) return `${photo}、明日は${hint}。`
  if (voice) return `声に残った「${shorten(voice, 8)}」、明日は${hint}。`

  const keyword = extractKeyword(note, lens)
  if (keyword) return `「${shorten(keyword, 8)}」が残った日、明日は${hint}。`

  return `今日の端に残った一点、明日は${hint}。`
}

export function createObservationJson(input: ObservationInput): AiInsight {
  const note = cleanNote(input.note)
  const transcript = cleanNote(input.voiceAnalysis?.transcript ?? '')
  const lens = pickLens(`${note} ${transcript}`)
  const photo = photoDetail(input)
  const voice = voiceKeyword(input, note, lens)
  const subject =
    photo ||
    (voice ? `声に残った「${voice}」` : extractKeyword(note, lens)) ||
    '今日の記録の端'
  const keywords = buildKeywords(input, note, lens)

  return {
    discovery: `${subject}が、今日の記録に残っていました。`,
    margin: photo && voice ? '写真の端と、声の中の短い言葉' : '記録の端に残った小さな差',
    key: resolveQuestion(input.photoAnalysis, input.voiceAnalysis, lens),
    sentence: buildSentence(input, note, lens),
    keywords,
  }
}

export async function observeDay(input: ObservationInput): Promise<AiInsight> {
  await new Promise((resolve) => setTimeout(resolve, 700))

  return createObservationJson(input)
}
