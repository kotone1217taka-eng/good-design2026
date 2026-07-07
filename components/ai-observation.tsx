import { Eye, Lightbulb, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DayRecord } from '@/lib/types'
import {
  getInsightAtmosphere,
  getInsightComment,
  getInsightInteresting,
  getInsightStandout,
} from '@/lib/insight-display'

export function AiObservation({ record }: { record: DayRecord }) {
  return (
    <section className="flex flex-col gap-4">
      <ObservationComment>{getInsightComment(record.insight)}</ObservationComment>
      <ObservationList
        icon={<Eye className="size-4" aria-hidden="true" />}
        title="写真の中で目立ったもの"
        items={getInsightStandout(record.insight)}
      />
      <ObservationList
        icon={<Lightbulb className="size-4" aria-hidden="true" />}
        title="面白いと感じたポイント"
        items={getInsightInteresting(record.insight)}
      />
      <ObservationList
        icon={<Sparkles className="size-4" aria-hidden="true" />}
        title="その場の雰囲気"
        items={getInsightAtmosphere(record.insight)}
      />
    </section>
  )
}

function ObservationComment({ children }: { children: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-5">
      <p className="font-serif text-lg font-light leading-relaxed text-pretty text-foreground">
        {children}
      </p>
    </div>
  )
}

function ObservationList({
  icon,
  title,
  items,
}: {
  icon: ReactNode
  title: string
  items: string[]
}) {
  if (!items.length) return null

  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={`${title}-${item}`}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
