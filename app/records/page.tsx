'use client'

import { AppShell } from '@/components/app-shell'
import { PhotoCalendar } from '@/components/photo-calendar'
import { useRecords } from '@/lib/records-store'

export default function FutoshotPage() {
  const { records, today, loading, error } = useRecords()

  return (
    <AppShell showAuth={false}>
      <div className="-mx-5 -mb-10 flex min-h-[calc(100dvh-9rem)] flex-col">
        <header className="px-5 pb-3">
          <h1 className="text-2xl font-medium tracking-normal text-foreground">
            フトショット
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ふと撮る、日々が見えてくる。
          </p>
        </header>

        {loading && (
          <p className="mx-5 rounded-2xl border border-border bg-card px-5 py-6 text-center text-sm text-muted-foreground">
            フトショットを読み込んでいます。
          </p>
        )}
        {error && (
          <p className="mx-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && <PhotoCalendar records={records} today={today} />}
      </div>
    </AppShell>
  )
}
