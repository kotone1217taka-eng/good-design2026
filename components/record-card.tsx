import Link from 'next/link'
import { RecordImage } from '@/components/record-image'
import type { DayRecord } from '@/lib/types'
import { formatDateJP } from '@/lib/date'

export function RecordCard({ record }: { record: DayRecord }) {
  return (
    <Link
      href={`/records/${record.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden">
        <RecordImage
          src={record.photo || '/placeholder.svg'}
          alt={`${formatDateJP(record.date)}の写真`}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-1 px-4 py-3.5">
        <span className="text-xs tracking-wide text-muted-foreground">
          {formatDateJP(record.date)}
        </span>
        <p className="text-sm text-card-foreground">この日の1枚</p>
      </div>
    </Link>
  )
}
