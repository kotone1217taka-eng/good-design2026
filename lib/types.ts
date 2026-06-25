export type AiKeywords = {
  photo: string[]
  voice: string[]
}

export type AiInsight = {
  discovery: string
  margin: string
  key: string
  sentence: string
  keywords?: AiKeywords
}

export type PhotoAnalysis = {
  brightness: string
  tone: string
  focalArea?: string
  edgeDetail?: string
  microDetail?: string
  commuteHint?: string
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
  hint?: string
}

export type DayRecord = {
  id: string
  date: string
  photo: string
  hasPhoto?: boolean
  photoAnalysis?: PhotoAnalysis
  note: string
  hasVoice: boolean
  voiceAnalysis?: VoiceAnalysis
  insight: AiInsight
}
