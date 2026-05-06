import { notFound } from 'next/navigation'
import { getPattern } from '@/lib/actions/patterns'
import { getPatternYarnRequirements } from '@/lib/actions/pattern-yarn'
import PatternDetailClient from './PatternDetailClient'
import PatternYarnRequirements from '@/components/patterns/PatternYarnRequirements'

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ data: pattern, error }, { data: yarnRequirements }] = await Promise.all([
    getPattern(id),
    getPatternYarnRequirements(id),
  ])

  if (error || !pattern) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PatternDetailClient pattern={pattern} />
      <PatternYarnRequirements
        patternId={id}
        requirements={yarnRequirements ?? []}
      />
    </div>
  )
}
