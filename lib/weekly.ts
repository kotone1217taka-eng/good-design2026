import type { DayRecord } from './types'
import {
  getInsightComment,
  getInsightInteresting,
  getInsightStandout,
} from './insight-display'

export type WeeklySummary = {
  words: { word: string; count: number }[]
  observations: string[]
  tendency: string
  comment: string
}

function compact(value: string, maxLength = 14): string {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned
}

function collectWords(record: DayRecord): string[] {
  return [
    ...(record.insight.keywords?.photo ?? []),
    ...(record.insight.keywords?.voice ?? []),
    ...getInsightStandout(record.insight),
    ...getInsightInteresting(record.insight),
  ]
    .map((word) => compact(word))
    .filter(Boolean)
}

export function buildWeeklySummary(records: DayRecord[]): WeeklySummary | null {
  const week = records.slice(0, 7)
  if (!week.length) return null

  const counts = new Map<string, number>()
  week.flatMap(collectWords).forEach((word) => {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  })

  const words = [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const observations = week
    .flatMap((record) => [
      getInsightComment(record.insight),
      ...getInsightInteresting(record.insight),
    ])
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 5)

  const topWord = words[0]?.word
  const photoDays = week.filter((record) => record.hasPhoto !== false).length
  const voiceDays = week.filter(
    (record) => record.hasAudio || record.hasVoice,
  ).length

  const tendency = topWord
    ? `この週は「${topWord}」のような細部が何度か現れています。大きな出来事より、画面の端や色の変化に反応している記録が多めです。`
    : 'この週は、写真に写った細部を少しずつ集めるような記録になっています。'

  const comment =
    voiceDays > 0
      ? `${photoDays}枚の写真に、${voiceDays}件の音声が重なっています。写真だけでは残らない空気も少し混ざった週です。`
      : `${photoDays}枚の写真が並んでいます。言葉より先に、目が引っかかったものが残った週です。`

  return {
    words,
    observations,
    tendency,
    comment,
  }
}
