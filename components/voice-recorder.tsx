'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, RotateCcw, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceAnalysis } from '@/lib/types'

function analyzeVoice(seconds: number): VoiceAnalysis {
  const durationSeconds = Math.max(1, seconds)
  const pace =
    durationSeconds < 6
      ? '短い声'
      : durationSeconds < 18
        ? 'ひと息ぶんの声'
        : '長めの声'

  return { durationSeconds, pace }
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  function stop() {
    const nextAnalysis = analyzeVoice(seconds)
    setRecording(false)
    setDone(true)
    setAnalysis(nextAnalysis)
    onChange(nextAnalysis)
  }

  function reset() {
    setRecording(false)
    setDone(false)
    setSeconds(0)
    setAnalysis(null)
    onChange(null)
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-5 py-7">
      {!done ? (
        <>
          <button
            type="button"
            onClick={() => (recording ? stop() : setRecording(true))}
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
              {analysis.pace}・{analysis.durationSeconds}秒
            </p>
          )}
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
