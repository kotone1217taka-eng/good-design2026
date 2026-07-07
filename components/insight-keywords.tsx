import { ImageIcon, Mic } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DayRecord } from '@/lib/types'

function compact(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function unique(values: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach((value) => {
    const cleaned = value?.replace(/\s+/g, ' ').trim()
    if (!cleaned || seen.has(cleaned)) return
    seen.add(cleaned)
    result.push(compact(cleaned, 14))
  })

  return result.slice(0, 6)
}

function fallbackPhotoKeywords(record: DayRecord): string[] {
  if (record.hasPhoto === false) return []

  return unique([
    record.photoAnalysis?.focalArea,
    record.photoAnalysis?.microDetail,
    record.photoAnalysis?.edgeDetail,
    record.photoAnalysis?.tone,
  ])
}

function fallbackVoiceKeywords(record: DayRecord): string[] {
  if (!record.hasVoice && !record.hasAudio) return []

  return unique([
    record.voiceAnalysis?.transcript,
    record.voiceAnalysis?.texture,
    record.voiceAnalysis?.pace,
  ])
}

export function InsightKeywords({ record }: { record: DayRecord }) {
  const photoKeywords = record.insight.keywords?.photo?.length
    ? record.insight.keywords.photo
    : fallbackPhotoKeywords(record)
  const voiceKeywords = record.insight.keywords?.voice?.length
    ? record.insight.keywords.voice
    : fallbackVoiceKeywords(record)

  if (!photoKeywords.length && !voiceKeywords.length) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        読み取れたキーワード
      </h2>
      <KeywordRow
        icon={<ImageIcon className="size-3.5" aria-hidden="true" />}
        label="写真"
        keywords={photoKeywords}
      />
      <KeywordRow
        icon={<Mic className="size-3.5" aria-hidden="true" />}
        label="音声"
        keywords={voiceKeywords}
      />
    </section>
  )
}

function KeywordRow({
  icon,
  label,
  keywords,
}: {
  icon: ReactNode
  label: string
  keywords: string[]
}) {
  if (!keywords.length) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={`${label}-${keyword}`}
            className="rounded-full bg-secondary px-3 py-1.5 text-xs leading-none text-secondary-foreground"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  )
}
