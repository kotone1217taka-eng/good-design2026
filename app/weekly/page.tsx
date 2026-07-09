'use client'

import type { ReactNode } from 'react'
import { AppShell } from '@/components/app-shell'
import { RecordImage } from '@/components/record-image'
import { useRecords } from '@/lib/records-store'
import { buildWeeklySummary, getLastSevenDayRecords } from '@/lib/weekly'
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
              {summary.rangeLabel} の7日間から、保存されている
              {summary.dayCount}日分を読み取っています。
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

            <WeeklyCard label="よく出たキーワード">
              {summary.words.length ? (
                <ul className="flex flex-col gap-2.5">
                  {summary.words.map((word) => (
                    <li key={word.word} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-sm text-card-foreground">
                        {word.word}
                      </span>
                      <span className="flex flex-1 items-center gap-1.5">
                        {Array.from({ length: Math.min(word.count, 7) }).map(
                          (_, index) => (
                            <span
                              key={index}
                              className="h-2 flex-1 rounded-full bg-primary/55"
                              aria-hidden="true"
                            />
                          ),
                        )}
                        {Array.from({ length: Math.max(0, 7 - word.count) }).map(
                          (_, index) => (
                            <span
                              key={`empty-${index}`}
                              className="h-2 flex-1 rounded-full bg-secondary"
                              aria-hidden="true"
                            />
                          ),
                        )}
                      </span>
                      <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                        {word.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  まだ比較できるキーワードがありません。
                </p>
              )}
            </WeeklyCard>

            <WeeklyCard label="声から拾った手がかり">
              {summary.voiceFragments.length ? (
                <ul className="flex flex-wrap gap-2">
                  {summary.voiceFragments.map((fragment) => (
                    <li
                      key={fragment}
                      className="rounded-full bg-accent px-3 py-1.5 text-xs leading-relaxed text-accent-foreground"
                    >
                      {fragment}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  この7日間には、まだ音声から読める手がかりがありません。
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

            <WeeklyCard label="今週の傾向">
              <p className="text-[15px] leading-relaxed text-pretty text-card-foreground">
                {summary.tendency}
              </p>
            </WeeklyCard>

            <div className="rounded-2xl border border-border bg-accent/40 px-6 py-8 text-center">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                保存された空気
              </span>
              <p className="mt-3 font-serif text-lg font-light leading-relaxed text-balance text-foreground">
                {summary.comment}
              </p>
              <p className="mt-4 text-xs tracking-wide text-muted-foreground">
                写真 {summary.photoDays}日分 / 音声 {summary.voiceDays}日分
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
