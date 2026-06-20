import type { AiInsight } from './types'

export type ObservationInput = {
  note: string
  hasPhoto: boolean
  hasVoice?: boolean
}

type Lens = {
  match: RegExp
  scene: string
  view: string
  question: string
}

const LENSES: Lens[] = [
  {
    match: /(通学|電車|駅|バス|歩|道|帰り道|コンビニ|自転車)/,
    scene: '移動の途中に残った景色',
    view: '明日の通学では、目的地までの距離ではなく、途中で一度だけ目に残るものを探す',
    question: 'いつもの道で、なぜそこだけ目が止まったのか。',
  },
  {
    match: /(空|雲|雨|風|光|夕方|朝|夜|水たまり|影|天気)/,
    scene: '空気や光の変化',
    view: '明日の通学では、空や影を時計のように見てみる',
    question: '時間は、どんな色や明るさで見えていたか。',
  },
  {
    match: /(声|話|友達|先生|家族|人|会話|電話|LINE|音)/,
    scene: '誰かの声や気配',
    view: '明日の通学では、人の言葉より、声の高さや間の長さを聞いてみる',
    question: '言葉の内容より長く残った音は何か。',
  },
  {
    match: /(疲|眠|だる|焦|不安|嫌|つら|静か|ぼーっと)/,
    scene: '体や気分の重さ',
    view: '明日の通学では、元気かどうかではなく、体がどの速さで朝に追いつくかを見る',
    question: '体がまだ起きていない時間は、どんな景色を選んでいたか。',
  },
  {
    match: /(嬉|楽|安心|好き|きれい|面白|笑|落ち着|よかった)/,
    scene: '気持ちが少し動いた瞬間',
    view: '明日の通学では、気分が少し軽くなる場所を地図の目印にしてみる',
    question: 'その軽さは、場所から来たのか、人から来たのか。',
  },
]

const DEFAULT_LENS: Lens = {
  match: /.*/,
  scene: '記録に残った小さな違和感',
  view: '明日の通学では、いつもの景色の中で昨日と違う一点だけを探す',
  question: 'なぜ、その一点だけが記憶に残ったのか。',
}

function cleanNote(note: string): string {
  return note.replace(/\s+/g, ' ').trim()
}

function pickLens(note: string): Lens {
  return LENSES.find((lens) => lens.match.test(note)) ?? DEFAULT_LENS
}

function photoSignal(hasPhoto: boolean): string {
  return hasPhoto
    ? '写真に切り取ったもの'
    : '写真にしなかったまま残ったもの'
}

function voiceSignal(hasVoice?: boolean): string {
  return hasVoice
    ? '声に出したときの間や揺れ'
    : '声にしなかった余白'
}

function extractFragment(note: string, lens: Lens): string {
  const fragments = note
    .split(/[。！？!?、,.，\n]/)
    .map((fragment) => fragment.trim())
    .filter(Boolean)
  const matched = fragments.find((fragment) => lens.match.test(fragment))
  const picked = matched ?? fragments[0]

  if (!picked) return lens.scene
  return picked.length > 28 ? `${picked.slice(0, 27)}…` : picked
}

export function createObservationJson(input: ObservationInput): AiInsight {
  const note = cleanNote(input.note)
  const lens = pickLens(note)
  const fragment = extractFragment(note, lens)
  const photo = photoSignal(input.hasPhoto)
  const voice = voiceSignal(input.hasVoice)

  const sentence = `今日の${photo}と${voice}は、「${fragment}」をただの出来事ではなく、${lens.view}ための手がかりにしていました。`

  return {
    discovery: `${photo}と${voice}の両方に、${lens.scene}が残っていました。`,
    margin: '写真を選んで、声を残すまでのあいだにあった小さな観察',
    key: lens.question,
    sentence,
  }
}

export async function observeDay(input: ObservationInput): Promise<AiInsight> {
  await new Promise((resolve) => setTimeout(resolve, 1100))

  return createObservationJson(input)
}
