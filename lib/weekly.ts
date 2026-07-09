import type { DayRecord } from './types'
import {
  getInsightComment,
  getInsightInteresting,
  getInsightStandout,
} from './insight-display'
import { formatDateShort, getTodayIso } from './date'

export type WeeklyTrend = string

export type WeeklySummary = {
  topicTrends: WeeklyTrend[]
  photoTrends: WeeklyTrend[]
  voiceTrends: WeeklyTrend[]
  insights: string[]
  observations: string[]
  voiceFragments: string[]
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

function ranked(values: string[], max: number): string[] {
  const counts = new Map<string, number>()
  values.forEach((value) => {
    const cleaned = value.trim()
    if (!cleaned) return
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1)
  })

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value)
    .slice(0, max)
}

function buildTrends(values: string[], max = 4): WeeklyTrend[] {
  return ranked(values, max)
}

function buildInsights({
  topicTrends,
  photoTrends,
  voiceTrends,
  observations,
}: {
  topicTrends: WeeklyTrend[]
  photoTrends: WeeklyTrend[]
  voiceTrends: WeeklyTrend[]
  observations: string[]
}): string[] {
  const insights: string[] = []
  const topic = topicTrends[0]
  const nextTopic = topicTrends[1]
  const photo = photoTrends[0]
  const nextPhoto = photoTrends[1]
  const voice = voiceTrends[0]

  if (topic && photo) {
    insights.push(
      `「${topic}」という関心と、「${photo}」という写り方が近くに出ている。何を撮ったかだけでなく、どう見えたかも残っている週。`,
    )
  }

  if (voice && topic) {
    insights.push(
      `声の中の「${voice}」が、写真の中の「${topic}」をあとから指差している。`,
    )
  }

  if (photo && nextPhoto) {
    insights.push(
      `写真では「${photo}」と「${nextPhoto}」が並んでいる。主役よりも、光や配置のくせが記憶に残りやすい。`,
    )
  }

  if (!insights.length && topic && nextTopic) {
    insights.push(
      `今週は「${topic}」と「${nextTopic}」が近い場所にある。別々の写真でも、似たところに目が止まっている。`,
    )
  }

  if (!insights.length && observations[0]) {
    insights.push(
      `最初に残っているのは「${compact(observations[0], 28)}」。大きな出来事より、小さな違和感から記録が始まっている。`,
    )
  }

  return insights.slice(0, 3)
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
  const topicTrends = buildTrends(week.flatMap(collectTopicWords))
  const photoTrends = buildTrends(week.flatMap(collectPhotoTrendWords))
  const voiceTrends = buildTrends(voiceFragments, 3)
  const insights = buildInsights({
    topicTrends,
    photoTrends,
    voiceTrends,
    observations,
  })

  return {
    topicTrends,
    photoTrends,
    voiceTrends,
    insights,
    observations,
    voiceFragments,
    rangeLabel,
  }
}
