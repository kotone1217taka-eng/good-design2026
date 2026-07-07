'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, RotateCcw, Video } from 'lucide-react'
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

function makePersistentPhotoSrcFromVideo(video: HTMLVideoElement): string {
  const sourceWidth = video.videoWidth || 1280
  const sourceHeight = video.videoHeight || 960
  const scale = Math.min(1, maxStoredImageSize / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not capture camera frame')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(video, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', storedImageQuality)
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

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function PhotoUpload({
  onChange,
  disabled = false,
  timeLeft,
}: {
  onChange: (photo: PhotoInput | null) => void
  disabled?: boolean
  timeLeft: number
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (disabled && cameraActive) {
      stopStream(streamRef.current)
      streamRef.current = null
      setCameraActive(false)
    }
  }, [disabled, cameraActive])

  async function startCamera() {
    if (disabled || busy) return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('このブラウザではカメラを起動できません。')
      return
    }

    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      setError('カメラの使用を許可すると、この画面内で撮影できます。')
    }
  }

  async function capturePhoto() {
    const video = videoRef.current
    if (!video || disabled || busy) return

    setBusy(true)
    try {
      const src = makePersistentPhotoSrcFromVideo(video)
      stopStream(streamRef.current)
      streamRef.current = null
      setCameraActive(false)
      setPreview(src)
      const nextAnalysis = await analyzePhoto(src)
      setAnalysis(nextAnalysis)
      onChange({ src, analysis: nextAnalysis })
    } catch {
      setError('写真を撮れませんでした。もう一度試してください。')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    if (disabled) return
    setPreview(null)
    setAnalysis(null)
    setError('')
    onChange(null)
  }

  const timerClass =
    timeLeft <= 5
      ? 'bg-destructive text-destructive-foreground'
      : 'bg-black/55 text-white'

  return (
    <div className="flex flex-col gap-2">
      {preview ? (
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border">
          <RecordImage
            src={preview}
            alt="撮影した写真"
            className="object-cover"
          />
          <span
            className={cn(
              'absolute right-3 top-3 min-w-14 rounded-full px-3 py-1.5 text-center font-mono text-lg tabular-nums backdrop-blur-sm',
              timerClass,
            )}
          >
            {timeLeft}
          </span>
          {analysis && (
            <span className="absolute left-3 top-3 max-w-[70%] rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
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
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border bg-card">
          <video
            ref={videoRef}
            muted
            playsInline
            className={cn(
              'size-full object-cover',
              cameraActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <span
            className={cn(
              'absolute right-3 top-3 min-w-14 rounded-full px-3 py-1.5 text-center font-mono text-lg tabular-nums backdrop-blur-sm',
              timerClass,
            )}
          >
            {timeLeft}
          </span>
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
              <span className="flex size-14 items-center justify-center rounded-full bg-secondary">
                <Video className="size-6" aria-hidden="true" />
              </span>
              <span className="text-sm">
                アプリ内カメラで撮る
              </span>
              <span className="text-[11px] leading-relaxed tracking-wide text-muted-foreground">
                アプリ側ではシャッター音を鳴らしません
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-12">
            {cameraActive ? (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={disabled || busy}
                className="flex size-16 items-center justify-center rounded-full border-4 border-white bg-white/85 text-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                aria-label="写真を撮る"
              >
                <Camera className="size-7" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled || busy}
                className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                カメラを開始
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
