'use client'

import { useEffect, useState } from 'react'
import { KeyRound, Trash2 } from 'lucide-react'
import {
  maskOpenAiApiKey,
  readOpenAiApiKey,
  saveOpenAiApiKey,
} from '@/lib/openai-settings'
import { Button } from '@/components/ui/button'

export function AiKeyPanel({
  apiKey,
  onChange,
}: {
  apiKey: string
  onChange: (apiKey: string) => void
}) {
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = readOpenAiApiKey()
    onChange(stored)
  }, [onChange])

  function save() {
    saveOpenAiApiKey(draft)
    onChange(draft.trim())
    setDraft('')
    setOpen(false)
  }

  function clear() {
    saveOpenAiApiKey('')
    onChange('')
    setDraft('')
    setOpen(true)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <KeyRound className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-card-foreground">AIの目</p>
            <p className="truncate text-xs text-muted-foreground">
              {apiKey
                ? `OpenAI ${maskOpenAiApiKey(apiKey)}`
                : '画像の内容まで見ます'}
            </p>
          </div>
        </div>

        {apiKey ? (
          <button
            type="button"
            onClick={clear}
            aria-label="OpenAI API keyを削除"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-xl"
            onClick={() => setOpen((current) => !current)}
          >
            設定
          </Button>
        )}
      </div>

      {(!apiKey || open) && (
        <div className="flex flex-col gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-..."
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-xl"
              disabled={!draft.trim()}
              onClick={save}
            >
              保存
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              このブラウザにだけ保存されます。
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
