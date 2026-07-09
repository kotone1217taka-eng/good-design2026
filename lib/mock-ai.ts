import type { AiInsight, PhotoAnalysis, VoiceAnalysis } from './types'

export type ObservationInput = {
  hasPhoto: boolean
  hasVoice?: boolean
  hasAudio?: boolean
  photoAnalysis?: PhotoAnalysis
  voiceAnalysis?: VoiceAnalysis
  createdAt?: string
}

function clean(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function compact(value: string | undefined, maxLength = 24): string {
  const cleaned = clean(value)
  if (!cleaned) return ''
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned
}

function unique(values: Array<string | undefined>, max = 6): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach((value) => {
    const cleaned = compact(value, 18)
    if (!cleaned || seen.has(cleaned)) return
    seen.add(cleaned)
    result.push(cleaned)
  })

  return result.slice(0, max)
}

function transcriptKeywords(voice: VoiceAnalysis | undefined): string[] {
  const transcript = clean(voice?.transcript)
  const fragments = transcript
    .split(/[、。,.!?！？\n]/)
    .map((fragment) => compact(fragment, 12))
    .filter(Boolean)

  return unique([voice?.texture, voice?.pace, ...fragments], 5)
}

function photoKeywords(photo: PhotoAnalysis | undefined): string[] {
  return unique([
    photo?.focalArea,
    photo?.microDetail,
    photo?.edgeDetail,
    photo?.tone,
    photo?.brightness,
  ])
}

function voiceCue(voice: VoiceAnalysis | undefined): string {
  const transcript = compact(voice?.transcript, 24)
  if (transcript) return `声に出た「${transcript}」`
  if (voice?.texture) return voice.texture
  if (voice?.pace) return voice.pace
  return ''
}

function buildStandout(photo: PhotoAnalysis | undefined): string[] {
  if (!photo) {
    return ['画面に残った色や形のまとまり']
  }

  return unique(
    [
      photo.microDetail,
      photo.edgeDetail,
      photo.focalArea ? `${photo.focalArea}の配置` : undefined,
      `${photo.brightness}光`,
      `${photo.tone}の色`,
    ],
    4,
  )
}

function buildInteresting(
  photo: PhotoAnalysis | undefined,
  voice: VoiceAnalysis | undefined,
): string[] {
  const cue = voiceCue(voice)

  if (!photo) {
    return [
      cue ? `${cue}が、写真の外側にある面白さを指している` : undefined,
      '何を写したかより、写そうとした一瞬そのものが残っている',
      '画面の外側に、その場の続きがありそうに見える',
    ].filter(Boolean) as string[]
  }

  const interesting = [
    cue && photo.microDetail
      ? `${cue}と、${photo.microDetail}が同じ場所を見ている`
      : undefined,
    photo.microDetail
      ? `${photo.microDetail}が、主役ではないのに目を引く`
      : undefined,
    photo.edgeDetail
      ? `${photo.edgeDetail}が、端のほうに小さな違和感を作っている`
      : undefined,
    photo.focalArea
      ? `${photo.focalArea}に視線が寄ってから、周りの余白へ戻っていく`
      : undefined,
    photo.tone ? `${photo.tone}が、その場の温度を決めている` : undefined,
  ]

  return unique(interesting, 4)
}

function buildAtmosphere(
  photo: PhotoAnalysis | undefined,
  voice: VoiceAnalysis | undefined,
): string[] {
  const cue = voiceCue(voice)
  const values = [
    cue ? `${cue}が先にあり、写真の見え方を少し決めている` : undefined,
    photo ? `${photo.brightness}で、${photo.tone}が残る空気` : undefined,
    voice?.texture,
    voice?.durationSeconds
      ? `${voice.durationSeconds}秒ぶんの短い気配`
      : undefined,
  ]

  return unique(values, 4)
}

function buildComment(
  photo: PhotoAnalysis | undefined,
  voice: VoiceAnalysis | undefined,
): string {
  const detail = photo?.microDetail ?? photo?.edgeDetail ?? photo?.focalArea
  const cue = voiceCue(voice)

  if (detail && cue) {
    return `${compact(detail, 22)}に、${compact(cue, 24)}が重なっている。`
  }

  if (detail) {
    return `${compact(detail, 30)}が、写真の中で小さく場所を取っている。`
  }

  if (cue) {
    return `${compact(cue, 28)}だけが、写真の外側の時間を少し足している。`
  }

  return '何かを面白いと思ってカメラを向けた、その反応がいちばん鮮明に残っている。'
}

export function createObservationJson(input: ObservationInput): AiInsight {
  const photo = input.photoAnalysis
  const voice = input.voiceAnalysis
  const keywords = {
    photo: photoKeywords(photo),
    voice: transcriptKeywords(voice),
  }

  return {
    standout: buildStandout(photo),
    interesting: buildInteresting(photo, voice),
    atmosphere: buildAtmosphere(photo, voice),
    comment: buildComment(photo, voice),
    keywords,
  }
}

export async function observeDay(input: ObservationInput): Promise<AiInsight> {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return createObservationJson(input)
}
