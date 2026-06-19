'use client'

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Home, BookOpen } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { InsightBlock } from '@/components/insight-block'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
            今日を、観察しました
          </h1>
        </header>

        {/* 写真 */}
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={withBasePath(record.photo || '/placeholder.svg')}
            alt="今日の写真"
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
            priority
          />
        </div>

        {/* 観察結果 */}
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card px-6 py-7">
          <InsightBlock label="今日の発見">
            {record.insight.discovery}
          </InsightBlock>
          <Separator />
          <InsightBlock label="今日の余白">
            {record.insight.margin}
          </InsightBlock>
          <Separator />
          <InsightBlock label="発見の鍵">{record.insight.key}</InsightBlock>
          <Separator />
          <InsightBlock label="今日の一文" emphasis>
            {record.insight.sentence}
          </InsightBlock>
        </div>

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
