'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, Images, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { PhotoUpload } from '@/components/photo-upload'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-store'
import { formatDateJP } from '@/lib/date'
import { useRecords } from '@/lib/records-store'
import type { DayRecord, PhotoInput } from '@/lib/types'

export function CaptureScreen() {
  const router = useRouter()
  const { today, todayRecord, addRecord } = useRecords()
  const { configured, loading: authLoading, user, signInWithGoogle } = useAuth()
  const [photo, setPhoto] = useState<PhotoInput | null>(null)
  const [captureSession, setCaptureSession] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function resetPhoto() {
    setPhoto(null)
    setCaptureSession((current) => current + 1)
    setError('')
  }

  async function savePhoto() {
    if (!photo || saving || authLoading || !configured || !user) return

    setSaving(true)
    setError('')

    const record: DayRecord = {
      id: `rec-${today}`,
      date: today,
      createdAt: todayRecord?.createdAt ?? new Date().toISOString(),
      photo: photo.src,
      hasPhoto: true,
    }

    try {
      const savedRecord = await addRecord(record)
      router.push(`/records/${savedRecord.id}`)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '写真を保存できませんでした。',
      )
      setSaving(false)
    }
  }

  const saveLabel = todayRecord ? '今日の1枚を更新する' : '今日の1枚として保存'

  return (
    <div className="flex min-h-dvh justify-center bg-neutral-950">
      <main className="relative h-dvh w-full max-w-md overflow-hidden bg-neutral-950 text-white">
        <PhotoUpload
          key={captureSession}
          onChange={setPhoto}
          disabled={saving}
          autoStart
          variant="immersive"
          title="撮る"
          className="absolute inset-0"
        />

        <div className="pointer-events-none absolute inset-x-4 top-4 z-40 flex items-center justify-between gap-3">
          <div className="pointer-events-auto rounded-full bg-black/35 px-3 py-2 text-[11px] tracking-wide text-white/80 backdrop-blur-md">
            {formatDateJP(today)}
          </div>
          <Link
            href="/records"
            className="pointer-events-auto inline-flex h-10 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-transform active:scale-95"
          >
            <Images className="size-4" aria-hidden="true" />
            メモリー
          </Link>
        </div>

        {!photo && (
          <div className="pointer-events-none absolute inset-x-6 bottom-24 z-30 flex flex-col items-center gap-2 text-center">
            <span className="rounded-full bg-black/35 px-3 py-1.5 text-[11px] tracking-wide text-white/75 backdrop-blur-md">
              アプリを開くと、そのままカメラが起動します
            </span>
            {todayRecord && (
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-foreground shadow-lg">
                今日の1枚は保存済み。撮ると上書きできます。
              </span>
            )}
          </div>
        )}

        {photo && (
          <div className="absolute inset-x-4 bottom-4 z-40 flex flex-col gap-2">
            {error && (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/20 px-4 py-2 text-xs leading-relaxed text-white">
                {error}
              </p>
            )}

            {!configured && (
              <p className="rounded-2xl bg-black/55 px-4 py-3 text-xs leading-relaxed text-white/80 backdrop-blur-md">
                Firebaseの設定がないため、写真を保存できません。
              </p>
            )}

            {configured && !user && !authLoading ? (
              <Button
                type="button"
                size="lg"
                className="h-12 rounded-2xl text-sm font-normal tracking-wide"
                onClick={signInWithGoogle}
              >
                <Camera className="size-4" aria-hidden="true" />
                サインインして保存
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void savePhoto()}
                disabled={!photo || saving || authLoading || !configured || !user}
                size="lg"
                className="h-12 rounded-2xl text-sm font-normal tracking-wide"
              >
                {saving || authLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {authLoading ? '確認しています' : '保存しています'}
                  </>
                ) : (
                  saveLabel
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-2xl text-xs font-normal"
              onClick={resetPhoto}
              disabled={saving}
            >
              もう一度撮る
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
