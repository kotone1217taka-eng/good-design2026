'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, CalendarDays, Camera, Check, Mic } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { RecordImage } from '@/components/record-image'
import { Button } from '@/components/ui/button'
import { useRecords } from '@/lib/records-store'
import { formatDateJP, formatDateShort } from '@/lib/date'
import {
  getInsightComment,
  getInsightInteresting,
} from '@/lib/insight-display'

export default function HomePage() {
  const { records, todayRecord, loading, error } = useRecords()
  const latest = records[0]
  const recentThree = records.slice(0, 3)
  const voiceCount = records.filter(
    (record) => record.hasAudio || record.hasVoice,
  ).length
  const photoCount = records.filter(
    (record) => record.hasPhoto !== false && record.photo,
  ).length

  return (
    <AppShell>
      <div className="flex flex-col gap-9">
        <header className="flex flex-col gap-3">
          <p className="text-xs tracking-[0.2em] text-muted-foreground">
            PERSONAL PHOTO OBSERVATION
          </p>
          <h1 className="font-serif text-3xl font-light tracking-wide text-foreground">
            30秒の観察
          </h1>
          <p className="max-w-[19rem] text-sm leading-relaxed text-pretty text-muted-foreground">
            アプリを開いたら、その場で面白いと思ったものを撮る。AIが写真を見て、気づいたことを個人的な記録として残します。
          </p>
        </header>

        <section className="grid grid-cols-3 gap-2">
          <StatCard
            icon={<CalendarDays className="mb-2 size-4 text-muted-foreground" />}
            value={records.length}
            label="days"
          />
          <StatCard
            icon={<Camera className="mb-2 size-4 text-muted-foreground" />}
            value={photoCount}
            label="photo"
          />
          <StatCard
            icon={<Mic className="mb-2 size-4 text-muted-foreground" />}
            value={voiceCount}
            label="voice"
          />
        </section>

        {loading && (
          <p className="rounded-2xl border border-border bg-card px-5 py-5 text-center text-sm text-muted-foreground">
            記録を読み込んでいます。
          </p>
        )}

        {error && (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {todayRecord ? (
          <Link
            href={`/records/${todayRecord.id}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Check className="size-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-card-foreground">
                  この日の観察は保存済みです
                </span>
                <span className="text-xs text-muted-foreground">
                  写真とAIの観察結果をひらく
                </span>
              </div>
            </div>
            <ArrowRight
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </Link>
        ) : (
          <Button
            asChild
            size="lg"
            className="h-14 rounded-2xl text-base font-normal tracking-wide"
          >
            <Link href="/record">
              30秒の記録を始める
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}

        {latest && (
          <section
            aria-labelledby="latest-heading"
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="relative aspect-[16/9] w-full">
              <RecordImage
                src={latest.photo || '/placeholder.svg'}
                alt="直近の記録の写真"
                className="object-cover"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 to-transparent" />
              <span className="absolute bottom-3 left-4 text-xs tracking-wide text-white/90">
                {formatDateJP(latest.date)}
              </span>
            </div>
            <div className="flex flex-col gap-4 px-5 py-5">
              <h2 id="latest-heading" className="text-sm font-medium tracking-wide text-foreground">
                直近のAI観察
              </h2>
              <p className="font-serif text-lg font-light leading-relaxed text-pretty text-card-foreground">
                {getInsightComment(latest.insight)}
              </p>
              {getInsightInteresting(latest.insight)[0] && (
                <p className="rounded-xl bg-secondary px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
                  {getInsightInteresting(latest.insight)[0]}
                </p>
              )}
            </div>
          </section>
        )}

        <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2
              id="recent-heading"
              className="text-sm font-medium tracking-wide text-foreground"
            >
              最近の記録
            </h2>
            <Link
              href="/records"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              すべて見る
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recentThree.map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <RecordImage
                    src={record.photo || '/placeholder.svg'}
                    alt={`${formatDateJP(record.date)}の写真`}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {(record.hasAudio || record.hasVoice) && (
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/35">
                      <Mic className="size-3 text-white" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <span className="text-center text-[11px] tracking-wide text-muted-foreground">
                  {formatDateShort(record.date)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode
  value: number
  label: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3">
      {icon}
      <p className="font-mono text-xl text-foreground">{value}</p>
      <p className="text-[10px] tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}
