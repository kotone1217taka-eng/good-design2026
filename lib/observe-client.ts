import type { AiInsight } from './types'
import type { OpenAiObservationInput } from './openai-observer'

type ObserveResponse = {
  insight?: AiInsight
  error?: string
}

export class ObserveApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ObserveApiError'
  }
}

export async function observeDay(input: OpenAiObservationInput): Promise<AiInsight> {
  const response = await fetch('/api/observe/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const data = (await response.json().catch(() => ({}))) as ObserveResponse

  if (!response.ok || !data.insight) {
    throw new ObserveApiError(data.error ?? 'AI分析に失敗しました。')
  }

  return data.insight
}
