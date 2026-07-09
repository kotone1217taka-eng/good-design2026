import type { DayRecord } from './types'
import {
  getInsightComment,
  getInsightInteresting,
  getInsightStandout,
} from './insight-display'
import { formatDateShort, getTodayIso } from './date'

export type WeeklySummary = {
  words: { word: string; count: number }[]
  observations: string[]
  voiceFragments: string[]
  tendency: string
  comment: string
  rangeLabel: string
  dayCount: number
  photoDays: number
  voiceDays: number
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

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function collectVoiceFragments(record: DayRecord): string[] {
  const voice = record.voiceAnalysis
  const transcriptParts = cleanTranscript(voice?.transcript)
    .split(/[、。,.!?！？\n]/)
    .map((part) => compact(part, 20))
    .filter(Boolean)

  return [
    ...(record.insight.keywords?.voice ?? []),
    voice?.texture,
    voice?.pace,
    ...transcriptParts,
  ]
    .map((value) => compact(value ?? '', 20))
    .filter(Boolean)
}

function cleanTranscript(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function unique(values: string[], max: number): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach((value) => {
    const cleaned = value.trim()
    if (!cleaned || seen.has(cleaned)) return
    seen.add(cleaned)
    result.push(cleaned)
  })

  return result.slice(0, max)
}

export function getLastSevenDayRecords(
  records: DayRecord[],
  today = getTodayIso(),
): DayRecord[] {
  const end = toDate(today)
  const start = addDays(end, -6)

  return records
    .filter((record) => {
      const date = toDate(record.date)
      return date >= start && date <= end
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function buildWeeklySummary(
  records: DayRecord[],
  today = getTodayIso(),
): WeeklySummary | null {
  const week = getLastSevenDayRecords(records, today)
  if (!week.length) return null
  const startIso = toIso(addDays(toDate(today), -6))
  const rangeLabel = `${formatDateShort(startIso)} - ${formatDateShort(today)}`

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

  const voiceFragments = unique(week.flatMap(collectVoiceFragments), 6)
  const topWord = words[0]?.word
  const photoDays = week.filter((record) => record.hasPhoto !== false).length
  const voiceDays = week.filter(
    (record) => record.hasAudio || record.hasVoice,
  ).length

  const tendency =
    week.length >= 2 && topWord
      ? `直近7日間では「${topWord}」のような細部が繰り返し現れています。日によって主役は違っても、端の色や小さな違和感に視線が戻っています。`
      : topWord
        ? `直近7日間の記録はまだ${week.length}日分です。今は「${topWord}」が、この週を読み始める最初の手がかりになっています。`
        : `直近7日間の記録はまだ${week.length}日分です。写真に写った細部を、これから少しずつ集めていく段階です。`

  const comment =
    voiceDays > 0
      ? `直近7日間のうち${week.length}日分、${photoDays}枚の写真と${voiceDays}件の声が残っています。声に出た言葉も、写真の見方を変える材料として読み込んでいます。`
      : `直近7日間のうち${week.length}日分、${photoDays}枚の写真が残っています。声が入ると、写真の外側にあった反応も週の分析に加わります。`

  return {
    words,
    observations,
    voiceFragments,
    tendency,
    comment,
    rangeLabel,
    dayCount: week.length,
    photoDays,
    voiceDays,
  }
}
