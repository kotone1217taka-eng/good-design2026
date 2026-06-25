'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { DayRecord } from './types'
import { MOCK_RECORDS } from './mock-data'
import { getTodayIso } from './date'

type RecordsContextValue = {
  records: DayRecord[]
  today: string
  /** 今日の記録（あれば） */
  todayRecord: DayRecord | undefined
  getById: (id: string) => DayRecord | undefined
  addRecord: (record: DayRecord) => void
}

const RecordsContext = createContext<RecordsContextValue | null>(null)
const STORAGE_KEY = 'kiryo-records-v1'
const STALE_PHOTO_FALLBACK = '/records/evening-sky.png'

function sortByDateDesc(records: DayRecord[]): DayRecord[] {
  return [...records].sort((a, b) => (a.date < b.date ? 1 : -1))
}

function normalizeRecord(record: DayRecord): DayRecord {
  if (typeof record.photo === 'string' && record.photo.startsWith('blob:')) {
    return {
      ...record,
      photo: STALE_PHOTO_FALLBACK,
      hasPhoto: false,
    }
  }

  return record
}

function readStoredRecords(): DayRecord[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.map(normalizeRecord)
  } catch {
    return null
  }
}

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<DayRecord[]>(() =>
    sortByDateDesc(MOCK_RECORDS),
  )
  const [today] = useState(() => getTodayIso())
  const [readyToPersist, setReadyToPersist] = useState(false)

  useEffect(() => {
    const storedRecords = readStoredRecords()
    if (storedRecords) {
      setRecords(sortByDateDesc(storedRecords))
    }
    setReadyToPersist(true)
  }, [])

  useEffect(() => {
    if (!readyToPersist) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [readyToPersist, records])

  const addRecord = useCallback((record: DayRecord) => {
    setRecords((prev) => {
      // 1日1件：同じ日付があれば置き換える
      const filtered = prev.filter((r) => r.date !== record.date)
      return sortByDateDesc([normalizeRecord(record), ...filtered])
    })
  }, [])

  const getById = useCallback(
    (id: string) => records.find((r) => r.id === id),
    [records],
  )

  const value = useMemo<RecordsContextValue>(() => {
    return {
      records,
      today,
      todayRecord: records.find((r) => r.date === today),
      getById,
      addRecord,
    }
  }, [records, today, getById, addRecord])

  return (
    <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>
  )
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext)
  if (!ctx) {
    throw new Error('useRecords must be used within RecordsProvider')
  }
  return ctx
}
