'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, Home, ImageIcon, Mic, Sparkles, Volume2 } from 'lucide-react'
import { AiObservation } from '@/components/ai-observation'
import { AppShell } from '@/components/app-shell'
import { InsightKeywords } from '@/components/insight-keywords'
import { Button } from '@/components/ui/button'
import { RecordImage } from '@/components/record-image'
import { useRecords } from '@/lib/records-store'
import { formatDateJP } from '@/lib/date'

function compact(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

export function FeedbackClient({ id }: { id: string }) {
  const { getById, loading } = useRecords()
  const record = getById(id)

  if (loading) {
    return (
      <AppShell showNav={false}>
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          記録を読み込んでいます。
        </div>
      </AppShell>
    )
  }

  if (!record) notFound()

  return (
    <AppShell showNav={false}>
      <div className="flex flex-col gap-7">
        <header className="flex flex-col items-center gap-2 pt-2 text-center">
          <span className="text-[11px] tracking-[0.22em] text-muted-foreground">
            {formatDateJP(record.date)}
          </span>
          <h1 className="font-serif text-xl font-light tracking-wide text-foreground">
            AIが写真を見て思ったこと
          </h1>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-[5/4] w-full">
            <RecordImage
              src={record.photo || '/placeholder.svg'}
              alt="保存した写真"
              className="object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
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

        <div className="flex flex-col gap-2.5">
          <Button asChild size="lg" className="h-12 rounded-2xl font-normal">
            <Link href="/">
              <Home className="size-4" aria-hidden="true" />
              ホームに戻る
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="rounded-xl font-normal text-muted-foreground"
          >
            <Link href="/records">
              <BookOpen className="size-4" aria-hidden="true" />
              これまでの記録を見る
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
