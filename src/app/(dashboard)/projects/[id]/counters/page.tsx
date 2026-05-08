import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCounters, createCounter } from '@/lib/actions/counters'
import Counter from '@/components/counters/Counter'
import NewCounterForm from './NewCounterForm'

export default async function CountersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: counters, error } = await getCounters(id)

  if (error && !counters) {
    notFound()
  }

  const counterList = counters ?? []

  // Bind projectId to createCounter for the form
  const createCounterWithProject = createCounter.bind(null, id)

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          ← Back to project
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Counters</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track rows, stitches, repeats, and more
        </p>
      </div>

      {/* New counter form */}
      <NewCounterForm action={createCounterWithProject} />

      {/* Counter list */}
      {counterList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            No counters yet. Add one above to start tracking.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {counterList.map((counter) => (
            <Counter key={counter.id} counter={counter} />
          ))}
        </div>
      )}
    </div>
  )
}
