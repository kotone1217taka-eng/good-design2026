import { notFound } from 'next/navigation'
import { MOCK_RECORDS, TODAY } from '@/lib/mock-data'
import { RecordDetailClient } from './record-detail-client'

const staticRecordIds = new Set([
  ...MOCK_RECORDS.map((record) => record.id),
  `rec-${TODAY}`,
])

export function generateStaticParams() {
  return [...staticRecordIds].map((id) => ({ id }))
}

export const dynamicParams = false

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!staticRecordIds.has(id)) {
    notFound()
  }

  return <RecordDetailClient id={id} />
}
