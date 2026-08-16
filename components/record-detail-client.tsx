'use client'

import { useEffect, useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { RecordImage } from '@/components/record-image'
import { formatDateJP, formatTimeJP } from '@/lib/date'
import { useRecords } from '@/lib/records-store'
import { reverseGeocodeLocationName } from '@/lib/reverse-geocode'
import type { DayRecord } from '@/lib/types'
import { cn } from '@/lib/utils'

function getLocationLabel(
  record: DayRecord,
  resolvedLocationName: string,
  resolvingLocationName: boolean,
): string {
  if (record.locationName) return record.locationName
  if (resolvedLocationName) return resolvedLocationName
  if (record.location && resolvingLocationName) return '場所を取得中'
  return '場所情報なし'
}

export function RecordDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { getById, loading, addRecord } = useRecords()
  const record = getById(id)
  const [resolvedLocationName, setResolvedLocationName] = useState('')
  const [resolvingLocationName, setResolvingLocationName] = useState(false)

  useEffect(() => {
    if (!record?.location || record.locationName) return

    let active = true
    setResolvingLocationName(true)
    setResolvedLocationName('')

    reverseGeocodeLocationName(record.location)
      .then(async (locationName) => {
        if (!active || !locationName) return
        setResolvedLocationName(locationName)
        await addRecord({
          ...record,
          locationName,
        })
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setResolvingLocationName(false)
      })

    return () => {
      active = false
    }
  }, [addRecord, record])

  if (loading) {
    return (
      <AppShell showAuth={false}>
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          フトショットを読み込んでいます。
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
            フトショット
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
          <div className="grid grid-cols-2 gap-px bg-neutral-900 text-white">
            <InfoItem label="撮影日" value={formatDateJP(record.date)} />
            <InfoItem label="撮影時間" value={formatTimeJP(record.createdAt)} />
            <InfoItem
              label="撮影場所"
              value={getLocationLabel(
                record,
                resolvedLocationName,
                resolvingLocationName,
              )}
              className="col-span-2"
              multiline
            />
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function InfoItem({
  label,
  value,
  className,
  multiline = false,
}: {
  label: string
  value: string
  className?: string
  multiline?: boolean
}) {
  return (
    <div className={cn('min-w-0 bg-black px-3 py-3', className)}>
      <p className="text-[10px] tracking-[0.18em] text-white/45">{label}</p>
      <p
        className={cn(
          'mt-1 text-xs text-white',
          multiline ? 'leading-relaxed' : 'truncate',
        )}
      >
        {value}
      </p>
    </div>
  )
}
