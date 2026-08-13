'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PhotoCalendar } from '@/components/photo-calendar'
import { WeekCollage } from '@/components/week-collage'
import { Button } from '@/components/ui/button'
import {
  addDays,
  getWeekStartIso,
  parseIso,
  toIso,
} from '@/lib/date'
import { useRecords } from '@/lib/records-store'
import { getWeekPhotoSummary } from '@/lib/weekly'

export default function MemoryPage() {
  const { records, today, loading, error } = useRecords()
  const [posterWeek, setPosterWeek] = useState(today)
  const weekSummary = getWeekPhotoSummary(records, posterWeek)
  const currentWeekStart = getWeekStartIso(today)
  const posterWeekStart = getWeekStartIso(posterWeek)
  const isCurrentWeek = posterWeekStart === currentWeekStart

  function moveWeek(amount: number) {
    setPosterWeek((current) => toIso(addDays(parseIso(current), amount * 7)))
  }

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
              写真がある日も、ない日も、同じ大きさのマスとして残ります。
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

        <PhotoCalendar records={records} today={today} />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="rounded-full"
              aria-label="前の週のポスター"
              onClick={() => moveWeek(-1)}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant={isCurrentWeek ? 'ghost' : 'secondary'}
              className="h-8 rounded-full px-4 text-xs font-normal"
              disabled={isCurrentWeek}
              onClick={() => setPosterWeek(today)}
            >
              {isCurrentWeek ? '今週' : '今週へ'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="rounded-full"
              aria-label="次の週のポスター"
              disabled={isCurrentWeek}
              onClick={() => moveWeek(1)}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <WeekCollage
            slots={weekSummary.slots}
            rangeLabel={weekSummary.progress.rangeLabel}
          />
        </section>
      </div>
    </AppShell>
  )
}
