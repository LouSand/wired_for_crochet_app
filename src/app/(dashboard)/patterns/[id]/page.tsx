import { notFound } from 'next/navigation'
import { getPattern } from '@/lib/actions/patterns'
import PatternDetailClient from './PatternDetailClient'

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: pattern, error } = await getPattern(id)

  if (error || !pattern) {
    notFound()
  }

  return <PatternDetailClient pattern={pattern} />
}
