'use client'

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ImageIcon, Mic, Sparkles, TrainFront } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
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

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-[5/4] w-full">
            <Image
              src={withBasePath(record.photo || '/placeholder.svg')}
              alt={`${formatDateJP(record.date)}の写真`}
              fill
              sizes="(max-width: 448px) 100vw, 448px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />
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

            <p className="font-serif text-[1.25rem] font-light leading-relaxed tracking-wide text-balance text-card-foreground">
              {record.insight.sentence}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            source note
          </h2>
          <p className="text-[15px] leading-relaxed text-pretty text-card-foreground">
            {record.note}
          </p>
        </section>
      </div>
    </AppShell>
  )
}
