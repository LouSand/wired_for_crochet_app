import { notFound } from 'next/navigation'
import { getYarnEntry } from '@/lib/actions/yarn'
import YarnEditForm from './YarnEditForm'

export default async function YarnEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: yarnEntry, error } = await getYarnEntry(id)

  if (error || !yarnEntry) {
    notFound()
  }

  return <YarnEditForm yarnEntry={yarnEntry} />
}
