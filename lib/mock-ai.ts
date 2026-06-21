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
  action: string
  question: string
}

const LENSES: Lens[] = [
  {
    match: /(通学|電車|駅|バス|歩|道|帰り道|コンビニ|自転車)/,
    action: 'いつもの道の端を一つ見る',
    question: 'いつもの道で、目が止まった一点はどこか。',
  },
  {
    match: /(空|雲|雨|風|光|夕方|朝|夜|水たまり|影|天気)/,
    action: '空の色を時刻として見る',
    question: '時間は、どんな色で見えていたか。',
  },
  {
    match: /(声|話|友達|先生|家族|人|会話|電話|LINE|音)/,
    action: '人の声の間を聞く',
    question: '言葉より長く残った音は何か。',
  },
  {
    match: /(疲|眠|だる|焦|不安|嫌|つら|静か|ぼーっと)/,
    action: '体の遅さも景色として見る',
    question: '体が朝に追いつく前、何が見えていたか。',
  },
  {
    match: /(嬉|楽|安心|好き|きれい|面白|笑|落ち着|よかった)/,
    action: '少し軽くなる場所を目印にする',
    question: 'その軽さは、どこから来ていたか。',
  },
]

const DEFAULT_LENS: Lens = {
  match: /.*/,
  action: '昨日と違う一点だけを探す',
  question: 'なぜ、その一点だけが残ったのか。',
}

function cleanNote(note: string): string {
  return note.replace(/\s+/g, ' ').trim()
}

function pickLens(note: string): Lens {
  return LENSES.find((lens) => lens.match.test(note)) ?? DEFAULT_LENS
}

function photoPhrase(input: ObservationInput): string {
  if (!input.hasPhoto) return '写真なし'
  if (!input.photoAnalysis) return '今日の写真'
  return `${input.photoAnalysis.brightness}で${input.photoAnalysis.tone}写真`
}

function voicePhrase(input: ObservationInput): string {
  if (!input.hasVoice) return '声なし'
  if (!input.voiceAnalysis) return '短い声'
  return `${input.voiceAnalysis.durationSeconds}秒の${input.voiceAnalysis.pace}`
}

function extractKeyword(note: string, lens: Lens): string {
  const fragments = note
    .split(/[。！？!?、,.，\n]/)
    .map((fragment) => fragment.trim())
    .filter(Boolean)
  const matched = fragments.find((fragment) => lens.match.test(fragment))
  const picked = matched ?? fragments[0]

  if (!picked) return ''
  return picked.length > 12 ? picked.slice(0, 12) : picked
}

export function createObservationJson(input: ObservationInput): AiInsight {
  const note = cleanNote(input.note)
  const lens = pickLens(note)
  const keyword = extractKeyword(note, lens)
  const photo = photoPhrase(input)
  const voice = voicePhrase(input)
  const subject = keyword ? `「${keyword}」` : '今日の記録'

  return {
    discovery: `${photo}と${voice}に、${subject}が残っていました。`,
    margin: '写真を選び、声を止めたあとに残った数秒',
    key: lens.question,
    sentence: `${photo}と${voice}。明日は${lens.action}。`,
  }
}

export async function observeDay(input: ObservationInput): Promise<AiInsight> {
  await new Promise((resolve) => setTimeout(resolve, 700))

  return createObservationJson(input)
}
