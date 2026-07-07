'use client'

import { useRef, useState } from 'react'
import { Camera, RotateCcw } from 'lucide-react'
import { RecordImage } from '@/components/record-image'
import { cn } from '@/lib/utils'
import type { PhotoAnalysis, PhotoInput } from '@/lib/types'

const maxStoredImageSize = 1100
const storedImageQuality = 0.82

type Region = {
  label: string
  contains: (x: number, y: number, size: number) => boolean
}

const regions: Region[] = [
  {
    label: '左上の端',
    contains: (x, y, size) => x < size * 0.34 && y < size * 0.34,
  },
  {
    label: '右上の端',
    contains: (x, y, size) => x > size * 0.66 && y < size * 0.34,
  },
  {
    label: '左下の端',
    contains: (x, y, size) => x < size * 0.34 && y > size * 0.66,
  },
  {
    label: '右下の端',
    contains: (x, y, size) => x > size * 0.66 && y > size * 0.66,
  },
  {
    label: '中央',
    contains: (x, y, size) =>
      x > size * 0.32 &&
      x < size * 0.68 &&
      y > size * 0.32 &&
      y < size * 0.68,
  },
]

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Could not read image file'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

async function makePersistentPhotoSrc(file: File): Promise<string> {
  const originalSrc = await readFileAsDataUrl(file)

  try {
    const img = await loadImage(originalSrc)
    const scale = Math.min(1, maxStoredImageSize / Math.max(img.width, img.height))
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return originalSrc

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    return canvas.toDataURL('image/jpeg', storedImageQuality)
  } catch {
    return originalSrc
  }
}

async function analyzePhoto(src: string): Promise<PhotoAnalysis> {
  try {
    const img = await loadImage(src)
    const size = 72
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas context')

    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)
    let red = 0
    let green = 0
    let blue = 0
    let count = 0
    const regionScores = regions.map((region) => ({
      label: region.label,
      color: 0,
      green: 0,
      bright: 0,
      dark: 0,
      count: 0,
    }))

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]
      if (alpha < 16) continue

      const pixelRed = data[i]
      const pixelGreen = data[i + 1]
      const pixelBlue = data[i + 2]
      const lightness = (pixelRed + pixelGreen + pixelBlue) / 3
      const saturation =
        Math.max(pixelRed, pixelGreen, pixelBlue) -
        Math.min(pixelRed, pixelGreen, pixelBlue)
      const x = (i / 4) % size
      const y = Math.floor(i / 4 / size)

      red += pixelRed
      green += pixelGreen
      blue += pixelBlue
      count += 1

      regions.forEach((region, index) => {
        if (!region.contains(x, y, size)) return
        regionScores[index].count += 1
        if (saturation > 48) regionScores[index].color += 1
        if (pixelGreen > pixelRed + 14 && pixelGreen > pixelBlue + 8) {
          regionScores[index].green += 1
        }
        if (lightness > 178) regionScores[index].bright += 1
        if (lightness < 76) regionScores[index].dark += 1
      })
    }

    if (!count) throw new Error('No pixels')

    red /= count
    green /= count
    blue /= count

    const lightness = (red + green + blue) / 3
    const brightness =
      lightness < 86 ? '暗めの' : lightness > 176 ? '明るい' : 'やわらかい'
    const tone =
      blue > red + 18 && blue > green + 8
        ? '青っぽい色'
        : red > blue + 18 && red > green - 4
          ? 'あたたかい色'
          : green > red + 12 && green > blue + 4
            ? '緑がかった色'
            : '淡い色'

    const best = regionScores
      .filter((region) => region.count > 0)
      .sort((a, b) => {
        const score = (value: typeof a) =>
          value.color * 1.4 + value.green * 1.8 + value.bright + value.dark * 0.7
        return score(b) - score(a)
      })[0]

    const focalArea = best?.label ?? '中央'
    const edgeDetail =
      best && best.label !== '中央'
        ? `${best.label}に目を引く色や明暗の差`
        : '中央に集まった色と形'
    const microDetail =
      best?.green && best.green > best.count * 0.16
        ? `${focalArea}に緑の小さなまとまり`
        : `${focalArea}に${tone}の小さな変化`

    return {
      brightness,
      tone,
      focalArea,
      edgeDetail,
      microDetail,
    }
  } catch {
    return {
      brightness: 'やわらかい',
      tone: '淡い色',
      focalArea: '画面のどこか',
      edgeDetail: '写真の中に残った小さな差',
      microDetail: '画面の端にある細かな要素',
    }
  }
}

export function PhotoUpload({
  onChange,
  disabled = false,
}: {
  onChange: (photo: PhotoInput | null) => void
  disabled?: boolean
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    const src = await makePersistentPhotoSrc(file)
    setPreview(src)
    const nextAnalysis = await analyzePhoto(src)
    setAnalysis(nextAnalysis)
    onChange({ src, analysis: nextAnalysis })
    setBusy(false)
  }

  function reset() {
    if (disabled) return
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
        disabled={disabled}
        className="sr-only"
        id="photo-input"
      />
      {preview ? (
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border">
          <RecordImage
            src={preview}
            alt="撮影した写真"
            className="object-cover"
          />
          {analysis && (
            <span className="absolute left-3 top-3 max-w-[80%] rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
              {analysis.microDetail ?? `${analysis.brightness}光`}
            </span>
          )}
          <button
            type="button"
            onClick={reset}
            disabled={disabled}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            撮り直す
          </button>
        </div>
      ) : (
        <label
          htmlFor={disabled ? undefined : 'photo-input'}
          className={cn(
            'flex aspect-[5/4] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-muted-foreground transition-colors',
            disabled
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer hover:border-primary/50 hover:text-foreground',
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary">
            <Camera className="size-6" aria-hidden="true" />
          </span>
          <span className="text-sm">
            {busy ? '写真を読み取っています' : '今、面白いと思ったものを撮る'}
          </span>
          <span className="text-[11px] tracking-wide text-muted-foreground">
            30秒を過ぎると撮影は締め切られます
          </span>
        </label>
      )}
    </div>
  )
}
