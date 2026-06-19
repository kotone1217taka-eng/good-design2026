import type { DayRecord } from './types'

export type WeeklySummary = {
  count: number
  /** 今週よく出た言葉（頻度順） */
  words: { word: string; count: number }[]
  /** 今週の余白（記録から拾った余白の例） */
  margins: string[]
  /** 今週の発見の傾向 */
  tendency: string
  /** 今週の一文 */
  sentence: string
}

// 観察対象になりそうな言葉（Dear Data的に数える）
const WORD_BUCKETS: { word: string; match: RegExp }[] = [
  { word: '帰り道', match: /(帰り道|帰る|帰って|帰り)/ },
  { word: '朝', match: /(朝練|朝|早起き|起き)/ },
  { word: '空', match: /(空|雲|夕|夕焼け|月|星)/ },
  { word: '同期・先輩', match: /(同期|先輩|後輩|仲間|チーム)/ },
  { word: 'コンビニ', match: /(コンビニ|自販機|アイス|スポドリ)/ },
  { word: 'きつさ', match: /(きつ|つら|しんど|疲|追い込)/ },
  { word: '静けさ', match: /(静|誰もいない|ひとり|一人)/ },
]

export function buildWeeklySummary(records: DayRecord[]): WeeklySummary | null {
  const week = records.slice(0, 7)
  if (week.length === 0) return null

  const joined = week.map((r) => r.note).join(' ')

  const words = WORD_BUCKETS.map((b) => {
    const matches = week.filter((r) => b.match.test(r.note)).length
    return { word: b.word, count: matches }
  })
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  const margins = week
    .map((r) => r.insight.margin)
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .slice(0, 3)

  // 傾向の観察（よく出た言葉から）
  const top = words[0]?.word
  let tendency =
    'あなたは記録や結果よりも、その日の景色や時間を覚えていることが多いようです。'
  if (top === '帰り道' || top === 'コンビニ') {
    tendency =
      '今週のあなたは、練習そのものより「帰り道」を多く覚えていました。気がゆるむ時間を見つけるのが上手なのかもしれません。'
  } else if (top === '同期・先輩') {
    tendency =
      '今週のあなたは、ひとりの記録より「誰かと過ごした時間」をよく覚えていました。'
  } else if (top === '空') {
    tendency =
      '今週のあなたは、忙しさのなかでもよく空を見上げていました。'
  } else if (top === '朝') {
    tendency =
      '今週のあなたは、まだ誰もいない朝の静けさを何度も書き留めていました。'
  }

  // 今週の一文
  let sentence = '同じような毎日のなかに、覚えておきたい時間がいくつもあった。'
  if (/(空|夕|雲)/.test(joined) && /(帰り|コンビニ)/.test(joined)) {
    sentence = '帰り道の空ばかり、今週はよく覚えている。'
  } else if (/(同期|先輩|仲間)/.test(joined)) {
    sentence = '一人で走っているようで、誰かといた時間が残っていた。'
  }

  return {
    count: week.length,
    words,
    margins,
    tendency,
    sentence,
  }
}
