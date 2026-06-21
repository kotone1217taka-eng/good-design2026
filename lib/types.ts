export type AiInsight = {
  discovery: string
  margin: string
  key: string
  sentence: string
}

export type PhotoAnalysis = {
  brightness: string
  tone: string
}

export type PhotoInput = {
  src: string
  analysis: PhotoAnalysis
}

export type VoiceAnalysis = {
  durationSeconds: number
  pace: string
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
