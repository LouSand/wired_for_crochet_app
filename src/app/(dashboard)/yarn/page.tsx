import Link from 'next/link'
import { getYarnEntries } from '@/lib/actions/yarn'
import { YARN_WEIGHT_CATEGORIES } from '@/lib/validators/yarn'
import EmptyState from '@/components/ui/EmptyState'
import YarnFilterBar from '@/components/yarn/YarnFilterBar'
import YarnCard from '@/components/yarn/YarnCard'

export default async function YarnPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const search = typeof params.search === 'string' ? params.search : undefined
  const weight_category = typeof params.weight_category === 'string' ? params.weight_category : undefined

  const { data: yarnEntries, error } = await getYarnEntries({
    search,
    weight_category,
  })

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yarn Inventory</h1>
        <Link
          href="/yarn/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Yarn
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mt-6">
        <YarnFilterBar />
      </div>

      {/* Yarn grid */}
      <div className="mt-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!error && yarnEntries && yarnEntries.length === 0 && (
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            }
            title="No yarn in your inventory"
            description="Start building your yarn stash by adding your first entry."
            actionLabel="Add Yarn"
            actionHref="/yarn/new"
          />
        )}

        {!error && yarnEntries && yarnEntries.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {yarnEntries.map((yarn) => (
              <YarnCard key={yarn.id} yarn={yarn} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
