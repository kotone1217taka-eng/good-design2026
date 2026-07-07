'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Clock3, Loader2, RotateCcw } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PhotoUpload } from '@/components/photo-upload'
import { VoiceRecorder } from '@/components/voice-recorder'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-store'
import { useRecords } from '@/lib/records-store'
import { observeDay, ObserveApiError } from '@/lib/observe-client'
import { formatDateJP } from '@/lib/date'
import type { DayRecord, PhotoInput, VoiceInput } from '@/lib/types'

const captureLimitSeconds = 30

export default function RecordPage() {
  const router = useRouter()
  const { today, todayRecord, addRecord } = useRecords()
  const { configured, loading: authLoading, user, signInWithGoogle } = useAuth()

  const [photo, setPhoto] = useState<PhotoInput | null>(null)
  const [voice, setVoice] = useState<VoiceInput | null>(null)
  const [voiceAutoStartKey, setVoiceAutoStartKey] = useState(0)
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
    setVoiceAutoStartKey(0)
    setTimeLeft(captureLimitSeconds)
    setInputClosed(false)
    setAiError('')
  }

  function handlePhotoChange(nextPhoto: PhotoInput | null) {
    setPhoto(nextPhoto)
    setVoice(null)
    if (nextPhoto) {
      setVoiceAutoStartKey((current) => current + 1)
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
                この日の観察は保存済みです
              </h1>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                写真とAIの観察結果を見返せます。
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
      ? 'この瞬間を保存する'
      : '写真のあとに声を残してください'
    : 'まず写真を撮ってください'

  return (
    <AppShell showNav={!saving}>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <BackLink />
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.18em] text-muted-foreground">
                {formatDateJP(today)}
              </span>
              <h1 className="font-serif text-2xl font-light tracking-wide text-foreground">
                30秒の観察
              </h1>
            </div>
            <div
              className={`flex min-w-20 items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 ${
                inputClosed
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-border bg-card text-foreground'
              }`}
              aria-live="polite"
            >
              <Clock3 className="size-4" aria-hidden="true" />
              <span className="font-mono text-lg tabular-nums">{timeLeft}</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            30秒以内に写真を撮ってください。撮影後、マイクが自動で起動するので、何が面白いと感じたか、何をメインで撮ったかを話してください。
          </p>
        </div>

        {inputClosed && (
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            入力は締め切られました。
            {closedWithoutPhoto && '写真がないため、もう一度30秒を始めてください。'}
            {closedWithoutVoice && '音声がないため、もう一度30秒を始めてください。'}
            {photo && voice && 'この写真と声をAIが観察します。'}
          </div>
        )}

        <section className="flex flex-col gap-2.5">
          <SectionLabel n="1">写真</SectionLabel>
          <PhotoUpload
            onChange={handlePhotoChange}
            disabled={inputClosed || saving}
            timeLeft={timeLeft}
          />
        </section>

        <section className="flex flex-col gap-2.5">
          <SectionLabel n="2">音声</SectionLabel>
          <VoiceRecorder
            onChange={setVoice}
            disabled={!photo || inputClosed || saving}
            autoStartKey={voiceAutoStartKey}
            required
          />
        </section>

        <div className="flex flex-col gap-2 pt-1">
          {aiError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
              {aiError}
            </p>
          )}
          {(closedWithoutPhoto || closedWithoutVoice) && (
            <Button
              type="button"
              variant="secondary"
              onClick={restartCapture}
              className="h-12 rounded-2xl text-sm font-normal"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              もう一度30秒を始める
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!canSave}
            size="lg"
            className="h-14 rounded-2xl text-base font-normal tracking-wide"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                AIが写真と声を観察しています
              </>
            ) : (
              saveLabel
            )}
          </Button>
          <p className="text-center text-[11px] tracking-wide text-muted-foreground">
            写真を撮ると録音が自動で始まります。保存には写真と音声の両方が必要です
          </p>
        </div>
      </div>
    </AppShell>
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

function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[11px] text-secondary-foreground">
        {n}
      </span>
      <h2 className="text-sm font-medium tracking-wide text-foreground">
        {children}
      </h2>
    </div>
  )
}
