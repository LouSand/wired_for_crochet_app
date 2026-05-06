import { notFound } from 'next/navigation'
import { getHookEntry } from '@/lib/actions/hooks'
import HookDetailClient from './HookDetailClient'

export default async function HookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: hookEntry, error } = await getHookEntry(id)

  if (error || !hookEntry) {
    notFound()
  }

  return <HookDetailClient hookEntry={hookEntry} />
}
