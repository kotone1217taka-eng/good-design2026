import type {
  AiInsight,
  AiReactionProfile,
  PhotoAnalysis,
  VoiceAnalysis,
} from './types'

export type ObservationInput = {
  hasPhoto: boolean
  hasVoice?: boolean
  hasAudio?: boolean
  photoAnalysis?: PhotoAnalysis
  voiceAnalysis?: VoiceAnalysis
  reactionProfile?: AiReactionProfile
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

function preferredCue(profile: AiReactionProfile | undefined): string {
  return (
    profile?.custom[0]?.description ??
    profile?.loved[0] ??
    profile?.liked[0] ??
    ''
  )
}

function inferBackground(
  photo: PhotoAnalysis | undefined,
  voice: VoiceAnalysis | undefined,
): string {
  const transcript = clean(voice?.transcript)

  if (/駅|電車|ホーム|バス|通学|帰り|道|歩/.test(transcript)) {
    return '移動の途中にある場所のように見える'
  }
  if (/学校|授業|教室|部活|練習|体育館|ロッカー|グラウンド/.test(transcript)) {
    return '学校や練習の前後に残った場面かもしれない'
  }
  if (/店|コンビニ|自販機|買/.test(transcript)) {
    return '立ち寄った場所の端にある場面のように見える'
  }
  if (/家|部屋|机|窓/.test(transcript)) {
    return '家や部屋の中の静かな時間かもしれない'
  }
  if (photo?.tone?.includes('緑')) {
    return '屋外の植え込みや道端に近い場所かもしれない'
  }
  if (photo?.brightness?.includes('暗')) {
    return '帰り道や室内の暗がりに近い時間かもしれない'
  }
  if (photo?.brightness?.includes('明')) {
    return '昼間の光が入る場所のように見える'
  }

  return 'いつもの動きの途中でふと止まった場所のように見える'
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
  profile: AiReactionProfile | undefined,
): string[] {
  const cue = voiceCue(voice)
  const preference = preferredCue(profile)

  if (!photo) {
    return [
      preference
        ? `前に反応が強かった「${compact(preference, 18)}」に近い見方で、画面の中を探している`
        : undefined,
      cue ? `${cue}が、写真の外側にある面白さを指している` : undefined,
      '何を写したかより、写そうとした一瞬そのものが残っている',
      '画面の外側に、その場の続きがありそうに見える',
    ].filter(Boolean) as string[]
  }

  const interesting = [
    preference && photo.edgeDetail
      ? `前に反応が強かった「${compact(preference, 18)}」に近いものとして、${photo.edgeDetail}を見る`
      : undefined,
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
  const background = inferBackground(photo, voice)
  const values = [
    background,
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
  const background = inferBackground(photo, voice)

  if (detail && cue) {
    return `${compact(detail, 20)}に、${compact(cue, 22)}が重なる。${compact(background, 30)}。`
  }

  if (detail) {
    return `${compact(detail, 24)}が、写真の中で小さく場所を取っている。${compact(background, 30)}。`
  }

  if (cue) {
    return `${compact(cue, 24)}だけが、写真の外側の時間を少し足している。${compact(background, 30)}。`
  }

  return `何かを面白いと思ってカメラを向けた反応が残っている。${compact(background, 30)}。`
}

export function createObservationJson(input: ObservationInput): AiInsight {
  const photo = input.photoAnalysis
  const voice = input.voiceAnalysis
  const profile = input.reactionProfile
  const keywords = {
    photo: photoKeywords(photo),
    voice: transcriptKeywords(voice),
  }

  return {
    standout: buildStandout(photo),
    interesting: buildInteresting(photo, voice, profile),
    atmosphere: buildAtmosphere(photo, voice),
    comment: buildComment(photo, voice),
    keywords,
  }
}

export async function observeDay(input: ObservationInput): Promise<AiInsight> {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return createObservationJson(input)
}
