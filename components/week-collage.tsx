'use client'

import Link from 'next/link'
import { RecordImage } from '@/components/record-image'
import { formatDateShort } from '@/lib/date'
import type { WeekDiarySlot } from '@/lib/weekly'
import { cn } from '@/lib/utils'

export function WeekCollage({
  slots,
  className,
}: {
  slots: WeekDiarySlot[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-sm',
        className,
      )}
      aria-label="今週の絵日記"
    >
      <div className="grid grid-cols-7 gap-1">
        {slots.map((slot) => {
          const label = `${slot.weekday} ${formatDateShort(slot.date)}`
          const content = (
            <>
              {slot.record ? (
                <RecordImage
                  src={slot.record.photo}
                  alt={`${label}の写真`}
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-muted/45" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-1 pb-1 pt-5 text-center text-[9px] leading-none text-white">
                {slot.weekday}
              </div>
              {!slot.record && (
                <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[9px] text-muted-foreground">
                  空白
                </span>
              )}
            </>
          )

          if (slot.record) {
            return (
              <Link
                key={slot.date}
                href={`/records/${slot.record.id}`}
                className="relative aspect-[3/4] overflow-hidden rounded-md"
                aria-label={`${label}の写真を見る`}
              >
                {content}
              </Link>
            )
          }

          return (
            <div
              key={slot.date}
              className="relative aspect-[3/4] overflow-hidden rounded-md border border-dashed border-border"
              aria-label={`${label}は未記録`}
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
