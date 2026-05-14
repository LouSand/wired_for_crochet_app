'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PublishedPattern } from '@/types/marketplace'

interface MarketplaceBrowserProps {
  patterns: PublishedPattern[]
  total: number
  initialSearch?: string
  initialCategory?: string
  initialSort?: string
}

export default function MarketplaceBrowser({
  patterns,
  total,
  initialSearch = '',
  initialCategory = '',
  initialSort = 'newest',
}: MarketplaceBrowserProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (initialCategory) params.set('category', initialCategory)
    if (initialSort !== 'newest') params.set('sort', initialSort)
    router.push(`/marketplace?${params.toString()}`)
  }

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (initialCategory) params.set('category', initialCategory)
    if (sort !== 'newest') params.set('sort', sort)
    router.push(`/marketplace?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patterns..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </form>

        <select
          value={initialSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Results */}
      <p className="text-sm text-gray-500">{total} pattern{total !== 1 ? 's' : ''} available</p>

      {patterns.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No patterns yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Be the first to share a pattern with the community!
          </p>
          <Link
            href="/marketplace/seller"
            className="mt-4 inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Start Selling
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  )
}

function PatternCard({ pattern }: { pattern: PublishedPattern }) {
  const isFree = !pattern.price || pattern.price === 0

  return (
    <Link
      href={`/marketplace/${pattern.slug}`}
      className="group block rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-purple-200 transition-all overflow-hidden"
    >
      {/* Card content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2">
            {pattern.title}
          </h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            isFree ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {isFree ? 'Free' : `£${pattern.price?.toFixed(2)}`}
          </span>
        </div>

        {pattern.preview_description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{pattern.preview_description}</p>
        )}

        {/* Tags */}
        {pattern.tags && pattern.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {pattern.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          {pattern.category && <span>{pattern.category}</span>}
          {pattern.hook_size && <span>Hook: {pattern.hook_size}</span>}
          {pattern.purchase_count > 0 && (
            <span>{pattern.purchase_count} sold</span>
          )}
        </div>

        {/* Seller */}
        {pattern.seller && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700">
              {pattern.seller.display_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-600">{pattern.seller.display_name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
