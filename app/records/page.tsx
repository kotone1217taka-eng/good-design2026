'use client'

import { RecordCard } from '@/components/record-card'
import { AppShell } from '@/components/app-shell'
import { useRecords } from '@/lib/records-store'

export default function RecordsPage() {
  const { records } = useRecords()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl font-light tracking-wide text-foreground">
            これまでの記録
          </h1>
          <p className="text-sm text-muted-foreground">
            {records.length} 日分の、小さな発見。
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
