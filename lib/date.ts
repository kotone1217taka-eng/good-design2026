const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土']

/** "2026-06-15" -> "6月15日（月）" */
export function formatDateJP(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekday = WEEKDAYS_JP[d.getDay()]
  return `${month}月${day}日（${weekday}）`
}

/** "2026-06-15" -> "06 / 15" のような静かな表示 */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${m} / ${d}`
}

/** 直近 n 日の ISO 日付配列（today を含む、新しい順） */
export function recentDates(today: string, n: number): string[] {
  const base = new Date(`${today}T00:00:00`)
  const result: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    result.push(d.toISOString().slice(0, 10))
  }
  return result
}
