'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PhotoUpload } from '@/components/photo-upload'
import { VoiceRecorder } from '@/components/voice-recorder'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useRecords } from '@/lib/records-store'
import { observeDay, ObserveApiError } from '@/lib/observe-client'
import { formatDateJP } from '@/lib/date'
import type { DayRecord, PhotoInput, VoiceAnalysis } from '@/lib/types'

export default function RecordPage() {
  const router = useRouter()
  const { today, todayRecord, addRecord } = useRecords()

  const [photo, setPhoto] = useState<PhotoInput | null>(null)
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const [aiError, setAiError] = useState('')

  // すでに今日の記録がある場合
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
                今日はもう残しました
              </h1>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                記録は1日に1つだけ。
                <br />
                今日の続きは、また明日。
              </p>
            </div>
            <Button asChild variant="secondary" className="mt-2 rounded-xl">
              <Link href={`/records/${todayRecord.id}`}>
                今日の観察をひらく
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl font-normal text-muted-foreground"
              onClick={() => setIsReplacing(true)}
            >
              今日の記録を作り直す
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const canSave =
    (photo || voiceAnalysis || note.trim().length > 0) && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setAiError('')
    const observationInput = {
      note,
      hasPhoto: Boolean(photo),
      hasVoice: Boolean(voiceAnalysis),
      photoAnalysis: photo?.analysis,
      voiceAnalysis: voiceAnalysis ?? undefined,
      photoSrc: photo?.src,
    }
    let insight
    try {
      insight = await observeDay(observationInput)
    } catch (error) {
      setSaving(false)
      setAiError(
        error instanceof ObserveApiError
          ? error.message
          : 'AI分析に失敗しました。しばらくしてからもう一度試してください。',
      )
      return
    }
    const record: DayRecord = {
      id: `rec-${today}`,
      date: today,
      photo: photo?.src ?? '/records/evening-sky.png',
      hasPhoto: Boolean(photo),
      photoAnalysis: photo?.analysis,
      note: note.trim() || '（声の記録のみ）',
      hasVoice: Boolean(voiceAnalysis),
      voiceAnalysis: voiceAnalysis ?? undefined,
      insight,
    }
    addRecord(record)
    router.push(`/feedback/${record.id}`)
  }

  return (
    <AppShell showNav={!saving}>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <BackLink />
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-[0.18em] text-muted-foreground">
              {formatDateJP(today)}
            </span>
            <h1 className="font-serif text-2xl font-light tracking-wide text-foreground">
              今日を、1つだけ残す
            </h1>
          </div>
        </div>

        {/* 写真 */}
        <section className="flex flex-col gap-2.5">
          <SectionLabel n="1">今日の1枚</SectionLabel>
          <PhotoUpload onChange={setPhoto} />
        </section>

        {/* 声 */}
        <section className="flex flex-col gap-2.5">
          <SectionLabel n="2">少しの声</SectionLabel>
          <VoiceRecorder onChange={setVoiceAnalysis} />
        </section>

        {/* テキスト代替 */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[11px] tracking-wide text-muted-foreground">
              声のかわりに、書いてもいい
            </span>
            <Separator className="flex-1" />
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今日はどんな日だった？　うまく言えなくていい。"
            rows={4}
            className="resize-none rounded-2xl bg-card text-[15px] leading-relaxed"
          />
        </section>

        {/* 保存 */}
        <div className="flex flex-col gap-2 pt-1">
          {aiError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
              {aiError}
            </p>
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
                AIが写真を見ています…
              </>
            ) : (
              isReplacing ? '今日を保存し直す' : '今日を保存する'
            )}
          </Button>
          <p className="text-center text-[11px] tracking-wide text-muted-foreground">
            保存できるのは1日に1つだけ
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

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
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
