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

      {/* Stitches Used */}
      {pattern.stitches_used && (pattern.stitches_used as string[]).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Stitches Used</h3>
          <div className="flex flex-wrap gap-2">
            {(pattern.stitches_used as string[]).map((stitch) => (
              <span
                key={stitch}
                className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {stitch}
              </span>
            ))}
          </div>
        </div>
      )}

      <PatternPhotos patternId={id} photos={photos ?? []} />
      <PatternYarnRequirements
        patternId={id}
        requirements={yarnRequirements ?? []}
      />
    </div>
  )
}
