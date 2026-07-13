'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Mic, RotateCcw, Video, ZoomIn } from 'lucide-react'
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

function makePersistentPhotoSrcFromVideo(
  video: HTMLVideoElement,
  zoom: number,
): string {
  const sourceWidth = video.videoWidth || 1280
  const sourceHeight = video.videoHeight || 960
  const captureZoom = Math.min(Math.max(zoom, 1), 3)
  const cropWidth = sourceWidth / captureZoom
  const cropHeight = sourceHeight / captureZoom
  const sourceX = (sourceWidth - cropWidth) / 2
  const sourceY = (sourceHeight - cropHeight) / 2
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
  ctx.drawImage(video, sourceX, sourceY, cropWidth, cropHeight, 0, 0, width, height)

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
  autoStart = false,
  variant = 'phone',
  title = '今日の記録',
  voiceStatus = 'idle',
  className,
}: {
  onChange: (photo: PhotoInput | null) => void
  disabled?: boolean
  timeLeft: number
  autoStart?: boolean
  variant?: 'phone' | 'immersive'
  title?: string
  voiceStatus?: 'idle' | 'recording' | 'done'
  className?: string
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handledAutoStartRef = useRef(false)

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

  useEffect(() => {
    if (
      autoStart &&
      !handledAutoStartRef.current &&
      !disabled &&
      !preview &&
      !cameraActive
    ) {
      handledAutoStartRef.current = true
      void startCamera()
    }
  }, [autoStart, disabled, preview, cameraActive])

  async function startCamera() {
    if (disabled || busy) return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('このブラウザではカメラを起動できません。')
      return
    }

    try {
      setError('')
      setZoom(1)
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
      const src = makePersistentPhotoSrcFromVideo(video, zoom)
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
    setZoom(1)
    handledAutoStartRef.current = false
    onChange(null)
  }

  const immersive = variant === 'immersive'
  const timerClass =
    timeLeft <= 5
      ? 'border-destructive bg-destructive text-destructive-foreground'
      : 'border-primary bg-black/35 text-white'

  return (
    <div
      className={cn(
        immersive
          ? 'flex h-full min-h-0 flex-col'
          : 'flex flex-col items-center gap-3',
        className,
      )}
    >
      <div
        className={cn(
          immersive
            ? 'relative min-h-0 flex-1 overflow-hidden bg-neutral-950'
            : 'relative w-full max-w-[22rem] rounded-[2.1rem] bg-neutral-950 p-2 shadow-[0_18px_50px_rgb(82_43_12_/_0.28)]',
        )}
      >
        <div
          className={cn(
            immersive
              ? 'relative size-full overflow-hidden bg-neutral-900'
              : 'relative aspect-[9/16] w-full overflow-hidden rounded-[1.65rem] bg-neutral-900',
          )}
        >
          {preview ? (
            <RecordImage
              src={preview}
              alt="撮影した写真"
              className="object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              className={cn(
                'size-full object-cover transition-[opacity,transform] duration-300',
                cameraActive ? 'opacity-100' : 'opacity-0',
              )}
              style={{ transform: `scale(${zoom})` }}
            />
          )}

          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/65 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

          <div
            className={cn(
              'absolute inset-x-5 flex items-start justify-between gap-4 text-white',
              immersive ? 'top-16' : 'top-4',
            )}
          >
            <span className="pt-1 text-xs font-medium tracking-wide">
              {title}
            </span>
            <span
              className={cn(
                'flex size-20 shrink-0 flex-col items-center justify-center rounded-full border-2 text-center shadow-lg backdrop-blur-sm',
                timerClass,
              )}
              aria-live="polite"
            >
              <span className="font-mono text-3xl leading-none tabular-nums">
                {timeLeft}
              </span>
              <span className="text-[10px]">秒</span>
            </span>
          </div>

          {!preview && !cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
              <span className="flex size-16 items-center justify-center rounded-full bg-white/12 text-primary backdrop-blur-sm">
                <Video className="size-7" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">
                  30秒のカメラを開く
                </span>
                <span className="text-[11px] leading-relaxed text-white/70">
                  アプリ側ではシャッター音を鳴らしません
                </span>
              </div>
            </div>
          )}

          {preview && analysis && (
            <span
              className={cn(
                'absolute left-5 max-w-[70%] rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm',
                immersive ? 'top-36' : 'top-24',
              )}
            >
              {analysis.microDetail ?? `${analysis.brightness}光`}
            </span>
          )}

          {!preview && cameraActive && (
            <div
              className={cn(
                'absolute inset-x-6 flex items-center gap-3 rounded-full bg-black/35 px-4 py-3 text-white backdrop-blur-sm',
                immersive ? 'bottom-32' : 'bottom-28',
              )}
            >
              <ZoomIn className="size-4 text-primary" aria-hidden="true" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-1 flex-1 accent-primary"
                aria-label="ズーム"
              />
              <span className="w-9 text-right font-mono text-xs tabular-nums">
                {zoom.toFixed(1)}
              </span>
            </div>
          )}

          <div
            className={cn(
              'absolute inset-x-6 flex items-end justify-between',
              immersive && preview ? 'bottom-44' : 'bottom-6',
            )}
          >
            <span
              className={cn(
                'flex size-11 items-center justify-center rounded-full backdrop-blur-sm',
                voiceStatus === 'recording'
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/25'
                  : voiceStatus === 'done'
                    ? 'bg-white text-primary'
                    : 'bg-white/15 text-white',
              )}
            >
              <Mic className="size-5" aria-hidden="true" />
            </span>

            {preview ? (
              <button
                type="button"
                onClick={reset}
                disabled={disabled}
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-3 text-sm text-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                撮り直す
              </button>
            ) : cameraActive ? (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={disabled || busy}
                className="flex size-20 items-center justify-center rounded-full border-4 border-white/80 bg-white text-foreground shadow-[0_0_0_6px_rgb(249_115_22_/_0.45)] transition-transform active:scale-95 disabled:opacity-50"
                aria-label="写真を撮る"
              >
                <Camera className="size-7" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled || busy}
                className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              >
                開始
              </button>
            )}

            <span className="flex h-8 w-20 items-end justify-center gap-0.5 text-primary">
              {Array.from({ length: 12 }).map((_, index) => (
                <span
                  key={index}
                  className="w-0.5 rounded-full bg-current opacity-80"
                  style={{ height: `${5 + ((index * 5 + timeLeft) % 18)}px` }}
                  aria-hidden="true"
                />
              ))}
            </span>
          </div>
        </div>
      </div>
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
