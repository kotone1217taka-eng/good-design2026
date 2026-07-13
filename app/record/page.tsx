'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, RotateCcw } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PhotoUpload } from '@/components/photo-upload'
import {
  VoiceRecorder,
  type VoiceRecorderStatus,
} from '@/components/voice-recorder'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-store'
import { useRecords } from '@/lib/records-store'
import { observeDay, ObserveApiError } from '@/lib/observe-client'
import { formatDateJP } from '@/lib/date'
import { buildReactionProfile } from '@/lib/reaction-profile'
import type { DayRecord, PhotoInput, VoiceInput } from '@/lib/types'

const captureLimitSeconds = 30

export default function RecordPage() {
  const router = useRouter()
  const { records, today, todayRecord, addRecord } = useRecords()
  const { configured, loading: authLoading, user, signInWithGoogle } = useAuth()

  const [photo, setPhoto] = useState<PhotoInput | null>(null)
  const [voice, setVoice] = useState<VoiceInput | null>(null)
  const [voiceStatus, setVoiceStatus] = useState<VoiceRecorderStatus>('idle')
  const [voiceAutoStartKey, setVoiceAutoStartKey] = useState(0)
  const [captureSession, setCaptureSession] = useState(0)
  const [timeLeft, setTimeLeft] = useState(captureLimitSeconds)
  const [inputClosed, setInputClosed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const [aiError, setAiError] = useState('')

  const captureActive =
    !authLoading &&
    configured &&
    Boolean(user) &&
    (!todayRecord || isReplacing) &&
    !saving

  useEffect(() => {
    if (!captureActive || inputClosed) return

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setInputClosed(true)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [captureActive, inputClosed])

  function restartCapture() {
    setPhoto(null)
    setVoice(null)
    setVoiceStatus('idle')
    setVoiceAutoStartKey(0)
    setCaptureSession((current) => current + 1)
    setTimeLeft(captureLimitSeconds)
    setInputClosed(false)
    setAiError('')
  }

  function handlePhotoChange(nextPhoto: PhotoInput | null) {
    setPhoto(nextPhoto)
    setVoice(null)
    setVoiceStatus('idle')
    if (nextPhoto) {
      setVoiceAutoStartKey((current) => current + 1)
    } else {
      setVoiceAutoStartKey(0)
    }
  }

  if (authLoading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          アカウントを確認しています。
        </div>
      </AppShell>
    )
  }

  if (!configured || !user) {
    return (
      <AppShell>
        <div className="flex flex-col gap-6">
          <BackLink />
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <h1 className="font-serif text-xl font-light text-foreground">
              サインインすると記録できます
            </h1>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              写真と音声は、あなたのアカウントだけの個人的な記録として保存されます。
            </p>
            {configured ? (
              <Button
                type="button"
                className="rounded-xl"
                onClick={signInWithGoogle}
              >
                Googleでサインイン
              </Button>
            ) : (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
                Firebaseの環境変数が未設定です。
              </p>
            )}
          </div>
        </div>
      </AppShell>
    )
  }

  if (todayRecord && !isReplacing) {
    return (
      <AppShell>
        <div className="flex flex-col gap-6">
          <BackLink />
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Check className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-serif text-xl font-light text-foreground">
                この日の余白は保存済みです
              </h1>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                写真と声からAIが読み取った背景を見返せます。
              </p>
            </div>
            <Button asChild variant="secondary" className="mt-2 rounded-xl">
              <Link href={`/records/${todayRecord.id}`}>記録をひらく</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl font-normal text-muted-foreground"
              onClick={() => {
                setIsReplacing(true)
                restartCapture()
              }}
            >
              この日の記録を撮り直す
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const canSave = Boolean(photo && voice) && !saving
  const closedWithoutPhoto = inputClosed && !photo
  const closedWithoutVoice = inputClosed && photo && !voice

  async function handleSave() {
    if (!canSave || !photo || !voice) return
    setSaving(true)
    setAiError('')

    const createdAt = new Date().toISOString()
    const observationInput = {
      hasPhoto: true,
      hasVoice: true,
      hasAudio: true,
      photoAnalysis: photo.analysis,
      voiceAnalysis: voice.analysis,
      reactionProfile: buildReactionProfile(records),
      photoSrc: photo.src,
      createdAt,
    }

    let insight
    try {
      insight = await observeDay(observationInput)
    } catch (error) {
      setSaving(false)
      setAiError(
        error instanceof ObserveApiError
          ? error.message
          : 'AI分析に失敗しました。少し時間をおいてもう一度試してください。',
      )
      return
    }

    const record: DayRecord = {
      id: `rec-${today}`,
      date: today,
      createdAt,
      photo: photo.src,
      hasPhoto: true,
      photoAnalysis: photo.analysis,
      audio: voice.src,
      hasAudio: true,
      hasVoice: true,
      voiceAnalysis: voice.analysis,
      insight,
    }

    try {
      const savedRecord = await addRecord(record)
      router.push(`/feedback/${savedRecord.id}`)
    } catch (error) {
      setSaving(false)
      setAiError(
        error instanceof Error
          ? error.message
          : '記録を保存できませんでした。',
      )
    }
  }

  const saveLabel = photo
    ? voice
      ? 'この余白を保存する'
      : '写真のあとに声を残してください'
    : 'まず写真を撮ってください'

  return (
    <div className="flex min-h-dvh justify-center bg-neutral-950">
      <main className="relative h-dvh w-full max-w-md overflow-hidden bg-neutral-950 text-white">
        <PhotoUpload
          key={captureSession}
          onChange={handlePhotoChange}
          disabled={inputClosed || saving}
          timeLeft={timeLeft}
          autoStart
          variant="immersive"
          title="30秒の余白"
          voiceStatus={voiceStatus}
          className="absolute inset-0"
        />

        <div className="pointer-events-none absolute inset-x-4 top-4 z-40 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/50"
            aria-label="ホームへ戻る"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <span className="rounded-full bg-black/35 px-3 py-2 text-[11px] tracking-wide text-white/80 backdrop-blur-md">
            {formatDateJP(today)}
          </span>
        </div>

        {!photo && !inputClosed && (
          <p className="pointer-events-none absolute inset-x-8 bottom-28 z-30 text-center text-xs leading-relaxed text-white/70">
            30秒以内に、今日の余白として残したいものを撮ってください。
          </p>
        )}

        {photo && (
          <div className="absolute inset-x-4 bottom-4 z-40 flex flex-col gap-2">
            <VoiceRecorder
              key={voiceAutoStartKey}
              onChange={setVoice}
              disabled={inputClosed || saving}
              autoStartKey={voiceAutoStartKey}
              required
              variant="camera"
              onStatusChange={setVoiceStatus}
            />

            {inputClosed && (
              <p className="rounded-2xl bg-black/55 px-4 py-2 text-xs leading-relaxed text-white/75 backdrop-blur-md">
                入力は締め切られました。
                {closedWithoutVoice && '声がないため、もう一度30秒を始めてください。'}
                {voice && 'この写真と声をAIが観察します。'}
              </p>
            )}

            {aiError && (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/20 px-4 py-2 text-xs leading-relaxed text-white">
                {aiError}
              </p>
            )}

            <div className="flex gap-2">
              {(closedWithoutVoice || aiError) && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={restartCapture}
                  className="h-12 rounded-2xl text-sm font-normal"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  やり直す
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!canSave}
                size="lg"
                className="h-12 flex-1 rounded-2xl text-sm font-normal tracking-wide"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    AIが背景を読んでいます
                  </>
                ) : (
                  saveLabel
                )}
              </Button>
            </div>
          </div>
        )}

        {closedWithoutPhoto && (
          <div className="absolute inset-x-6 bottom-8 z-40 flex flex-col gap-3 rounded-[1.6rem] bg-black/60 px-5 py-4 text-center backdrop-blur-md">
            <p className="text-sm leading-relaxed text-white/80">
              写真がないため、もう一度30秒を始めてください。
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={restartCapture}
              className="h-12 rounded-2xl text-sm font-normal"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              もう一度始める
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/"
      className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      ホーム
    </Link>
  )
}
