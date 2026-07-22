'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { RecordImage } from '@/components/record-image'
import { Button } from '@/components/ui/button'
import {
  CALENDAR_WEEKDAYS_JP,
  addMonths,
  formatDateJP,
  formatMonthJP,
  getMonthCalendarDates,
  getMonthKey,
} from '@/lib/date'
import { cn } from '@/lib/utils'
import type { DayRecord } from '@/lib/types'

export function PhotoCalendar({
  records,
  today,
  controls = false,
  compact = false,
}: {
  records: DayRecord[]
  today: string
  controls?: boolean
  compact?: boolean
}) {
  const [month, setMonth] = useState(() => getMonthKey(today))
  const monthDates = useMemo(() => getMonthCalendarDates(month), [month])
  const recordsByDate = useMemo(
    () => new Map(records.map((record) => [record.date, record])),
    [records],
  )

  return (
    <section className="flex flex-col gap-3" aria-label="写真カレンダー">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium tracking-wide text-foreground">
            {formatMonthJP(month)}
          </h2>
          <p className="text-xs text-muted-foreground">
            写真がある日だけ、日付が小さな絵日記になります。
          </p>
        </div>
        {controls && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="前の月"
              onClick={() => setMonth((current) => addMonths(current, -1))}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="次の月"
              onClick={() => setMonth((current) => addMonths(current, 1))}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted-foreground">
        {CALENDAR_WEEKDAYS_JP.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {monthDates.map((date) => {
          const record = recordsByDate.get(date)
          const inMonth = getMonthKey(date) === month
          const day = Number(date.slice(-2))
          const isToday = date === today

          if (record) {
            return (
              <Link
                key={date}
                href={`/records/${record.id}`}
                aria-label={`${formatDateJP(date)}の写真を見る`}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-lg border bg-card',
                  isToday ? 'border-primary ring-2 ring-primary/25' : 'border-border',
                  !inMonth && 'opacity-55',
                )}
              >
                <RecordImage
                  src={record.photo}
                  alt={`${formatDateJP(date)}の写真`}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-1 top-1 rounded-full bg-black/45 px-1.5 py-0.5 font-mono text-[10px] leading-none text-white backdrop-blur-sm">
                  {day}
                </span>
              </Link>
            )
          }

          return (
            <div
              key={date}
              aria-label={`${formatDateJP(date)}は未記録`}
              className={cn(
                'relative aspect-square rounded-lg border border-dashed border-border bg-muted/35',
                !inMonth && 'opacity-25',
                isToday && 'border-primary bg-accent/35',
              )}
            >
              <span className="absolute left-1.5 top-1.5 font-mono text-[10px] leading-none text-muted-foreground">
                {day}
              </span>
              {!compact && inMonth && (
                <span className="absolute bottom-1 left-1 right-1 truncate text-center text-[9px] text-muted-foreground/70">
                  未記録
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
