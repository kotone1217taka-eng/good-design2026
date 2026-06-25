const OPENAI_API_KEY_STORAGE_KEY = 'kiryo-openai-api-key-v1'

export function readOpenAiApiKey(): string {
  if (typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveOpenAiApiKey(apiKey: string) {
  if (typeof window === 'undefined') return

  const trimmed = apiKey.trim()
  try {
    if (trimmed) {
      window.localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, trimmed)
    } else {
      window.localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY)
    }
  } catch {
    // localStorage can be unavailable in private or restricted browser contexts.
  }
}

export function maskOpenAiApiKey(apiKey: string): string {
  const trimmed = apiKey.trim()
  if (!trimmed) return ''
  if (trimmed.length <= 10) return '保存済み'

  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`
}
