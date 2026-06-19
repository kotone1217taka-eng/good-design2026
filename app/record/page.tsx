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
import { observeDay } from '@/lib/mock-ai'
import { formatDateJP } from '@/lib/date'
import type { DayRecord } from '@/lib/types'

export default function RecordPage() {
  const router = useRouter()
  const { today, todayRecord, addRecord } = useRecords()

  const [photo, setPhoto] = useState<string | null>(null)
  const [hasVoice, setHasVoice] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // すでに今日の記録がある場合
  if (todayRecord) {
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
          </div>
        </div>
      </AppShell>
    )
  }

  const canSave = (photo || note.trim().length > 0) && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    const insight = await observeDay({
      note,
      hasPhoto: Boolean(photo),
    })
    const record: DayRecord = {
      id: `rec-${today}`,
      date: today,
      photo: photo ?? '/records/evening-sky.png',
      note: note.trim() || '（声の記録のみ）',
      hasVoice,
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
          <VoiceRecorder onChange={setHasVoice} />
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
          <Button
            onClick={handleSave}
            disabled={!canSave}
            size="lg"
            className="h-14 rounded-2xl text-base font-normal tracking-wide"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                今日を観察しています…
              </>
            ) : (
              '今日を保存する'
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
