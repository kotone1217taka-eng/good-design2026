'use client'

import { AppShell } from '@/components/app-shell'
import { useRecords } from '@/lib/records-store'
import { buildWeeklySummary } from '@/lib/weekly'
import { withBasePath } from '@/lib/base-path'
import { formatDateShort } from '@/lib/date'

export default function WeeklyPage() {
  const { records } = useRecords()
  const summary = buildWeeklySummary(records)
  const week = records.slice(0, 7)

  return (
    <AppShell>
      <div className="flex flex-col gap-7">
        <header className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.2em] text-muted-foreground">
            この1週間を、観察する
          </p>
          <h1 className="font-serif text-2xl font-light tracking-wide text-foreground">
            週のふりかえり
          </h1>
        </header>

        {!summary ? (
          <p className="text-sm text-muted-foreground">
            まだ記録がありません。
          </p>
        ) : (
          <>
            {/* 一週間の写真の帯 */}
            <div className="flex gap-1.5 overflow-hidden rounded-xl">
              {week
                .slice()
                .reverse()
                .map((r) => (
                  <div key={r.id} className="flex flex-1 flex-col gap-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={withBasePath(r.photo || '/placeholder.svg')}
                      alt={`${formatDateShort(r.date)}の写真`}
                      className="aspect-square w-full rounded-md object-cover"
                    />
                    <span className="text-center text-[9px] tracking-wide text-muted-foreground">
                      {formatDateShort(r.date)}
                    </span>
                  </div>
                ))}
            </div>

            {/* 今週よく出た言葉 */}
            <WeeklyCard label="今週よく出た言葉">
              <ul className="flex flex-col gap-2.5">
                {summary.words.map((w) => (
                  <li key={w.word} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm text-card-foreground">
                      {w.word}
                    </span>
                    <span className="flex flex-1 items-center gap-1.5">
                      {Array.from({ length: w.count }).map((_, i) => (
                        <span
                          key={i}
                          className="h-2 flex-1 rounded-full bg-primary/55"
                          aria-hidden="true"
                        />
                      ))}
                      {Array.from({ length: 7 - w.count }).map((_, i) => (
                        <span
                          key={`e-${i}`}
                          className="h-2 flex-1 rounded-full bg-secondary"
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                    <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                      {w.count}
                    </span>
                  </li>
                ))}
              </ul>
            </WeeklyCard>

            {/* 今週の余白 */}
            <WeeklyCard label="今週の余白">
              <ul className="flex flex-col gap-2">
                {summary.margins.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[15px] leading-relaxed text-pretty text-card-foreground"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60"
                      aria-hidden="true"
                    />
                    {m}
                  </li>
                ))}
              </ul>
            </WeeklyCard>

            {/* 今週の発見の傾向 */}
            <WeeklyCard label="今週の発見の傾向">
              <p className="text-[15px] leading-relaxed text-pretty text-card-foreground">
                {summary.tendency}
              </p>
            </WeeklyCard>

            {/* 今週の一文 */}
            <div className="rounded-2xl border border-border bg-accent/40 px-6 py-8 text-center">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                今週の一文
              </span>
              <p className="mt-3 font-serif text-xl font-light leading-relaxed text-balance text-foreground">
                {summary.sentence}
              </p>
            </div>
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
  children: React.ReactNode
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
