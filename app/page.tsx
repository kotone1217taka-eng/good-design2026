'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, Check, Mic, Waves } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { InsightBlock } from '@/components/insight-block'
import { Button } from '@/components/ui/button'
import { useRecords } from '@/lib/records-store'
import { withBasePath } from '@/lib/base-path'
import { formatDateJP, formatDateShort } from '@/lib/date'

export default function HomePage() {
  const { records, todayRecord } = useRecords()
  const latest = records[0]
  const recentThree = records.slice(0, 3)
  const voiceCount = records.filter((record) => record.hasVoice).length
  const photoCount = records.filter((record) => record.photo).length

  return (
    <AppShell>
      <div className="flex flex-col gap-9">
        {/* タイトル */}
        <header className="flex flex-col gap-3">
          <p className="text-xs tracking-[0.2em] text-muted-foreground">
            もう朝だ、の前に。
          </p>
          <h1 className="font-serif text-3xl font-light tracking-wide text-foreground">
            きょうの余白
          </h1>
          <p className="max-w-[18rem] text-sm leading-relaxed text-pretty text-muted-foreground">
            1日1枚の写真と、少しの声を残す。
            <br />
            くりかえす毎日のなかの、小さな発見を見つけるために。
          </p>
        </header>

        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <CalendarDays
              className="mb-2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-mono text-xl text-foreground">{records.length}</p>
            <p className="text-[10px] tracking-wide text-muted-foreground">
              days
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <Mic
              className="mb-2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-mono text-xl text-foreground">{voiceCount}</p>
            <p className="text-[10px] tracking-wide text-muted-foreground">
              voice
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <Waves
              className="mb-2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-mono text-xl text-foreground">{photoCount}</p>
            <p className="text-[10px] tracking-wide text-muted-foreground">
              photo
            </p>
          </div>
        </section>

        {/* 今日を始める / 今日はもう残した */}
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
                  今日はもう残しました
                </span>
                <span className="text-xs text-muted-foreground">
                  きょうの観察をひらく
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
              今日の記録を始める
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}

        {/* 今日の発見カード（直近の観察） */}
        {latest && (
          <section
            aria-labelledby="discovery-heading"
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={withBasePath(latest.photo || '/placeholder.svg')}
                alt="直近の記録の写真"
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 to-transparent" />
              <span className="absolute bottom-3 left-4 text-xs tracking-wide text-white/90">
                {formatDateJP(latest.date)}の観察
              </span>
            </div>
            <div className="flex flex-col gap-4 px-5 py-5">
              <h2 id="discovery-heading" className="sr-only">
                直近の発見
              </h2>
              <InsightBlock label="発見">
                {latest.insight.discovery}
              </InsightBlock>
              <InsightBlock label="一文" emphasis>
                {latest.insight.sentence}
              </InsightBlock>
            </div>
          </section>
        )}

        {/* 直近3日分のプレビュー */}
        <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2
              id="recent-heading"
              className="text-sm font-medium tracking-wide text-foreground"
            >
              直近の記録
            </h2>
            <Link
              href="/records"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              すべて見る
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recentThree.map((r) => (
              <Link
                key={r.id}
                href={`/records/${r.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <Image
                    src={withBasePath(r.photo || '/placeholder.svg')}
                    alt={`${formatDateJP(r.date)}の写真`}
                    fill
                    sizes="150px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {r.hasVoice && (
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/35">
                      <Mic className="size-3 text-white" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <span className="text-center text-[11px] tracking-wide text-muted-foreground">
                  {formatDateShort(r.date)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
