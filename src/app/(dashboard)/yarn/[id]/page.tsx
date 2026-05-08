import { notFound } from 'next/navigation'
import { getYarnEntry } from '@/lib/actions/yarn'
import YarnDetailClient from './YarnDetailClient'

export default async function YarnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: yarnEntry, error } = await getYarnEntry(id)

  if (error || !yarnEntry) {
    notFound()
  }

  return <YarnDetailClient yarnEntry={yarnEntry} />
}
