'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { DayRecord } from './types'
import { MOCK_RECORDS, TODAY } from './mock-data'

type RecordsContextValue = {
  records: DayRecord[]
  today: string
  /** 今日の記録（あれば） */
  todayRecord: DayRecord | undefined
  getById: (id: string) => DayRecord | undefined
  addRecord: (record: DayRecord) => void
}

const RecordsContext = createContext<RecordsContextValue | null>(null)

function sortByDateDesc(records: DayRecord[]): DayRecord[] {
  return [...records].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<DayRecord[]>(() =>
    sortByDateDesc(MOCK_RECORDS),
  )

  const addRecord = useCallback((record: DayRecord) => {
    setRecords((prev) => {
      // 1日1件：同じ日付があれば置き換える
      const filtered = prev.filter((r) => r.date !== record.date)
      return sortByDateDesc([record, ...filtered])
    })
  }, [])

  const getById = useCallback(
    (id: string) => records.find((r) => r.id === id),
    [records],
  )

  const value = useMemo<RecordsContextValue>(() => {
    return {
      records,
      today: TODAY,
      todayRecord: records.find((r) => r.date === TODAY),
      getById,
      addRecord,
    }
  }, [records, getById, addRecord])

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
