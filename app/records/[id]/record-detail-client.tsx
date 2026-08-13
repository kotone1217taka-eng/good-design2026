'use client'

import { useState } from 'react'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PhotoUpload } from '@/components/photo-upload'
import { RecordImage } from '@/components/record-image'
import { Button } from '@/components/ui/button'
import { formatDateJP, formatTimeJP } from '@/lib/date'
import { useRecords } from '@/lib/records-store'
import type { DayRecord, PhotoInput, PhotoLocation } from '@/lib/types'

function formatLocation(location: PhotoLocation | undefined): string {
  if (!location) return '位置情報なし'

  const latitude = location.latitude.toFixed(5)
  const longitude = location.longitude.toFixed(5)
  return `${latitude}, ${longitude}`
}

export function RecordDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { getById, loading, addRecord, deleteRecord } = useRecords()
  const record = getById(id)
  const [editing, setEditing] = useState(false)
  const [photo, setPhoto] = useState<PhotoInput | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          メモリーを読み込んでいます。
        </div>
      </AppShell>
    )
  }

  if (!record) notFound()

  async function saveReplacement() {
    if (!record || !photo || saving) return

    setSaving(true)
    setError('')
    const nextRecord: DayRecord = {
      id: record.id,
      date: record.date,
      createdAt: new Date().toISOString(),
      photo: photo.src,
      hasPhoto: true,
      location: record.location,
    }

    try {
      await addRecord(nextRecord)
      setEditing(false)
      setPhoto(null)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '写真を保存できませんでした。',
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeRecord() {
    if (!record || deleting) return
    const confirmed = window.confirm(`${formatDateJP(record.date)}の写真を削除しますか？`)
    if (!confirmed) return

    setDeleting(true)
    setError('')
    try {
      await deleteRecord(record.id)
      router.push('/records')
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '写真を削除できませんでした。',
      )
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link
          href="/records"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          メモリー
        </Link>

        {!editing ? (
          <section className="overflow-hidden rounded-lg bg-black">
            <div className="relative aspect-[4/5] w-full">
              <RecordImage
                src={record.photo}
                alt={`${formatDateJP(record.date)}の写真`}
                className="object-cover"
                priority
              />
            </div>
            <div className="grid grid-cols-3 gap-px bg-neutral-900 text-white">
              <InfoItem label="撮影日" value={formatDateJP(record.date)} />
              <InfoItem label="撮影時間" value={formatTimeJP(record.createdAt)} />
              <InfoItem label="撮影場所" value={formatLocation(record.location)} />
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <PhotoUpload
              onChange={setPhoto}
              disabled={saving}
              autoStart
              title={`${formatDateJP(record.date)}の写真`}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-11 flex-1 rounded-xl font-normal"
                onClick={() => {
                  setEditing(false)
                  setPhoto(null)
                  setError('')
                }}
              >
                閉じる
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl font-normal"
                disabled={!photo || saving}
                onClick={() => void saveReplacement()}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    保存中
                  </>
                ) : (
                  '差し替える'
                )}
              </Button>
            </div>
          </section>
        )}

        {error && (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-xl font-normal"
            disabled={saving || deleting}
            onClick={() => {
              setEditing((current) => !current)
              setPhoto(null)
              setError('')
            }}
          >
            <Pencil className="size-4" aria-hidden="true" />
            編集
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 rounded-xl font-normal"
            disabled={saving || deleting}
            onClick={() => void removeRecord()}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
            削除
          </Button>
        </div>
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
