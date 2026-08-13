'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { RecordImage } from '@/components/record-image'
import {
  addDays,
  formatDateJP,
  formatMonthDot,
  parseIso,
  toIso,
} from '@/lib/date'
import type { DayRecord } from '@/lib/types'
import { cn } from '@/lib/utils'

const minimumVisibleDays = 84

type MemoryGridItem =
  | {
      type: 'month'
      key: string
      label: string
    }
  | {
      type: 'day'
      date: string
      record: DayRecord | undefined
    }

export function PhotoCalendar({
  records,
  today,
}: {
  records: DayRecord[]
  today: string
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const recordsByDate = useMemo(
    () => new Map(records.map((record) => [record.date, record])),
    [records],
  )
  const items = useMemo<MemoryGridItem[]>(() => {
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
    const dayCount =
      Math.floor((todayDate.getTime() - startDate.getTime()) / 86400000) + 1
    const nextItems: MemoryGridItem[] = []
    let currentMonth = ''

    for (let index = 0; index < dayCount; index += 1) {
      const date = toIso(addDays(startDate, index))
      const month = date.slice(0, 7)

      if (month !== currentMonth) {
        currentMonth = month
        nextItems.push({
          type: 'month',
          key: `month-${month}`,
          label: formatMonthDot(date),
        })
      }

      nextItems.push({
        type: 'day',
        date,
        record: recordsByDate.get(date),
      })
    }

    return nextItems
  }, [records, recordsByDate, today])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [items.length])

  return (
    <section className="min-h-[70dvh] bg-black" aria-label="Memory">
      <div className="grid grid-cols-4 gap-px bg-black">
        {items.map((item) => {
          if (item.type === 'month') {
            return (
              <div
                key={item.key}
                className="col-span-4 bg-black px-2 py-2 font-mono text-[11px] tracking-[0.18em] text-white/55"
              >
                {item.label}
              </div>
            )
          }

          const day = String(Number(item.date.slice(-2)))
          if (item.record) {
            return (
              <Link
                key={item.date}
                href={`/records/${item.record.id}`}
                aria-label={`${formatDateJP(item.date)}の写真を見る`}
                className="group relative aspect-square overflow-hidden bg-black"
              >
                <RecordImage
                  src={item.record.photo}
                  alt={`${formatDateJP(item.date)}の写真`}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <DateBadge>{day}</DateBadge>
              </Link>
            )
          }

          return (
            <div
              key={item.date}
              aria-label={`${formatDateJP(item.date)}は未記録`}
              className={cn(
                'relative aspect-square bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
                item.date === today && 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]',
              )}
            >
              <DateBadge muted>{day}</DateBadge>
            </div>
          )
        })}
      </div>
      <div ref={bottomRef} />
    </section>
  )
}

function DateBadge({
  children,
  muted = false,
}: {
  children: ReactNode
  muted?: boolean
}) {
  return (
    <span
      className={cn(
        'absolute left-1 top-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] leading-none backdrop-blur-sm',
        muted
          ? 'bg-white/5 text-white/35'
          : 'bg-black/50 text-white',
      )}
    >
      {children}
    </span>
  )
}
