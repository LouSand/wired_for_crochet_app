'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getMyLibrary } from '@/lib/actions/marketplace'

export default function LibraryPage() {
  const [library, setLibrary] = useState<Array<{ pattern_id: string; title: string; type: string; created_at: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await getMyLibrary()
      setLibrary(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/marketplace" className="text-sm text-purple-600 hover:text-purple-700">
            ← Back to Marketplace
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">My Library</h1>
          <p className="mt-1 text-sm text-gray-600">
            Patterns you&apos;ve acquired from the marketplace
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : library.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your library is empty</h3>
            <p className="mt-2 text-sm text-gray-500">
              Browse the marketplace to find patterns to add to your collection.
            </p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Browse Patterns
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {library.map((item) => (
              <Link
                key={item.pattern_id}
                href={`/patterns/${item.pattern_id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
              >
                <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.type === 'written' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {item.type === 'written' ? 'Written' : 'Uploaded'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Added {new Date(item.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
