'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Pattern } from '@/types/database'

interface PatternListClientProps {
  patterns: Pattern[]
}

export default function PatternListClient({ patterns }: PatternListClientProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'written' | 'uploaded'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Extract unique categories from patterns
  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const p of patterns) {
      if (p.category) cats.add(p.category)
    }
    return Array.from(cats).sort()
  }, [patterns])

  // Filter patterns
  const filtered = useMemo(() => {
    return patterns.filter((p) => {
      // Search filter
      if (search) {
        const lower = search.toLowerCase()
        const matchesTitle = p.title.toLowerCase().includes(lower)
        const matchesHook = p.hook_size?.toLowerCase().includes(lower)
        const matchesIntro = p.introduction?.toLowerCase().includes(lower)
        const matchesCategory = p.category?.toLowerCase().includes(lower)
        if (!matchesTitle && !matchesHook && !matchesIntro && !matchesCategory) return false
      }
      // Type filter
      if (typeFilter !== 'all' && p.type !== typeFilter) return false
      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'uncategorised') {
          if (p.category) return false
        } else {
          if (p.category !== categoryFilter) return false
        }
      }
      return true
    })
  }, [patterns, search, typeFilter, categoryFilter])

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patterns..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'written' | 'uploaded')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="all">All types</option>
          <option value="written">Written</option>
          <option value="uploaded">Uploaded</option>
        </select>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All categories</option>
            <option value="uncategorised">Uncategorised</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Results count */}
      {(search || typeFilter !== 'all' || categoryFilter !== 'all') && (
        <p className="text-xs text-gray-500">
          Showing {filtered.length} of {patterns.length} patterns
          {search && <> matching &quot;{search}&quot;</>}
        </p>
      )}

      {/* Pattern grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No patterns match your filters</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setTypeFilter('all'); setCategoryFilter('all') }}
            className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pattern) => (
            <Link
              key={pattern.id}
              href={`/patterns/${pattern.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {pattern.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        pattern.type === 'written'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {pattern.type === 'written' ? 'Written' : 'Uploaded'}
                    </span>
                    {pattern.category && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs font-medium">
                        {pattern.category}
                      </span>
                    )}
                  </div>
                  {pattern.hook_size && (
                    <p className="mt-1 text-xs text-gray-500">
                      Hook: {pattern.hook_size}
                    </p>
                  )}
                  {pattern.introduction && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {pattern.introduction}
                    </p>
                  )}
                </div>
                <svg
                  className="ml-2 h-5 w-5 flex-shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
