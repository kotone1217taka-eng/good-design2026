import type { CustomAiReaction, DayRecord } from './types'

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function sameMeaning(a: CustomAiReaction, b: CustomAiReaction): boolean {
  return (
    clean(a.label) === clean(b.label) &&
    clean(a.description) === clean(b.description)
  )
}

export function collectCustomReactions(records: DayRecord[]): CustomAiReaction[] {
  const result: CustomAiReaction[] = []

  records.forEach((record) => {
    ;(record.customAiReactions ?? []).forEach((customReaction) => {
      if (result.some((item) => sameMeaning(item, customReaction))) {
        return
      }
      result.push(customReaction)
    })

    ;(record.aiReactions ?? []).forEach((reaction) => {
      if (reaction.value !== 'custom' || !reaction.customReaction) return
      if (result.some((item) => sameMeaning(item, reaction.customReaction!))) {
        return
      }
      result.push(reaction.customReaction)
    })
  })

  return result.slice(0, 12)
}
