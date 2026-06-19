'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, RotateCcw } from 'lucide-react'
import { withBasePath } from '@/lib/base-path'

/**
 * 1日1枚だけ選べる写真アップロードUI。
 * 選んだ画像はプレビュー表示（ObjectURL）。実アップロードはしない。
 */
export function PhotoUpload({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange(url)
  }

  function reset() {
    setPreview(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="sr-only"
        id="photo-input"
      />
      {preview ? (
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={withBasePath(preview || '/placeholder.svg')}
            alt="選んだ今日の写真"
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={reset}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            選び直す
          </button>
        </div>
      ) : (
        <label
          htmlFor="photo-input"
          className="flex aspect-[5/4] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <ImagePlus className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm">今日の1枚を選ぶ</span>
          <span className="text-[11px] tracking-wide text-muted-foreground">
            写真は1日に1枚だけ
          </span>
        </label>
      )}
    </div>
  )
}
