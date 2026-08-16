'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PhotoCalendar } from '@/components/photo-calendar'
import { RecordDetailClient } from '@/components/record-detail-client'
import { useRecords } from '@/lib/records-store'

export default function FutoshotPage() {
  return (
    <Suspense fallback={<FutoshotLoading />}>
      <FutoshotPageContent />
    </Suspense>
  )
}

function FutoshotPageContent() {
  const searchParams = useSearchParams()
  const selectedRecordId = searchParams.get('record')
  const { records, today, loading, error } = useRecords()

  if (selectedRecordId) {
    return <RecordDetailClient id={selectedRecordId} />
  }

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

function FutoshotLoading() {
  return (
    <AppShell showAuth={false}>
      <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        フトショットを読み込んでいます。
      </div>
    </AppShell>
  )
}
