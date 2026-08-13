'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { RecordImage } from '@/components/record-image'
import {
  addDays,
  formatDateJP,
  formatDateShort,
  getMonthKey,
  parseIso,
  toIso,
} from '@/lib/date'
import type { DayRecord } from '@/lib/types'
import { cn } from '@/lib/utils'

const minimumVisibleDays = 84

export function PhotoCalendar({
  records,
  today,
}: {
  records: DayRecord[]
  today: string
  controls?: boolean
  compact?: boolean
}) {
  const days = useMemo(() => {
    const todayDate = parseIso(today)
    const oldestRecordDate = records.reduce<Date | null>((oldest, record) => {
      const date = parseIso(record.date)
      if (!oldest || date < oldest) return date
      return oldest
    }, null)
    const minimumStart = addDays(todayDate, -(minimumVisibleDays - 1))
    const startDate =
      oldestRecordDate && oldestRecordDate < minimumStart
        ? oldestRecordDate
        : minimumStart
    const count =
      Math.floor((todayDate.getTime() - startDate.getTime()) / 86400000) + 1

    return Array.from({ length: count }, (_, index) =>
      toIso(addDays(todayDate, -index)),
    )
  }, [records, today])

  const recordsByDate = useMemo(
    () => new Map(records.map((record) => [record.date, record])),
    [records],
  )

  return (
    <section className="flex flex-col gap-3" aria-label="画像一覧">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[11px] font-medium tracking-[0.24em] text-muted-foreground">
            PHOTO GRID
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            写真がない日は黒いマスとして残ります。
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {records.length}/{days.length}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-px bg-black">
        {days.map((date, index) => {
          const record = recordsByDate.get(date)
          const showMonth = index === 0 || getMonthKey(date) !== getMonthKey(days[index - 1])
          const dayLabel = showMonth ? formatDateShort(date) : date.slice(-2)

          if (record) {
            return (
              <Link
                key={date}
                href={`/records/${record.id}`}
                aria-label={`${formatDateJP(date)}の写真を見る`}
                className="group relative aspect-square overflow-hidden bg-black"
              >
                <RecordImage
                  src={record.photo}
                  alt={`${formatDateJP(date)}の写真`}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-1 top-1 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-[10px] leading-none text-white backdrop-blur-sm">
                  {dayLabel}
                </span>
              </Link>
            )
          }

          return (
            <div
              key={date}
              aria-label={`${formatDateJP(date)}は未記録`}
              className={cn(
                'relative aspect-square bg-black',
                date === today && 'ring-1 ring-inset ring-primary/70',
              )}
            >
              <span className="absolute left-1 top-1 rounded-sm bg-white/8 px-1.5 py-0.5 font-mono text-[10px] leading-none text-white/45">
                {dayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
