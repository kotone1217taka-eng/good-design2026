'use client'

import { Plus, Sparkles, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'
import { collectCustomReactions } from '@/lib/custom-reactions'
import { useRecords } from '@/lib/records-store'
import { cn } from '@/lib/utils'
import type {
  AiReaction,
  AiReactionTarget,
  AiReactionValue,
  CustomAiReaction,
  DayRecord,
} from '@/lib/types'

const reactionOptions: Array<{
  value: AiReactionValue
  label: string
  icon: typeof ThumbsUp
}> = [
  { value: 'good', label: 'グッド', icon: ThumbsUp },
  { value: 'wrong', label: 'ちがう', icon: X },
  { value: 'best', label: 'さいこう', icon: Sparkles },
]

function hashText(value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

export function InsightReactions({
  record,
  target,
  text,
}: {
  record: DayRecord
  target: AiReactionTarget
  text: string
}) {
  const { reactToInsight, records } = useRecords()
  const [saving, setSaving] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [error, setError] = useState('')
  const reactionId = `${target}-${hashText(text)}`
  const active = record.aiReactions?.find((reaction) => reaction.id === reactionId)
  const customOptions = collectCustomReactions(records)

  async function saveReaction({
    value,
    customReaction,
    savingKey,
  }: {
    value: AiReactionValue
    customReaction?: CustomAiReaction
    savingKey: string
  }) {
    const reaction: AiReaction = {
      id: reactionId,
      target,
      text,
      value,
      customReaction,
      createdAt: new Date().toISOString(),
    }

    setSaving(savingKey)
    setError('')
    try {
      await reactToInsight(record.id, reaction)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'リアクションを保存できませんでした。',
      )
    } finally {
      setSaving(null)
    }
  }

  async function createCustomReaction() {
    const label = customLabel.replace(/\s+/g, ' ').trim()
    const description = customDescription.replace(/\s+/g, ' ').trim()

    if (!label || !description) {
      setError('リアクション名と説明文を入力してください。')
      return
    }

    const customReaction: CustomAiReaction = {
      id: `custom-${hashText(`${label}\n${description}`)}`,
      label,
      description,
      createdAt: new Date().toISOString(),
    }

    await saveReaction({
      value: 'custom',
      customReaction,
      savingKey: customReaction.id,
    })
    setCustomLabel('')
    setCustomDescription('')
    setCreating(false)
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {reactionOptions.map((option) => {
          const Icon = option.icon
          const selected = active?.value === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              disabled={saving !== null}
              onClick={() =>
                void saveReaction({
                  value: option.value,
                  savingKey: option.value,
                })
              }
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs leading-none transition-colors disabled:opacity-60',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {option.label}
            </button>
          )
        })}

        {customOptions.map((customReaction) => {
          const selected =
            active?.value === 'custom' &&
            active.customReaction?.id === customReaction.id
          return (
            <button
              key={customReaction.id}
              type="button"
              aria-pressed={selected}
              title={customReaction.description}
              disabled={saving !== null}
              onClick={() =>
                void saveReaction({
                  value: 'custom',
                  customReaction,
                  savingKey: customReaction.id,
                })
              }
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs leading-none transition-colors disabled:opacity-60',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {customReaction.label}
            </button>
          )
        })}

        <button
          type="button"
          disabled={saving !== null}
          onClick={() => {
            setCreating((current) => !current)
            setError('')
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/35 bg-background px-3 py-1.5 text-xs leading-none text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-60"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          作る
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-wide text-muted-foreground">
                リアクション名・絵文字
              </span>
              <input
                value={customLabel}
                onChange={(event) => setCustomLabel(event.target.value)}
                placeholder="わかる / そこじゃない / それ面白い"
                className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/35"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-wide text-muted-foreground">
                このリアクションの意味
              </span>
              <textarea
                value={customDescription}
                onChange={(event) => setCustomDescription(event.target.value)}
                placeholder="AIのコメントが自分の感覚と近い、という意味。"
                rows={3}
                className="resize-none rounded-xl border border-input bg-card px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/35"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setError('')
                }}
                className="rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                閉じる
              </button>
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => void createCustomReaction()}
                className="rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                作って反応する
              </button>
            </div>
          </div>
        </div>
      )}

      {active && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {active.value === 'custom' && active.customReaction
            ? `「${active.customReaction.label}」の意味も次回のAIの見方に反映されます。`
            : 'この反応は次回のAIの見方に反映されます。'}
        </p>
      )}
      {error && (
        <p className="text-[11px] leading-relaxed text-destructive">{error}</p>
      )}
    </div>
  )
}
