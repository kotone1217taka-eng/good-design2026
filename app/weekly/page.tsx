'use client'

import type { ReactNode } from 'react'
import { AppShell } from '@/components/app-shell'
import { RecordImage } from '@/components/record-image'
import { useRecords } from '@/lib/records-store'
import {
  buildWeeklySummary,
  getLastSevenDayRecords,
  type WeeklyTrend,
} from '@/lib/weekly'
import { formatDateShort } from '@/lib/date'

export default function WeeklyPage() {
  const { records, today } = useRecords()
  const summary = buildWeeklySummary(records, today)
  const week = getLastSevenDayRecords(records, today)

  return (
    <AppShell>
      <div className="flex flex-col gap-7">
        <header className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.2em] text-muted-foreground">
            WEEKLY OBSERVATION
          </p>
          <h1 className="font-serif text-2xl font-light tracking-wide text-foreground">
            週の観察
          </h1>
          {summary && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {summary.rangeLabel} の記録から、話題・写真・声の傾向を見ています。
            </p>
          )}
        </header>

        {!summary ? (
          <p className="text-sm text-muted-foreground">
            まだ記録がありません。
          </p>
        ) : (
          <>
            <div className="flex gap-1.5 overflow-hidden rounded-xl">
              {week
                .slice()
                .reverse()
                .map((record) => (
                  <div key={record.id} className="flex flex-1 flex-col gap-1">
                    <div className="relative aspect-square w-full overflow-hidden rounded-md">
                      <RecordImage
                        src={record.photo || '/placeholder.svg'}
                        alt={`${formatDateShort(record.date)}の写真`}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-center text-[9px] tracking-wide text-muted-foreground">
                      {formatDateShort(record.date)}
                    </span>
                  </div>
                ))}
            </div>

            <WeeklyCard label="多かった話題">
              {summary.topicTrends.length ? (
                <BubbleList trends={summary.topicTrends} />
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  まだ話題のまとまりは見えていません。
                </p>
              )}
            </WeeklyCard>

            <WeeklyCard label="写真の傾向">
              {summary.photoTrends.length ? (
                <BubbleList trends={summary.photoTrends} />
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  まだ写真の色や構図の傾向は見えていません。
                </p>
              )}
            </WeeklyCard>

            <WeeklyCard label="声に出ていた関心">
              {summary.voiceTrends.length ? (
                <BubbleList trends={summary.voiceTrends} />
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  この期間には、まだ音声から読める関心がありません。
                </p>
              )}
            </WeeklyCard>

            <WeeklyCard label="観察の断片">
              <ul className="flex flex-col gap-2">
                {summary.observations.map((observation) => (
                  <li
                    key={observation}
                    className="flex items-start gap-2.5 text-[15px] leading-relaxed text-pretty text-card-foreground"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60"
                      aria-hidden="true"
                    />
                    {observation}
                  </li>
                ))}
              </ul>
            </WeeklyCard>

            <WeeklyCard label="週のインサイト">
              {summary.insights.length ? (
                <ul className="flex flex-col gap-3">
                  {summary.insights.map((insight) => (
                    <li
                      key={insight}
                      className="rounded-2xl bg-secondary px-4 py-3 text-[15px] leading-relaxed text-pretty text-secondary-foreground"
                    >
                      {insight}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  まだインサイトにできるまとまりはありません。
                </p>
              )}
            </WeeklyCard>
          </>
        )}
      </div>
    </AppShell>
  )
}

function WeeklyCard({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card px-6 py-5">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </h2>
      {children}
    </section>
  )
}

function BubbleList({ trends }: { trends: WeeklyTrend[] }) {
  return (
    <ul className="flex flex-wrap gap-2.5">
      {trends.map((trend) => (
        <li
          key={trend}
          className="relative rounded-[1.25rem] border border-primary/20 bg-accent px-4 py-2.5 text-sm leading-relaxed text-accent-foreground shadow-sm before:absolute before:-bottom-1 before:left-5 before:size-2.5 before:rotate-45 before:border-b before:border-r before:border-primary/20 before:bg-accent"
        >
          {trend}
        </li>
      ))}
    </ul>
  )
}
