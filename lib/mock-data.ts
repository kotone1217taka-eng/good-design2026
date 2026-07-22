import type { DayRecord } from './types'
import { getTodayIso } from './date'

export const MOCK_RECORDS: DayRecord[] = [
  {
    id: 'rec-2026-06-14',
    date: '2026-06-14',
    createdAt: '2026-06-14T10:00:00.000Z',
    photo: '/records/convenience-store-night.png',
    hasPhoto: true,
  },
  {
    id: 'rec-2026-06-13',
    date: '2026-06-13',
    createdAt: '2026-06-13T10:00:00.000Z',
    photo: '/records/morning-track.png',
    hasPhoto: true,
  },
]

export const TODAY = getTodayIso()
