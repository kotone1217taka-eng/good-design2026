'use client'

import { RecordCard } from '@/components/record-card'
import { AppShell } from '@/components/app-shell'
import { useRecords } from '@/lib/records-store'

export default function RecordsPage() {
  const { records, loading, error } = useRecords()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl font-light tracking-wide text-foreground">
            これまでの観察
          </h1>
          <p className="text-sm text-muted-foreground">
            {records.length}日分の、写真とAIの観察結果。
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {loading && (
            <p className="rounded-2xl border border-border bg-card px-5 py-6 text-center text-sm text-muted-foreground">
              記録を読み込んでいます。
            </p>
          )}
          {error && (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
              {error}
            </p>
          )}
          {!loading && !error && records.length === 0 && (
            <p className="rounded-2xl border border-border bg-card px-5 py-6 text-center text-sm leading-relaxed text-muted-foreground">
              記録すると、ここに写真とAIの観察結果が並びます。
            </p>
          )}
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
