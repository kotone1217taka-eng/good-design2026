import { FeedbackClient } from './feedback-client'

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <FeedbackClient id={id} />
}
