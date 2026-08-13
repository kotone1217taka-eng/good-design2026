'use client'

import { notFound, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { RecordImage } from '@/components/record-image'
import { formatDateJP, formatTimeJP } from '@/lib/date'
import { useRecords } from '@/lib/records-store'
import type { PhotoLocation } from '@/lib/types'

function formatLocation(location: PhotoLocation | undefined): string {
  if (!location) return '位置情報なし'

  const latitude = location.latitude.toFixed(5)
  const longitude = location.longitude.toFixed(5)
  return `${latitude}, ${longitude}`
}

export function RecordDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { getById, loading } = useRecords()
  const record = getById(id)

  if (loading) {
    return (
      <AppShell showAuth={false}>
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          メモリーを読み込んでいます。
        </div>
      </AppShell>
    )
  }

  if (!record) notFound()

  return (
    <AppShell showAuth={false}>
      <div className="-mx-5 -mb-10 flex flex-col">
        <div className="px-5 pb-3">
          <button
            type="button"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => router.push('/records')}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Memory
          </button>
        </div>

        <section className="bg-black">
          <div className="relative aspect-[3/4] w-full bg-black">
            <RecordImage
              src={record.photo}
              alt={`${formatDateJP(record.date)}の写真`}
              className="object-contain"
              priority
            />
          </div>
          <div className="grid grid-cols-3 gap-px bg-neutral-900 text-white">
            <InfoItem label="撮影日" value={formatDateJP(record.date)} />
            <InfoItem label="撮影時間" value={formatTimeJP(record.createdAt)} />
            <InfoItem label="撮影場所" value={formatLocation(record.location)} />
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-black px-3 py-3">
      <p className="text-[10px] tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-1 truncate text-xs text-white">{value}</p>
    </div>
  )
}
