import type { AiInsight } from './types'

/**
 * AIが今日の記録を「観察」したように見せるためのモック実装。
 * 励ましやアドバイスではなく、本人が見落としていた小さな事実を拾う観察者のトーン。
 * 実際の生成AIに差し替える前提のダミー。
 */

type Pattern = {
  match: RegExp
  margin: string
  key: string
}

// ノートに含まれる言葉から「余白」と「発見の鍵」を観察する
const PATTERNS: Pattern[] = [
  {
    match: /(コンビニ|アイス|寄り道|帰り道|帰る|帰って)/,
    margin: '練習後の、帰り道の数分',
    key: '明日は、練習のあとに少し気がゆるむ瞬間を探してみてください。',
  },
  {
    match: /(朝練|早起き|眠|ねむ|だるい|起き)/,
    margin: 'まだ誰もいない、朝のいちばん静かな時間',
    key: '明日は、目が覚めて最初に見た景色を覚えておいてください。',
  },
  {
    match: /(同期|先輩|後輩|仲間|チーム|みんな|話)/,
    margin: '誰かと並んで歩いた、言葉の少ない時間',
    key: '明日は、誰かの何気ない一言を一つだけ覚えてみてください。',
  },
  {
    match: /(空|雲|夕|夜|月|星|風|雨|晴)/,
    margin: '見上げたときの、ほんの少しの間',
    key: '明日は、移動のあいだに空を一度だけ見上げてみてください。',
  },
  {
    match: /(きつ|つら|しんど|疲|追い込|ハード|筋肉)/,
    margin: '力を抜いて、息を整えていた数十秒',
    key: '明日は、いちばん力を抜けた瞬間がいつだったか探してみてください。',
  },
  {
    match: /(食|飯|ごはん|弁当|お腹|腹)/,
    margin: '何かを口にして、ひと息ついた時間',
    key: '明日は、いちばん美味しかったものを一つだけ思い出してみてください。',
  },
]

const DEFAULT_PATTERN: Pattern = {
  match: /.*/,
  margin: '何でもない時間の、すきま',
  key: '明日は、いつもの道のどこかにある小さな違いを探してみてください。',
}

function pickPattern(note: string): Pattern {
  return PATTERNS.find((p) => p.match.test(note)) ?? DEFAULT_PATTERN
}

// 「特に何もない」と書いた人ほど、何かを覚えている、という観察
function buildDiscovery(note: string): string {
  const said = /(特に何もない|普通の日|いつも通り|なんもない|何もない|平凡)/.test(
    note,
  )
  if (/(コンビニ|アイス|寄り道)/.test(note)) {
    return said
      ? '「特に何もない」と言いながら、あなたは帰り道の寄り道を覚えていました。'
      : 'あなたは、帰り道のささやかな寄り道のことを、ちゃんと書き留めていました。'
  }
  if (/(同期|先輩|後輩|仲間|話)/.test(note)) {
    return said
      ? '「いつも通り」と言いながら、あなたは誰かと過ごした時間を覚えていました。'
      : 'あなたが覚えていたのは、技術や記録ではなく、誰かと過ごした時間でした。'
  }
  if (/(空|雲|夕|夜|月|星)/.test(note)) {
    return said
      ? '「何もない」と言いながら、あなたは空を見上げた一瞬を覚えていました。'
      : 'あなたは練習の合間に、空のことをちゃんと覚えていました。'
  }
  if (said) {
    return 'あなたは「特に何もない」と言いながら、その一日をここに残そうとしました。'
  }
  return 'あなたが書き留めたのは、結果ではなく、その日のなかのちいさな出来事でした。'
}

// 「今日の一文」を観察的に組み立てる
function buildSentence(note: string): string {
  if (/(コンビニ|アイス|寄り道|帰り道)/.test(note)) {
    return '何もない日にも、帰り道だけは少し違っていた。'
  }
  if (/(朝練|眠|起き)/.test(note)) {
    return '眠い朝の向こうに、まだ誰も使っていない一日があった。'
  }
  if (/(同期|先輩|後輩|仲間|話)/.test(note)) {
    return '同じ練習のなかに、誰かと過ごした時間がまぎれていた。'
  }
  if (/(空|雲|夕|夜|月|星)/.test(note)) {
    return '見上げた空は、昨日とは少しだけ違う色をしていた。'
  }
  if (/(きつ|つら|しんど|疲)/.test(note)) {
    return 'きつい一日の端に、力を抜けた数秒がちゃんとあった。'
  }
  return 'いつもと同じ一日に、覚えておきたい何かが一つだけあった。'
}

/**
 * 記録を観察してAIインサイトを返す（モック）。
 * 非同期にして、本物のAI呼び出しに差し替えやすくしてある。
 */
export async function observeDay(input: {
  note: string
  hasPhoto: boolean
}): Promise<AiInsight> {
  // それっぽい「考えている時間」
  await new Promise((resolve) => setTimeout(resolve, 1400))

  const note = input.note.trim()
  const pattern = pickPattern(note)

  return {
    discovery: buildDiscovery(note),
    margin: pattern.margin,
    key: pattern.key,
    sentence: buildSentence(note),
  }
}
