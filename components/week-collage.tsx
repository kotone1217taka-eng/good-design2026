'use client'

import Link from 'next/link'
import { RecordImage } from '@/components/record-image'
import { formatDateShort } from '@/lib/date'
import type { WeekDiarySlot } from '@/lib/weekly'
import { cn } from '@/lib/utils'

const posterSlots = [
  'left-[6%] top-[13%] h-[25%] w-[39%] -rotate-2',
  'right-[7%] top-[11%] h-[19%] w-[29%] rotate-3',
  'right-[5%] top-[33%] h-[24%] w-[36%] -rotate-1',
  'left-[7%] top-[40%] h-[26%] w-[28%] rotate-2',
  'left-[36%] top-[58%] h-[23%] w-[31%] -rotate-3',
  'bottom-[6%] left-[7%] h-[21%] w-[30%] -rotate-1',
  'bottom-[5%] right-[5%] h-[24%] w-[24%] rotate-2',
] as const

export function WeekCollage({
  slots,
  rangeLabel,
  className,
}: {
  slots: WeekDiarySlot[]
  rangeLabel: string
  className?: string
}) {
  const recorded = slots.filter((slot) => slot.record).length
  const complete = recorded === slots.length

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-[11px] font-medium tracking-[0.24em] text-muted-foreground">
            WEEK POSTER
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{rangeLabel}</p>
        </div>
        <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground">
          {recorded}/7 DAYS
        </p>
      </div>

      <div
        className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        aria-label="WEEK POSTER"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgb(255 255 255 / 0.74), rgb(241 247 239 / 0.94)), repeating-linear-gradient(0deg, rgb(34 52 42 / 0.045) 0 1px, transparent 1px 24px)',
        }}
      >
        {complete && (
          <span className="absolute right-5 top-5 z-20 rotate-6 rounded-md border border-primary/45 bg-card/80 px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-primary shadow-sm backdrop-blur-sm">
            COMPLETE
          </span>
        )}

        <div className="absolute left-[12%] top-[30%] h-px w-[68%] rotate-6 border-t border-dashed border-foreground/12" />
        <div className="absolute left-[15%] top-[55%] h-px w-[70%] -rotate-8 border-t border-dashed border-foreground/12" />
        <div className="absolute bottom-[19%] left-[20%] h-px w-[58%] rotate-3 border-t border-dashed border-foreground/12" />

        {slots.map((slot, index) => (
          <PosterPhoto
            key={slot.date}
            slot={slot}
            className={posterSlots[index] ?? posterSlots[0]}
          />
        ))}
      </div>
    </section>
  )
}

function PosterPhoto({
  slot,
  className,
}: {
  slot: WeekDiarySlot
  className: string
}) {
  const label = `${slot.weekday} ${formatDateShort(slot.date)}`
  const frameClassName = cn(
    'absolute z-10 rounded-md border bg-card p-1 shadow-[0_8px_18px_rgb(34_52_42_/_0.14)] transition-transform duration-300',
    slot.record
      ? 'border-white hover:z-20 hover:scale-[1.03]'
      : 'border-dashed border-foreground/18 bg-white/45 shadow-none',
    className,
  )
  const content = (
    <>
      <div className="relative h-full overflow-hidden rounded-[4px] bg-muted">
        {slot.record ? (
          <RecordImage
            src={slot.record.photo}
            alt={`${label}の写真`}
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-12deg, rgb(34 52 42 / 0.08) 0 1px, transparent 1px 12px)',
            }}
          />
        )}
        {!slot.record && (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
            空白
          </span>
        )}
      </div>
      <span className="absolute -top-2 left-2 rounded-[4px] bg-white/90 px-2 py-0.5 text-[10px] leading-none text-foreground shadow-sm">
        {label}
      </span>
    </>
  )

  if (slot.record) {
    return (
      <Link
        href={`/records/${slot.record.id}`}
        className={frameClassName}
        aria-label={`${label}の写真を見る`}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={frameClassName} aria-label={`${label}は未記録`}>
      {content}
    </div>
  )
}
