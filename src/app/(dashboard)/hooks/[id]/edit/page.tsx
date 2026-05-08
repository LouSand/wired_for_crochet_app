import { notFound } from 'next/navigation'
import { getHookEntry } from '@/lib/actions/hooks'
import HookEditForm from './HookEditForm'

export default async function HookEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: hookEntry, error } = await getHookEntry(id)

  if (error || !hookEntry) {
    notFound()
  }

  return <HookEditForm hookEntry={hookEntry} />
}
