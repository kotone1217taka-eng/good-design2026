'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { AiReaction, DayRecord } from './types'
import { useAuth } from './auth-store'
import { getTodayIso } from './date'
import {
  saveUserRecord,
  saveUserRecordReactions,
  subscribeToUserRecords,
} from './firebase-records'

type RecordsContextValue = {
  records: DayRecord[]
  today: string
  loading: boolean
  error: string
  /** 今日の記録（あれば） */
  todayRecord: DayRecord | undefined
  getById: (id: string) => DayRecord | undefined
  addRecord: (record: DayRecord) => Promise<DayRecord>
  reactToInsight: (recordId: string, reaction: AiReaction) => Promise<void>
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
        throw new Error('サインインすると記録を保存できます。')
      }

      const savedRecord = await saveUserRecord(user.uid, record)
      setRecords((prev) => {
        // 1日1件：同じ日付があれば置き換える
        const filtered = prev.filter((r) => r.date !== savedRecord.date)
        return sortByDateDesc([savedRecord, ...filtered])
      })
      return savedRecord
    },
    [user],
  )

  const reactToInsight = useCallback(
    async (recordId: string, reaction: AiReaction) => {
      if (!user) {
        throw new Error('サインインするとリアクションを保存できます。')
      }

      const record = records.find((r) => r.id === recordId)
      if (!record) throw new Error('記録が見つかりません。')

      const nextReactions = [
        ...(record.aiReactions ?? []).filter((item) => item.id !== reaction.id),
        reaction,
      ]
      const nextCustomReactions = reaction.customReaction
        ? [
            ...(record.customAiReactions ?? []).filter(
              (item) => item.id !== reaction.customReaction?.id,
            ),
            reaction.customReaction,
          ]
        : record.customAiReactions ?? []

      await saveUserRecordReactions(
        user.uid,
        recordId,
        nextReactions,
        nextCustomReactions,
      )
      setRecords((prev) =>
        sortByDateDesc(
          prev.map((item) =>
            item.id === recordId
              ? {
                  ...item,
                  aiReactions: nextReactions,
                  customAiReactions: nextCustomReactions,
                }
              : item,
          ),
        ),
      )
    },
    [records, user],
  )

  const getById = useCallback(
    (id: string) => records.find((r) => r.id === id),
    [records],
  )

  const value = useMemo<RecordsContextValue>(() => {
    return {
      records,
      today,
      loading,
      error,
      todayRecord: records.find((r) => r.date === today),
      getById,
      addRecord,
      reactToInsight,
    }
  }, [records, today, loading, error, getById, addRecord, reactToInsight])

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
