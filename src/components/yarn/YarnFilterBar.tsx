'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { YARN_WEIGHT_CATEGORIES } from '@/lib/validators/yarn'

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function YarnFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('search') ?? ''
  const currentWeight = searchParams.get('weight_category') ?? ''

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
      {/* Search input */}
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="yarn-search" className="sr-only">
          Search yarn
        </label>
        <input
          type="search"
          id="yarn-search"
          placeholder="Search by name, brand, or colour..."
          defaultValue={currentSearch}
          onChange={(e) => updateParams('search', e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Weight category filter */}
      <div>
        <label htmlFor="filter-weight" className="sr-only">
          Filter by weight category
        </label>
        <select
          id="filter-weight"
          value={currentWeight}
          onChange={(e) => updateParams('weight_category', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">All Weights</option>
          {YARN_WEIGHT_CATEGORIES.map((weight) => (
            <option key={weight} value={weight}>
              {formatLabel(weight)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
