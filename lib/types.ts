export type AiKeywords = {
  photo: string[]
  voice: string[]
}

export type AiInsight = {
  /** 写真の中で目立ったもの */
  standout: string[]
  /** AIが面白いと感じたポイント */
  interesting: string[]
  /** その場の雰囲気 */
  atmosphere: string[]
  /** 少し詩的、または観察日記のような短いコメント */
  comment: string
  keywords?: AiKeywords

  /** Legacy fields kept so older saved records can still render. */
  discovery?: string
  margin?: string
  key?: string
  sentence?: string
}

export type AiReactionValue = 'good' | 'wrong' | 'best' | 'custom'

export type AiReactionTarget = 'comment' | 'standout' | 'interesting' | 'atmosphere'

export type CustomAiReaction = {
  id: string
  label: string
  description: string
  createdAt: string
}

export type AiReaction = {
  id: string
  target: AiReactionTarget
  text: string
  value: AiReactionValue
  customReaction?: CustomAiReaction
  createdAt: string
}

export type AiReactionProfile = {
  liked: string[]
  loved: string[]
  rejected: string[]
  custom: Array<{
    label: string
    description: string
    examples: string[]
  }>
}

export type PhotoAnalysis = {
  brightness: string
  tone: string
  focalArea?: string
  edgeDetail?: string
  microDetail?: string
}

export type PhotoInput = {
  src: string
  analysis: PhotoAnalysis
}

export type VoiceAnalysis = {
  durationSeconds: number
  pace: string
  transcript?: string
  texture?: string
}

export type VoiceInput = {
  src: string
  analysis: VoiceAnalysis
}

export type DayRecord = {
  id: string
  date: string
  createdAt: string
  photo: string
  hasPhoto?: boolean
  photoAnalysis?: PhotoAnalysis
  audio?: string
  hasAudio?: boolean
  hasVoice: boolean
  voiceAnalysis?: VoiceAnalysis
  insight: AiInsight
  aiReactions?: AiReaction[]
  customAiReactions?: CustomAiReaction[]

  /** Legacy text note from older versions. New records do not use it. */
  note?: string
}
