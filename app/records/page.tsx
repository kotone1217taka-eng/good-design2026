'use client'

import Link from 'next/link'
import { Camera } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PhotoCalendar } from '@/components/photo-calendar'
import { WeekCollage } from '@/components/week-collage'
import { Button } from '@/components/ui/button'
import { useRecords } from '@/lib/records-store'
import { getWeekPhotoSummary } from '@/lib/weekly'

export default function MemoryPage() {
  const { records, today, loading, error } = useRecords()
  const weekSummary = getWeekPhotoSummary(records, today)

  return (
    <AppShell>
      <div className="flex flex-col gap-7">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs tracking-[0.2em] text-muted-foreground">
              MEMORY
            </p>
            <h1 className="font-serif text-2xl font-light tracking-wide text-foreground">
              メモリー
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              撮った写真だけが、日付ごとに静かに残ります。
            </p>
          </div>
          <Button asChild size="icon-lg" className="rounded-full">
            <Link href="/" aria-label="撮る">
              <Camera className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        </header>

        {loading && (
          <p className="rounded-2xl border border-border bg-card px-5 py-6 text-center text-sm text-muted-foreground">
            メモリーを読み込んでいます。
          </p>
        )}
        {error && (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-card-foreground">
                今週のメモリー
              </h2>
              <p className="text-xs text-muted-foreground">
                {weekSummary.progress.rangeLabel}
              </p>
            </div>
            <span className="font-mono text-xl text-foreground">
              {weekSummary.progress.recorded}/7
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${weekSummary.progress.percent}%` }}
            />
          </div>
          <WeekCollage slots={weekSummary.slots} />
        </section>

        <PhotoCalendar records={records} today={today} controls />
      </div>
    </AppShell>
  )
}
