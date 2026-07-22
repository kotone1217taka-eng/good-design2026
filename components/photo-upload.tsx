'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, RotateCcw, Video, ZoomIn } from 'lucide-react'
import { RecordImage } from '@/components/record-image'
import { cn } from '@/lib/utils'
import type { PhotoInput } from '@/lib/types'

const maxStoredImageSize = 1100
const storedImageQuality = 0.82

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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image file'))
    reader.readAsDataURL(file)
  })
}

async function makePersistentPhotoSrcFromFile(file: File): Promise<string> {
  const src = await readFileAsDataUrl(file)
  const image = await loadImage(src)
  const scale = Math.min(
    1,
    maxStoredImageSize / Math.max(image.naturalWidth, image.naturalHeight),
  )
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not prepare image file')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', storedImageQuality)
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function PhotoUpload({
  onChange,
  disabled = false,
  autoStart = false,
  variant = 'phone',
  title = '今日の写真',
  className,
}: {
  onChange: (photo: PhotoInput | null) => void
  disabled?: boolean
  autoStart?: boolean
  variant?: 'phone' | 'immersive'
  title?: string
  className?: string
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      fileInputRef.current?.click()
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
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      setError('カメラを起動できませんでした。写真ファイルを選んで記録することもできます。')
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
      onChange({ src })
    } catch {
      setError('写真を撮れませんでした。もう一度試してください。')
    } finally {
      setBusy(false)
    }
  }

  async function handleFileChange(file: File | undefined) {
    if (!file || disabled || busy) return

    setBusy(true)
    try {
      const src = await makePersistentPhotoSrcFromFile(file)
      stopStream(streamRef.current)
      streamRef.current = null
      setCameraActive(false)
      setPreview(src)
      onChange({ src })
      setError('')
    } catch {
      setError('写真を読み込めませんでした。別の写真で試してください。')
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function reset() {
    if (disabled) return
    stopStream(streamRef.current)
    streamRef.current = null
    setCameraActive(false)
    setPreview(null)
    setError('')
    setZoom(1)
    handledAutoStartRef.current = false
    onChange(null)
  }

  const immersive = variant === 'immersive'

  return (
    <div
      className={cn(
        immersive
          ? 'flex h-full min-h-0 flex-col'
          : 'flex flex-col items-center gap-3',
        className,
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleFileChange(event.target.files?.[0])}
      />

      <div
        className={cn(
          immersive
            ? 'relative min-h-0 flex-1 overflow-hidden bg-neutral-950'
            : 'relative w-full max-w-[22rem] rounded-[2rem] bg-neutral-950 p-2 shadow-[0_18px_50px_rgb(24_62_54_/_0.18)]',
        )}
      >
        <div
          className={cn(
            immersive
              ? 'relative size-full overflow-hidden bg-neutral-900'
              : 'relative aspect-[9/16] w-full overflow-hidden rounded-[1.5rem] bg-neutral-900',
          )}
        >
          {preview ? (
            <RecordImage
              src={preview}
              alt="記録する写真"
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
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

          <div
            className={cn(
              'absolute inset-x-5 flex items-center justify-between gap-4 text-white',
              immersive ? 'top-16' : 'top-4',
            )}
          >
            <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm">
              {title}
            </span>
          </div>

          {!preview && !cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
              <span className="flex size-16 items-center justify-center rounded-full bg-white/12 text-primary backdrop-blur-sm">
                <Video className="size-7" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">今日残したいものを1枚だけ</span>
                <span className="text-[11px] leading-relaxed text-white/70">
                  言葉を足さず、写真だけで日付を埋めます。
                </span>
              </div>
            </div>
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

          <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || busy}
              className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-50"
              aria-label="写真を選ぶ"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
            </button>

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
                className="flex size-20 items-center justify-center rounded-full border-4 border-white/80 bg-white text-foreground shadow-[0_0_0_6px_rgb(235_88_64_/_0.36)] transition-transform active:scale-95 disabled:opacity-50"
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
                カメラを開く
              </button>
            )}

            <span className="h-11 w-11" aria-hidden="true" />
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
