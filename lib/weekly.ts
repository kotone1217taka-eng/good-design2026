import type { DayRecord } from './types'
import {
  WEEK_DIARY_WEEKDAYS_JP,
  formatDateShort,
  getWeekDates,
  getWeekRangeLabel,
} from './date'

export type WeekDiarySlot = {
  date: string
  weekday: string
  record?: DayRecord
}

function byDate(records: DayRecord[]): Map<string, DayRecord> {
  return new Map(records.map((record) => [record.date, record]))
}

export function getWeekDiarySlots(
  records: DayRecord[],
  today: string,
): WeekDiarySlot[] {
  const recordMap = byDate(records)

  return getWeekDates(today).map((date, index) => ({
    date,
    weekday: WEEK_DIARY_WEEKDAYS_JP[index],
    record: recordMap.get(date),
  }))
}

export function getWeekPhotoProgress(records: DayRecord[], today: string) {
  const slots = getWeekDiarySlots(records, today)
  const recorded = slots.filter((slot) => slot.record).length

  return {
    recorded,
    total: slots.length,
    percent: Math.round((recorded / slots.length) * 100),
    rangeLabel: getWeekRangeLabel(today),
  }
}

export function getWeekPhotoSummary(records: DayRecord[], today: string) {
  const slots = getWeekDiarySlots(records, today)
  const recordedDates = slots
    .filter((slot) => slot.record)
    .map((slot) => formatDateShort(slot.date))

  return {
    slots,
    recordedDates,
    progress: getWeekPhotoProgress(records, today),
  }
}
