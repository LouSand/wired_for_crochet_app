'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { PROJECT_STATUSES, PROJECT_DIFFICULTIES } from '@/lib/validators/project'

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'date_started', label: 'Date Started' },
  { value: 'status', label: 'Status' },
  { value: 'difficulty', label: 'Difficulty' },
] as const

export default function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') ?? ''
  const currentDifficulty = searchParams.get('difficulty') ?? ''
  const currentSort = searchParams.get('sortBy') ?? 'created_at'
  const currentDirection = searchParams.get('sortDirection') ?? 'desc'

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <div>
        <label htmlFor="filter-status" className="sr-only">
          Filter by status
        </label>
        <select
          id="filter-status"
          value={currentStatus}
          onChange={(e) => updateParams('status', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">All Statuses</option>
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty filter */}
      <div>
        <label htmlFor="filter-difficulty" className="sr-only">
          Filter by difficulty
        </label>
        <select
          id="filter-difficulty"
          value={currentDifficulty}
          onChange={(e) => updateParams('difficulty', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">All Difficulties</option>
          {PROJECT_DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Sort control */}
      <div>
        <label htmlFor="sort-by" className="sr-only">
          Sort by
        </label>
        <select
          id="sort-by"
          value={currentSort}
          onChange={(e) => updateParams('sortBy', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort direction toggle */}
      <button
        type="button"
        onClick={() =>
          updateParams('sortDirection', currentDirection === 'asc' ? 'desc' : 'asc')
        }
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors"
        aria-label={`Sort ${currentDirection === 'asc' ? 'descending' : 'ascending'}`}
      >
        {currentDirection === 'asc' ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
    </div>
  )
}
