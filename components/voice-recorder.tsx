'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, RotateCcw, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceAnalysis } from '@/lib/types'

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

function getVoiceTexture(transcript: string, seconds: number): string {
  if (/眠|疲|だる|重|しんど|焦|不安/.test(transcript)) return '重さの残る声'
  if (/花|光|空|雨|風|影|水|音|匂|色/.test(transcript)) return '景色に引っかかった声'
  if (/友|先生|先輩|家族|人|話|笑/.test(transcript)) return '人の気配が残る声'
  if (seconds < 6) return '短く切れた声'
  return '少し余白のある声'
}

function getVoiceHint(transcript: string): string {
  if (/花|植え込み|葉|緑/.test(transcript)) return '植え込みの中の小さな色を見る'
  if (/光|影|窓|水|雨/.test(transcript)) return '光が引っかかる場所を見る'
  if (/音|声|話|笑/.test(transcript)) return '言葉のあとに残る音を聞く'
  if (/眠|疲|だる|重/.test(transcript)) return '体が遅い朝の景色を見る'
  return '昨日と違う一点だけを見る'
}

function analyzeVoice(seconds: number, transcript = ''): VoiceAnalysis {
  const durationSeconds = Math.max(1, seconds)
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
    hint: getVoiceHint(cleanedTranscript),
  }
}

export function VoiceRecorder({
  onChange,
}: {
  onChange: (analysis: VoiceAnalysis | null) => void
}) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [done, setDone] = useState(false)
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null)
  const [transcript, setTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognition()))
    return () => {
      recognitionRef.current?.abort?.()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setSeconds((current) => current + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recording])

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`

  function start() {
    setSeconds(0)
    setDone(false)
    setAnalysis(null)
    setTranscript('')
    setRecording(true)

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

  function stop() {
    stopRecognition()
    const nextAnalysis = analyzeVoice(seconds, transcript)
    setRecording(false)
    setDone(true)
    setAnalysis(nextAnalysis)
    onChange(nextAnalysis)
  }

  function updateTranscript(value: string) {
    setTranscript(value)
    if (!done) return

    const nextAnalysis = analyzeVoice(seconds, value)
    setAnalysis(nextAnalysis)
    onChange(nextAnalysis)
  }

  function reset() {
    stopRecognition()
    setRecording(false)
    setDone(false)
    setSeconds(0)
    setTranscript('')
    setAnalysis(null)
    onChange(null)
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-5 py-7">
      {!done ? (
        <>
          <button
            type="button"
            onClick={() => (recording ? stop() : start())}
            aria-label={recording ? '録音を止める' : '録音を始める'}
            className={cn(
              'flex size-20 items-center justify-center rounded-full transition-all',
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
              短く、ひとこと声を残す
            </p>
          )}

          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {mmss}
          </span>
          {!recording && !speechSupported && (
            <p className="max-w-60 text-center text-[11px] leading-relaxed text-muted-foreground">
              録音後に、声に残った言葉を足せます
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex w-full items-center gap-3 rounded-xl bg-secondary px-4 py-3">
            <Mic className="size-4 text-primary" aria-hidden="true" />
            <div className="flex flex-1 items-center gap-1" aria-hidden="true">
              {Array.from({ length: 22 }).map((_, index) => (
                <span
                  key={index}
                  className="w-0.5 rounded-full bg-primary/40"
                  style={{ height: `${6 + ((index * 13) % 18)}px` }}
                />
              ))}
            </div>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {mmss}
            </span>
          </div>
          {analysis && (
            <p className="text-xs tracking-wide text-muted-foreground">
              {analysis.texture ?? analysis.pace}・{analysis.durationSeconds}秒
            </p>
          )}
          <label className="flex w-full flex-col gap-2 text-left">
            <span className="text-[11px] tracking-wide text-muted-foreground">
              声に残った言葉
            </span>
            <textarea
              value={transcript}
              onChange={(event) => updateTranscript(event.target.value)}
              placeholder="例：端の植え込みに、小さい花みたいな白があった"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            録り直す
          </button>
        </>
      )}
    </div>
  )
}
