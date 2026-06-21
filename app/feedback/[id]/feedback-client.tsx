'use client'

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { BookOpen, Home, ImageIcon, Mic, Sparkles, TrainFront } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { useRecords } from '@/lib/records-store'
import { withBasePath } from '@/lib/base-path'
import { formatDateJP } from '@/lib/date'

export function FeedbackClient({ id }: { id: string }) {
  const { getById } = useRecords()
  const record = getById(id)

  if (!record) notFound()

  return (
    <AppShell showNav={false}>
      <div className="flex flex-col gap-7">
        <header className="flex flex-col items-center gap-2 pt-2 text-center">
          <span className="text-[11px] tracking-[0.22em] text-muted-foreground">
            {formatDateJP(record.date)}
          </span>
          <h1 className="font-serif text-xl font-light tracking-wide text-foreground">
            明日の通学に残す一文
          </h1>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-[5/4] w-full">
            <Image
              src={withBasePath(record.photo || '/placeholder.svg')}
              alt="今日の写真"
              fill
              sizes="(max-width: 448px) 100vw, 448px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
              <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[11px] tracking-wide backdrop-blur-sm">
                <Sparkles className="size-3.5" aria-hidden="true" />
                AI analysis
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[11px] tracking-wide backdrop-blur-sm">
                <TrainFront className="size-3.5" aria-hidden="true" />
                commute
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5 px-6 py-7">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
                <ImageIcon className="size-3.5" aria-hidden="true" />
                {record.photoAnalysis
                  ? `${record.photoAnalysis.brightness}・${record.photoAnalysis.tone}`
                  : record.hasPhoto === false
                    ? '写真なし'
                  : '写真'}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
                <Mic className="size-3.5" aria-hidden="true" />
                {record.voiceAnalysis
                  ? `${record.voiceAnalysis.durationSeconds}秒・${record.voiceAnalysis.pace}`
                  : record.hasVoice
                    ? '音声あり'
                    : '音声なし'}
              </span>
            </div>

            <p className="font-serif text-[1.35rem] font-light leading-relaxed tracking-wide text-balance text-card-foreground">
              {record.insight.sentence}
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-2.5">
          <Button asChild size="lg" className="h-13 rounded-2xl font-normal">
            <Link href="/">
              <Home className="size-4" aria-hidden="true" />
              ホームに戻る
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="rounded-xl font-normal text-muted-foreground"
          >
            <Link href="/records">
              <BookOpen className="size-4" aria-hidden="true" />
              これまでの記録を見る
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
