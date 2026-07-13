import type { AiReactionProfile, DayRecord } from './types'

function compact(value: string, maxLength = 42): string {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned
}

function unique(values: string[], max = 8): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach((value) => {
    const cleaned = compact(value)
    if (!cleaned || seen.has(cleaned)) return
    seen.add(cleaned)
    result.push(cleaned)
  })

  return result.slice(0, max)
}

export function buildReactionProfile(records: DayRecord[]): AiReactionProfile {
  const liked: string[] = []
  const loved: string[] = []
  const rejected: string[] = []
  const custom = new Map<
    string,
    {
      label: string
      description: string
      examples: string[]
    }
  >()

  records.forEach((record) => {
    ;(record.customAiReactions ?? []).forEach((customReaction) => {
      const key = `${customReaction.label}\n${customReaction.description}`
      if (custom.has(key)) return
      custom.set(key, {
        label: customReaction.label,
        description: customReaction.description,
        examples: [],
      })
    })

    ;(record.aiReactions ?? []).forEach((reaction) => {
      if (reaction.value === 'best') loved.push(reaction.text)
      if (reaction.value === 'good') liked.push(reaction.text)
      if (reaction.value === 'wrong') rejected.push(reaction.text)
      if (reaction.value === 'custom' && reaction.customReaction) {
        const key = `${reaction.customReaction.label}\n${reaction.customReaction.description}`
        const current = custom.get(key) ?? {
          label: reaction.customReaction.label,
          description: reaction.customReaction.description,
          examples: [],
        }
        current.examples = unique([...current.examples, reaction.text], 3)
        custom.set(key, current)
      }
    })
  })

  return {
    liked: unique(liked),
    loved: unique(loved),
    rejected: unique(rejected),
    custom: [...custom.values()].slice(0, 8),
  }
}
