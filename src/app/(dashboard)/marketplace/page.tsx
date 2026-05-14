import Link from 'next/link'
import { getMarketplacePatterns } from '@/lib/actions/marketplace'
import MarketplaceBrowser from './MarketplaceBrowser'

export const metadata = {
  title: 'Pattern Marketplace — Wired for Crochet',
  description: 'Browse and discover crochet patterns shared by the community. Free and paid patterns for all skill levels.',
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const search = typeof params.q === 'string' ? params.q : undefined
  const category = typeof params.category === 'string' ? params.category : undefined
  const sort = typeof params.sort === 'string' ? params.sort as 'newest' | 'popular' | 'price_low' | 'price_high' : 'newest'

  const { data: patterns, total } = await getMarketplacePatterns({
    search,
    category,
    sort,
    limit: 24,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-2">
            <Link href="/projects" className="text-sm text-purple-600 hover:text-purple-700">
              ← Back to My Projects
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pattern Marketplace</h1>
              <p className="mt-1 text-sm text-gray-600">
                Discover crochet patterns shared by the community
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/patterns"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                My Library
              </Link>
              <Link
                href="/marketplace/seller"
                className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Sell Patterns
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <MarketplaceBrowser
          patterns={patterns}
          total={total}
          initialSearch={search}
          initialCategory={category}
          initialSort={sort}
        />
      </main>
    </div>
  )
}
