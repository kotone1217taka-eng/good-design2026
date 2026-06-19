import Link from 'next/link'
import Image from 'next/image'
import { Mic } from 'lucide-react'
import type { DayRecord } from '@/lib/types'
import { withBasePath } from '@/lib/base-path'
import { formatDateJP } from '@/lib/date'

/**
 * 記録一覧で使う1枚のカード。写真・日付・今日の一文。
 */
export function RecordCard({ record }: { record: DayRecord }) {
  return (
    <Link
      href={`/records/${record.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden">
        <Image
          src={withBasePath(record.photo || '/placeholder.svg')}
          alt={`${formatDateJP(record.date)}の写真`}
          fill
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-2 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-wide text-muted-foreground">
            {formatDateJP(record.date)}
          </span>
          {record.hasVoice && (
            <Mic className="size-3.5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <p className="font-serif text-[15px] font-light leading-relaxed text-pretty text-card-foreground">
          {record.insight.sentence}
        </p>
      </div>
    </Link>
  )
}
