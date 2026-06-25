'use client'

import { useRef, useState } from 'react'
import { ImagePlus, RotateCcw } from 'lucide-react'
import { RecordImage } from '@/components/record-image'
import type { PhotoAnalysis, PhotoInput } from '@/lib/types'

const fallbackAnalysis: PhotoAnalysis = {
  brightness: '中くらいの明るさ',
  tone: '落ち着いた色',
  microDetail: '写真の端に残った小さな差',
  commuteHint: '昨日と違う一点だけを見る',
}

const maxStoredImageSize = 1100
const storedImageQuality = 0.82

type AccentKind = '白' | '黄色' | 'ピンク' | '青' | '赤'

type RegionStats = {
  label: string
  isEdge: boolean
  count: number
  red: number
  green: number
  blue: number
  greenCount: number
  brightCount: number
  darkCount: number
  saturatedCount: number
  accentKinds: Record<AccentKind, number>
}

type RegionDefinition = {
  label: string
  isEdge: boolean
  contains: (x: number, y: number, size: number) => boolean
}

const accentLabels: Record<AccentKind, string> = {
  白: '白い点',
  黄色: '黄色い点',
  ピンク: 'ピンクの点',
  青: '青い点',
  赤: '赤い点',
}

const regions: RegionDefinition[] = [
  {
    label: '左上の端',
    isEdge: true,
    contains: (x, y, size) => x < size * 0.34 && y < size * 0.34,
  },
  {
    label: '右上の端',
    isEdge: true,
    contains: (x, y, size) => x > size * 0.66 && y < size * 0.34,
  },
  {
    label: '左下の端',
    isEdge: true,
    contains: (x, y, size) => x < size * 0.34 && y > size * 0.66,
  },
  {
    label: '右下の端',
    isEdge: true,
    contains: (x, y, size) => x > size * 0.66 && y > size * 0.66,
  },
  {
    label: '左端',
    isEdge: true,
    contains: (x, _y, size) => x < size * 0.18,
  },
  {
    label: '右端',
    isEdge: true,
    contains: (x, _y, size) => x > size * 0.82,
  },
  {
    label: '下の端',
    isEdge: true,
    contains: (_x, y, size) => y > size * 0.82,
  },
  {
    label: '中央',
    isEdge: false,
    contains: (x, y, size) =>
      x > size * 0.34 &&
      x < size * 0.66 &&
      y > size * 0.34 &&
      y < size * 0.66,
  },
]

function createRegionStats(definition: RegionDefinition): RegionStats {
  return {
    label: definition.label,
    isEdge: definition.isEdge,
    count: 0,
    red: 0,
    green: 0,
    blue: 0,
    greenCount: 0,
    brightCount: 0,
    darkCount: 0,
    saturatedCount: 0,
    accentKinds: {
      白: 0,
      黄色: 0,
      ピンク: 0,
      青: 0,
      赤: 0,
    },
  }
}

function classifyAccent(red: number, green: number, blue: number): AccentKind | null {
  const lightness = (red + green + blue) / 3
  const saturation = Math.max(red, green, blue) - Math.min(red, green, blue)

  if (lightness > 188 && saturation < 44) return '白'
  if (red > 172 && green > 136 && blue < 126 && saturation > 44) return '黄色'
  if (red > 164 && blue > 116 && green < red - 20 && saturation > 34) {
    return 'ピンク'
  }
  if (blue > red + 28 && blue > green + 12 && lightness > 96) return '青'
  if (red > 168 && green < 128 && blue < 132 && saturation > 46) return '赤'

  return null
}

function dominantAccent(stats: RegionStats): AccentKind | null {
  const entries = Object.entries(stats.accentKinds) as [AccentKind, number][]
  const [accent, count] = entries.sort((a, b) => b[1] - a[1])[0]
  return count > Math.max(1, stats.count * 0.004) ? accent : null
}

function regionScore(stats: RegionStats): number {
  if (!stats.count) return 0

  const greenRatio = stats.greenCount / stats.count
  const brightRatio = stats.brightCount / stats.count
  const darkRatio = stats.darkCount / stats.count
  const saturatedRatio = stats.saturatedCount / stats.count
  const accentTotal = Object.values(stats.accentKinds).reduce(
    (sum, count) => sum + count,
    0,
  )
  const accentRatio = accentTotal / stats.count

  return (
    (stats.isEdge ? 0.2 : 0) +
    Math.min(accentRatio * 22, 0.42) +
    (greenRatio > 0.18 ? 0.24 : 0) +
    (brightRatio > 0.035 && darkRatio > 0.1 ? 0.2 : 0) +
    Math.min(saturatedRatio * 0.4, 0.16)
  )
}

