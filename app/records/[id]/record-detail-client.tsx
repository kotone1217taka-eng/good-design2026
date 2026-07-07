'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ImageIcon, Mic, Sparkles, Volume2 } from 'lucide-react'
import { AiObservation } from '@/components/ai-observation'
import { AppShell } from '@/components/app-shell'
import { InsightKeywords } from '@/components/insight-keywords'
import { RecordImage } from '@/components/record-image'
import { useRecords } from '@/lib/records-store'
import { formatDateJP } from '@/lib/date'

function compact(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

export function RecordDetailClient({ id }: { id: string }) {
  const { getById, loading } = useRecords()
  const record = getById(id)

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          記録を読み込んでいます。
        </div>
      </AppShell>
    )
  }

  if (!record) notFound()

  return (
    <AppShell>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Link
            href="/records"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            一覧
          </Link>
          <span className="text-xs tracking-[0.18em] text-muted-foreground">
            {formatDateJP(record.date)}
          </span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-[5/4] w-full">
            <RecordImage
              src={record.photo || '/placeholder.svg'}
              alt={`${formatDateJP(record.date)}の写真`}
              className="object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
              <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[11px] tracking-wide backdrop-blur-sm">
                <Sparkles className="size-3.5" aria-hidden="true" />
                AI observation
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[11px] tracking-wide backdrop-blur-sm">
                <ImageIcon className="size-3.5" aria-hidden="true" />
                personal
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5 px-6 py-7">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
                <ImageIcon className="size-3.5" aria-hidden="true" />
                {record.photoAnalysis
                  ? record.photoAnalysis.microDetail ??
                    `${record.photoAnalysis.brightness}・${record.photoAnalysis.tone}`
                  : '写真'}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
                <Mic className="size-3.5" aria-hidden="true" />
                {record.voiceAnalysis
                  ? record.voiceAnalysis.transcript
                    ? `声: ${compact(record.voiceAnalysis.transcript, 14)}`
                    : `${record.voiceAnalysis.durationSeconds}秒・${
                        record.voiceAnalysis.texture ?? record.voiceAnalysis.pace
                      }`
                  : '音声なし'}
              </span>
            </div>

            {record.audio && (
              <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
                <Volume2 className="size-4 text-primary" aria-hidden="true" />
                <audio src={record.audio} controls className="h-8 flex-1" />
              </div>
            )}

            <InsightKeywords record={record} />
          </div>
        </section>

        <AiObservation record={record} />
      </div>
    </AppShell>
  )
}
