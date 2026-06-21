'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, RotateCcw } from 'lucide-react'
import { withBasePath } from '@/lib/base-path'
import type { PhotoAnalysis, PhotoInput } from '@/lib/types'

const fallbackAnalysis: PhotoAnalysis = {
  brightness: '中くらいの明るさ',
  tone: '落ち着いた色',
}

async function analyzePhoto(src: string): Promise<PhotoAnalysis> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 48
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(fallbackAnalysis)
        return
      }

      ctx.drawImage(img, 0, 0, size, size)
      const { data } = ctx.getImageData(0, 0, size, size)
      let red = 0
      let green = 0
      let blue = 0
      let count = 0

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]
        if (alpha < 16) continue
        red += data[i]
        green += data[i + 1]
        blue += data[i + 2]
        count += 1
      }

      if (!count) {
        resolve(fallbackAnalysis)
        return
      }

      red = red / count
      green = green / count
      blue = blue / count

      const lightness = (red + green + blue) / 3
      const brightness =
        lightness < 85
          ? '暗め'
          : lightness > 175
            ? '明るい'
            : 'やわらかい明るさ'

      const tone =
        blue > red + 18 && blue > green + 8
          ? '青っぽい'
          : red > blue + 18 && red > green - 4
            ? 'あたたかい色'
            : green > red + 12 && green > blue + 4
              ? '緑がかった'
              : '淡い色'

      resolve({ brightness, tone })
    }
    img.onerror = () => resolve(fallbackAnalysis)
    img.src = src
  })
}

export function PhotoUpload({
  onChange,
}: {
  onChange: (photo: PhotoInput | null) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const src = URL.createObjectURL(file)
    setPreview(src)
    const nextAnalysis = await analyzePhoto(src)
    setAnalysis(nextAnalysis)
    onChange({ src, analysis: nextAnalysis })
  }

  function reset() {
    setPreview(null)
    setAnalysis(null)
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
          {analysis && (
            <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
              {analysis.brightness}・{analysis.tone}
            </span>
          )}
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
            色と明るさをAIの一文に使います
          </span>
        </label>
      )}
    </div>
  )
}
