const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土']
export const CALENDAR_WEEKDAYS_JP = WEEKDAYS_JP
export const WEEK_DIARY_WEEKDAYS_JP = ['月', '火', '水', '木', '金', '土', '日']

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

export function getMonthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function formatMonthJP(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  return `${year}年${Number(month)}月`
}

export function formatDateJP(iso: string): string {
  const date = parseIso(iso)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS_JP[date.getDay()]
  return `${month}月${day}日（${weekday}）`
}

export function formatDateShort(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${Number(month)}/${Number(day)}`
}

export function getWeekStartIso(iso: string): string {
  const date = parseIso(iso)
  const day = date.getDay()
  const offset = day === 0 ? -6 : 1 - day
  return toIso(addDays(date, offset))
}

export function getWeekDates(iso: string): string[] {
  const start = parseIso(getWeekStartIso(iso))
  return Array.from({ length: 7 }, (_, index) => toIso(addDays(start, index)))
}

export function getWeekRangeLabel(iso: string): string {
  const dates = getWeekDates(iso)
  return `${formatDateShort(dates[0])} - ${formatDateShort(dates[6])}`
}

export function addMonths(monthKey: string, amount: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1 + amount, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthCalendarDates(monthKey: string): string[] {
  const [year, month] = monthKey.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const start = addDays(firstDay, -firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => toIso(addDays(start, index)))
}
