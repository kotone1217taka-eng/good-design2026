const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土']

function formatLocalIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayIso(): string {
  return formatLocalIso(new Date())
}

export function formatDateJP(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS_JP[date.getDay()]
  return `${month}月${day}日（${weekday}）`
}

export function formatDateShort(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${month} / ${day}`
}

export function recentDates(today: string, n: number): string[] {
  const base = new Date(`${today}T00:00:00`)
  const result: string[] = []

  for (let i = 0; i < n; i++) {
    const date = new Date(base)
    date.setDate(base.getDate() - i)
    result.push(formatLocalIso(date))
  }

  return result
}

export function staticRecordIdsAroundToday(daysBack = 30, daysForward = 365) {
  const base = new Date(`${getTodayIso()}T00:00:00`)
  const ids: string[] = []

  for (let offset = -daysBack; offset <= daysForward; offset++) {
    const date = new Date(base)
    date.setDate(base.getDate() + offset)
    ids.push(`rec-${formatLocalIso(date)}`)
  }

  return ids
}
