'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import { RecordImage } from '@/components/record-image'
import { formatDateJP } from '@/lib/date'
import type { DayRecord } from '@/lib/types'

export function PhotoCalendar({ records }: { records: DayRecord[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const sortedRecords = useMemo(
    () =>
      [...records]
        .filter((record) => record.photo)
        .sort((a, b) => {
          const dateOrder = a.date.localeCompare(b.date)
          if (dateOrder !== 0) return dateOrder
          return a.createdAt.localeCompare(b.createdAt)
        }),
    [records],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [sortedRecords.length])

  return (
    <section className="min-h-[70dvh] bg-black" aria-label="Memory">
      <div className="grid grid-cols-3 gap-px bg-black">
        {sortedRecords.map((record) => (
          <Link
            key={record.id}
            href={`/records/${record.id}`}
            aria-label={`${formatDateJP(record.date)}の写真を見る`}
            className="group relative aspect-square overflow-hidden bg-black"
          >
            <RecordImage
              src={record.photo}
              alt={`${formatDateJP(record.date)}の写真`}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        ))}
      </div>
      <div ref={bottomRef} />
    </section>
  )
}
