import Link from 'next/link'
import { getPatterns } from '@/lib/actions/patterns'
import EmptyState from '@/components/ui/EmptyState'
import BulkPatternUploader from '@/components/patterns/BulkPatternUploader'
import PatternListClient from './PatternListClient'

export default async function PatternsPage() {
  const { data: patterns, error } = await getPatterns()

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Patterns</h1>
        <Link
          href="/patterns/new"
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
          New Pattern
        </Link>
      </div>

      {/* Bulk uploader */}
      <div className="mt-6">
        <BulkPatternUploader />
      </div>

      {/* Pattern list with search/filter */}
      <div className="mt-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!error && patterns && patterns.length === 0 && (
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            }
            title="No patterns yet"
            description="Create your first pattern to get started. You can write patterns directly or upload existing ones."
            actionLabel="New Pattern"
            actionHref="/patterns/new"
          />
        )}

        {!error && patterns && patterns.length > 0 && (
          <PatternListClient patterns={patterns} />
        )}
      </div>
    </div>
  )
}
