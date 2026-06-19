'use client'

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mic } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { InsightBlock } from '@/components/insight-block'
import { Separator } from '@/components/ui/separator'
import { useRecords } from '@/lib/records-store'
import { withBasePath } from '@/lib/base-path'
import { formatDateJP } from '@/lib/date'

export function RecordDetailClient({ id }: { id: string }) {
  const { getById } = useRecords()
  const record = getById(id)

  if (!record) notFound()

  return (
    <AppShell>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Link
            href="/records"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            一覧
          </Link>
          <span className="text-xs tracking-[0.18em] text-muted-foreground">
            {formatDateJP(record.date)}
          </span>
        </div>

        {/* 写真 */}
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={withBasePath(record.photo || '/placeholder.svg')}
            alt={`${formatDateJP(record.date)}の写真`}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
            priority
          />
        </div>

        {/* 声 / 文字起こし */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {record.hasVoice ? (
              <>
                <Mic className="size-3.5" aria-hidden="true" />
                声の記録
              </>
            ) : (
              'その日の記録'
            )}
          </div>
          <p className="text-[15px] leading-relaxed text-pretty text-card-foreground">
            {record.note}
          </p>
        </section>

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
      </div>
    </AppShell>
  )
}