function buildPhotoDetail(
  stats: RegionStats,
  brightness: string,
  tone: string,
): Pick<PhotoAnalysis, 'focalArea' | 'edgeDetail' | 'microDetail' | 'commuteHint'> {
  const greenRatio = stats.count ? stats.greenCount / stats.count : 0
  const brightRatio = stats.count ? stats.brightCount / stats.count : 0
  const darkRatio = stats.count ? stats.darkCount / stats.count : 0
  const accent = dominantAccent(stats)

  if (greenRatio > 0.18 && accent) {
    const flowerish = accent === '白' || accent === '黄色' || accent === 'ピンク'
    return {
      focalArea: stats.label,
      edgeDetail: `${stats.label}に植え込みのような緑`,
      microDetail: `${stats.label}の緑に、${
        flowerish ? '花みたいな' : '小さな'
      }${accentLabels[accent]}`,
      commuteHint: '通学路の植え込みを一度だけ見る',
    }
  }

  if (greenRatio > 0.22) {
    return {
      focalArea: stats.label,
      edgeDetail: `${stats.label}に緑のかたまり`,
      microDetail: `${stats.label}に、葉の影みたいな緑`,
      commuteHint: '道端の緑の高さを見る',
    }
  }

  if (accent) {
    return {
      focalArea: stats.label,
      edgeDetail: `${stats.label}に${accentLabels[accent]}`,
      microDetail: `${stats.label}に、ぽつんと${accentLabels[accent]}`,
      commuteHint: 'いつもの道の小さな色を一つ探す',
    }
  }

  if (brightRatio > 0.05 && darkRatio > 0.12) {
    return {
      focalArea: stats.label,
      edgeDetail: `${stats.label}に光と影の差`,
      microDetail: `${stats.label}に、暗さから浮く小さな光`,
      commuteHint: '影の中にある小さな光を見る',
    }
  }

  if (tone === '青っぽい') {
    return {
      focalArea: stats.label,
      edgeDetail: `${stats.label}に青い面`,
      microDetail: `${stats.label}に、窓や水たまりみたいな青`,
      commuteHint: '窓や水たまりの青を一度見る',
    }
  }

  if (tone === 'あたたかい色') {
    return {
      focalArea: stats.label,
      edgeDetail: `${stats.label}にあたたかい色`,
      microDetail: `${stats.label}に、夕方みたいな色の残り`,
      commuteHint: '建物の端に残る色を見る',
    }
  }

  return {
    focalArea: stats.label,
    edgeDetail: `${stats.label}に${brightness}の差`,
    microDetail: `${stats.label}に、昨日とは違う明るさ`,
    commuteHint: '昨日と違う一点だけを見る',
  }
}

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
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 72
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
      const statsByRegion = regions.map(createRegionStats)

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
        const isGreen =
          pixelGreen > pixelRed + 16 &&
          pixelGreen > pixelBlue + 10 &&
          lightness > 48
        const accent = classifyAccent(pixelRed, pixelGreen, pixelBlue)

        red += pixelRed
        green += pixelGreen
        blue += pixelBlue
        count += 1

        statsByRegion.forEach((stats, index) => {
          if (!regions[index].contains(x, y, size)) return

          stats.count += 1
          stats.red += pixelRed
          stats.green += pixelGreen
          stats.blue += pixelBlue
          if (isGreen) stats.greenCount += 1
          if (lightness > 174) stats.brightCount += 1
          if (lightness < 76) stats.darkCount += 1
          if (saturation > 42) stats.saturatedCount += 1
          if (accent) stats.accentKinds[accent] += 1
        })
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

      const bestRegion =
        statsByRegion
          .filter((stats) => stats.count > 0)
          .sort((a, b) => regionScore(b) - regionScore(a))[0] ??
        createRegionStats(regions[0])
      const detail = buildPhotoDetail(bestRegion, brightness, tone)

      resolve({ brightness, tone, ...detail })
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

    const src = await makePersistentPhotoSrc(file)
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
          <RecordImage
            src={preview || '/placeholder.svg'}
            alt="選んだ今日の写真"
            className="object-cover"
          />
          {analysis && (
            <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
              {analysis.microDetail ?? `${analysis.brightness}・${analysis.tone}`}
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
            端に残った色を一文に使います
          </span>
        </label>
      )}
    </div>
  )
}
