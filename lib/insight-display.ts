import type { AiInsight } from './types'

function listOrFallback(values: string[] | undefined, fallback: string[]): string[] {
  const cleaned = (values ?? []).map((value) => value.trim()).filter(Boolean)
  return cleaned.length ? cleaned : fallback
}

export function getInsightComment(insight: AiInsight): string {
  return (
    insight.comment ||
    insight.sentence ||
    insight.discovery ||
    '写真の中に残った小さな違いを、AIが観察しました。'
  )
}

export function getInsightStandout(insight: AiInsight): string[] {
  return listOrFallback(insight.standout, [
    insight.discovery,
    insight.keywords?.photo?.[0],
  ].filter(Boolean) as string[])
}

export function getInsightInteresting(insight: AiInsight): string[] {
  return listOrFallback(insight.interesting, [
    insight.margin,
    insight.key,
  ].filter(Boolean) as string[])
}

export function getInsightAtmosphere(insight: AiInsight): string[] {
  return listOrFallback(insight.atmosphere, [
    insight.keywords?.voice?.[0],
    insight.keywords?.photo?.[1],
  ].filter(Boolean) as string[])
}
