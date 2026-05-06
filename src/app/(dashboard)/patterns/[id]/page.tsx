import { notFound } from 'next/navigation'
import { getPattern } from '@/lib/actions/patterns'
import { getPatternYarnRequirements } from '@/lib/actions/pattern-yarn'
import { getPatternPhotos } from '@/lib/actions/pattern-photos'
import PatternDetailClient from './PatternDetailClient'
import PatternYarnRequirements from '@/components/patterns/PatternYarnRequirements'
import PatternPhotos from '@/components/patterns/PatternPhotos'

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ data: pattern, error }, { data: yarnRequirements }, { data: photos }] = await Promise.all([
    getPattern(id),
    getPatternYarnRequirements(id),
    getPatternPhotos(id),
  ])

  if (error || !pattern) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PatternDetailClient pattern={pattern} />
      <PatternPhotos patternId={id} photos={photos ?? []} />
      <PatternYarnRequirements
        patternId={id}
        requirements={yarnRequirements ?? []}
      />
    </div>
  )
}
