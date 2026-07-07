'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, RotateCcw, Square, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceAnalysis, VoiceInput } from '@/lib/types'

type SpeechRecognitionAlternativeLike = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  isFinal?: boolean
  [index: number]: SpeechRecognitionAlternativeLike | undefined
}

type SpeechRecognitionEventLike = {
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike | undefined
  }
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
  abort?: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const speechWindow = window as SpeechRecognitionWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Could not read audio blob'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read audio blob'))
    reader.readAsDataURL(blob)
  })
}

function getVoiceTexture(transcript: string, seconds: number): string {
  if (/雨|風|電車|車|チャイム|音|ざわ|足音/.test(transcript)) {
    return '周りの音が少し混じった声'
  }
  if (/笑|おもしろ|面白|変|きれい|すごい|あれ|これ/.test(transcript)) {
    return '反応が先に出た声'
  }
  if (/撮|写|主役|メイン|真ん中|端/.test(transcript)) {
    return '見ている場所を説明する声'
  }
  if (seconds < 5) return '短く切り取られた声'
  if (seconds > 18) return '少し長く眺めている声'
  return 'その場を確かめるような声'
}

function analyzeVoice(seconds: number, transcript = ''): VoiceAnalysis {
  const durationSeconds = Math.max(1, Math.round(seconds))
  const pace =
    durationSeconds < 6
      ? '短い声'
      : durationSeconds < 18
        ? 'ひと息ぶんの声'
        : '長めの声'
  const cleanedTranscript = transcript.replace(/\s+/g, ' ').trim()

  return {
    durationSeconds,
    pace,
    transcript: cleanedTranscript || undefined,
    texture: getVoiceTexture(cleanedTranscript, durationSeconds),
  }
}

function getMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus'
  }
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
  return undefined
}

export function VoiceRecorder({
  onChange,
  disabled = false,
  autoStartKey = 0,
  required = false,
}: {
  onChange: (voice: VoiceInput | null) => void
  disabled?: boolean
  autoStartKey?: number
  required?: boolean
}) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [voice, setVoice] = useState<VoiceInput | null>(null)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const chunksRef = useRef<Blob[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const startedAtRef = useRef<number>(0)
  const transcriptRef = useRef('')
  const handledAutoStartRef = useRef(0)

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    if (!recording) return

    timerRef.current = setInterval(() => {
      setSeconds(Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)))
    }, 250)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recording])

  useEffect(() => {
    if (disabled && recording) {
      stop()
    }
  }, [disabled, recording])

  useEffect(() => {
    if (
      autoStartKey > 0 &&
      autoStartKey !== handledAutoStartRef.current &&
      !disabled &&
      !recording &&
      !voice
    ) {
      handledAutoStartRef.current = autoStartKey
      void start()
    }
  }, [autoStartKey, disabled, recording, voice])

  useEffect(() => {
    return () => {
      stopRecognition()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`

  function startRecognition() {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let nextTranscript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        nextTranscript += event.results[index]?.[0]?.transcript ?? ''
      }
      setTranscript(nextTranscript.trim())
    }
    recognition.onerror = () => {
      recognitionRef.current = null
    }
    recognition.onend = () => {
      recognitionRef.current = null
    }
    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
    }
  }

  function stopRecognition() {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    try {
      recognition?.stop()
    } catch {
      recognition?.abort?.()
    }
  }

  async function start() {
    if (disabled) return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('このブラウザでは録音を開始できません。')
      return
    }
    if (typeof MediaRecorder === 'undefined') {
      setError('このブラウザでは録音保存に対応していません。')
      return
    }

    try {
      setError('')
      setVoice(null)
      onChange(null)
      setTranscript('')
      transcriptRef.current = ''
      setSeconds(0)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      startedAtRef.current = Date.now()

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        )
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const src = await blobToDataUrl(blob)
        const analysis = analyzeVoice(durationSeconds, transcriptRef.current)
        const nextVoice = { src, analysis }

        setVoice(nextVoice)
        onChange(nextVoice)
        setSeconds(durationSeconds)
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        mediaRecorderRef.current = null
      }

      recorder.start()
      setRecording(true)
      startRecognition()
    } catch {
      setError('マイクの使用を許可してください。写真のあとに声も必ず残します。')
      setRecording(false)
    }
  }

  function stop() {
    stopRecognition()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      mediaRecorderRef.current = null
    }
  }

  function reset() {
    if (disabled) return
    if (recording) stop()
    setVoice(null)
    setTranscript('')
    setSeconds(0)
    setError('')
    onChange(null)
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-5 py-7">
      <div className="flex items-center gap-2 self-start">
        {required && (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] text-primary-foreground">
            必須
          </span>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          写真を撮ると自動で録音が始まります。何が面白かったか、何をメインで撮ったかを話してください。
        </p>
      </div>

      {!voice ? (
        <>
          <button
            type="button"
            onClick={() => (recording ? stop() : start())}
            disabled={disabled && !recording}
            aria-label={recording ? '録音を止める' : '音声を録る'}
            className={cn(
              'flex size-20 items-center justify-center rounded-full transition-all disabled:opacity-50',
              recording
                ? 'bg-destructive/10 text-destructive ring-4 ring-destructive/15'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            {recording ? (
              <Square className="size-7 fill-current" aria-hidden="true" />
            ) : (
              <Mic className="size-8" aria-hidden="true" />
            )}
          </button>

          {recording ? (
            <div className="flex h-6 items-center gap-1" aria-hidden="true">
              {Array.from({ length: 9 }).map((_, index) => (
                <span
                  key={index}
                  className="w-1 animate-pulse rounded-full bg-primary/60"
                  style={{
                    height: `${8 + ((index * 7 + seconds * 3) % 16)}px`,
                    animationDelay: `${index * 0.08}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs tracking-wide text-muted-foreground">
              写真を撮ると、ここが自動で録音中になります
            </p>
          )}

          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {mmss}
          </span>
          {error && (
            <p className="max-w-64 text-center text-[11px] leading-relaxed text-destructive">
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex w-full items-center gap-3 rounded-xl bg-secondary px-4 py-3">
            <Volume2 className="size-4 text-primary" aria-hidden="true" />
            <audio src={voice.src} controls className="h-8 flex-1" />
          </div>
          <p className="text-xs tracking-wide text-muted-foreground">
            {voice.analysis.texture ?? voice.analysis.pace}・
            {voice.analysis.durationSeconds}秒
          </p>
          {voice.analysis.transcript && (
            <p className="w-full rounded-xl bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              音声から拾った言葉: {voice.analysis.transcript}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            disabled={disabled}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            録り直す
          </button>
        </>
      )}
    </div>
  )
}
