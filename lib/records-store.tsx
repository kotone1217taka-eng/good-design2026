'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from './auth-store'
import { getTodayIso } from './date'
import {
  deleteUserRecord,
  saveUserRecord,
  subscribeToUserRecords,
} from './firebase-records'
import type { DayRecord } from './types'

type RecordsContextValue = {
  records: DayRecord[]
  today: string
  loading: boolean
  error: string
  todayRecord: DayRecord | undefined
  getById: (id: string) => DayRecord | undefined
  getByDate: (date: string) => DayRecord | undefined
  addRecord: (record: DayRecord) => Promise<DayRecord>
  deleteRecord: (recordId: string) => Promise<void>
}

const RecordsContext = createContext<RecordsContextValue | null>(null)

function sortByDateDesc(records: DayRecord[]): DayRecord[] {
  return [...records].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, configured } = useAuth()
  const [records, setRecords] = useState<DayRecord[]>([])
  const [today] = useState(() => getTodayIso())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!configured || !user) {
      setRecords([])
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    return subscribeToUserRecords(
      user.uid,
      (nextRecords) => {
        setRecords(sortByDateDesc(nextRecords))
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )
  }, [authLoading, configured, user])

  const addRecord = useCallback(
    async (record: DayRecord) => {
      if (!user) {
        throw new Error('サインインすると写真を保存できます。')
      }

      const savedRecord = await saveUserRecord(user.uid, record)
      setRecords((prev) => {
        const filtered = prev.filter((item) => item.date !== savedRecord.date)
        return sortByDateDesc([savedRecord, ...filtered])
      })
      return savedRecord
    },
    [user],
  )

  const deleteRecord = useCallback(
    async (recordId: string) => {
      if (!user) {
        throw new Error('サインインすると写真を削除できます。')
      }

      await deleteUserRecord(user.uid, recordId)
      setRecords((prev) => prev.filter((record) => record.id !== recordId))
    },
    [user],
  )

  const getById = useCallback(
    (id: string) => records.find((record) => record.id === id),
    [records],
  )

  const getByDate = useCallback(
    (date: string) => records.find((record) => record.date === date),
    [records],
  )

  const value = useMemo<RecordsContextValue>(() => {
    return {
      records,
      today,
      loading,
      error,
      todayRecord: getByDate(today),
      getById,
      getByDate,
      addRecord,
      deleteRecord,
    }
  }, [
    records,
    today,
    loading,
    error,
    getById,
    getByDate,
    addRecord,
    deleteRecord,
  ])

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
