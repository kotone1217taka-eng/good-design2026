export type AiInsight = {
  /** 今日の発見：本人が見落としていた小さな事実を拾う */
  discovery: string
  /** 今日の余白：その日のなかにあった小さな間 */
  margin: string
  /** 発見の鍵：明日の日常を見るための短い視点や問い */
  key: string
  /** 今日の一文：静かに残る一行 */
  sentence: string
}

export type DayRecord = {
  id: string
  /** ISO date string, e.g. 2026-06-15 */
  date: string
  /** 写真のパス（モック） */
  photo: string
  /** 声の記録の文字起こし、またはテキスト入力 */
  note: string
  /** 音声記録があったかどうか（モック） */
  hasVoice: boolean
  /** AIの観察結果 */
  insight: AiInsight
}
