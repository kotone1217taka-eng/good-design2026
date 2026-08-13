const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土']

export function toIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function getTodayIso(): string {
  return toIso(new Date())
}

export function formatDateJP(iso: string): string {
  const date = parseIso(iso)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS_JP[date.getDay()]
  return `${month}月${day}日（${weekday}）`
}

export function formatMonthDot(iso: string): string {
  return iso.slice(0, 7).replace('-', '.')
}

export function formatTimeJP(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '時間なし'
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
