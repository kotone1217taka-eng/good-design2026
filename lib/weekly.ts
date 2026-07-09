import type { DayRecord } from './types'
import {
  getInsightComment,
  getInsightInteresting,
  getInsightStandout,
} from './insight-display'
import { formatDateShort, getTodayIso } from './date'

export type WeeklyTrend = {
  title: string
  detail: string
}

export type WeeklySummary = {
  topicTrends: WeeklyTrend[]
  photoTrends: WeeklyTrend[]
  voiceTrends: WeeklyTrend[]
  observations: string[]
  voiceFragments: string[]
  tendency: string
  rangeLabel: string
}

function compact(value: string, maxLength = 14): string {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned
}

function collectTopicWords(record: DayRecord): string[] {
  return [
    ...(record.insight.keywords?.photo ?? []),
    ...(record.insight.keywords?.voice ?? []),
    ...getInsightStandout(record.insight),
    ...getInsightInteresting(record.insight),
  ]
    .map((word) => compact(word, 18))
    .filter(Boolean)
}

function collectPhotoTrendWords(record: DayRecord): string[] {
  const photo = record.photoAnalysis
  return [
    photo?.tone ? `${photo.tone}の色味` : undefined,
    photo?.brightness ? `${photo.brightness}光` : undefined,
    photo?.focalArea ? `${photo.focalArea}に視線が寄る` : undefined,
    photo?.edgeDetail,
    photo?.microDetail,
  ]
    .map((word) => compact(word ?? '', 20))
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

function ranked(values: string[], max: number): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>()
  values.forEach((value) => {
    const cleaned = value.trim()
    if (!cleaned) return
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1)
  })

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
}

function trendDetail(kind: 'topic' | 'photo' | 'voice', count: number): string {
  if (kind === 'topic') {
    return count >= 2
      ? '複数の記録で近い関心として出ています。'
      : 'この週の見返しで最初に引っかかる話題です。'
  }

  if (kind === 'photo') {
    return count >= 2
      ? '写真の写り方として繰り返し現れています。'
      : '写真の雰囲気を読むための手がかりです。'
  }

  return count >= 2
    ? '声の中で繰り返し出ていた関心です。'
    : '写真だけでは見えにくい、本人の反応です。'
}

function buildTrends(
  values: string[],
  kind: 'topic' | 'photo' | 'voice',
  max = 4,
): WeeklyTrend[] {
  return ranked(values, max).map(({ value, count }) => ({
    title: value,
    detail: trendDetail(kind, count),
  }))
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

  const observations = week
    .flatMap((record) => [
      getInsightComment(record.insight),
      ...getInsightInteresting(record.insight),
    ])
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 5)

  const voiceFragments = unique(week.flatMap(collectVoiceFragments), 6)
  const topicTrends = buildTrends(week.flatMap(collectTopicWords), 'topic')
  const photoTrends = buildTrends(week.flatMap(collectPhotoTrendWords), 'photo')
  const voiceTrends = buildTrends(voiceFragments, 'voice', 3)
  const topicLine = topicTrends.length
    ? `話題は「${topicTrends.map((trend) => trend.title).slice(0, 2).join('」「')}」あたりに集まっています。`
    : '話題のまとまりは、まだはっきり出ていません。'
  const photoLine = photoTrends.length
    ? `写真は「${photoTrends.map((trend) => trend.title).slice(0, 2).join('」「')}」が目立ちます。`
    : '写真の色や構図の傾向は、まだ読み取り中です。'
  const voiceLine = voiceTrends.length
    ? `声では「${voiceTrends[0].title}」が、何を面白いと感じたかを補っています。`
    : '声から読み取れる関心は、まだ少なめです。'

  const tendency = `${topicLine}${photoLine}${voiceLine}`

  return {
    topicTrends,
    photoTrends,
    voiceTrends,
    observations,
    voiceFragments,
    tendency,
    rangeLabel,
  }
}
