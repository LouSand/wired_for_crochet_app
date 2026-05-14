import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMarketplacePattern, getPatternReviews } from '@/lib/actions/marketplace'
import PatternDetailActions from './PatternDetailActions'

export default async function MarketplacePatternPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: pattern } = await getMarketplacePattern(slug)

  if (!pattern) notFound()

  const { data: reviews, averageRating } = await getPatternReviews(pattern.id)
  const isFree = !pattern.price || pattern.price === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/marketplace" className="text-sm text-purple-600 hover:text-purple-700">
            ← Back to Marketplace
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pattern.title}</h1>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                  isFree ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {isFree ? 'Free' : `£${pattern.price?.toFixed(2)}`}
                </span>
                {pattern.category && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                    {pattern.category}
                  </span>
                )}
                {averageRating && (
                  <span className="flex items-center gap-1 text-sm text-amber-600">
                    ★ {averageRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {pattern.preview_description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{pattern.preview_description}</p>
              </div>
            )}

            {/* Pattern details */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Pattern Details</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {pattern.hook_size && (
                  <div>
                    <dt className="text-gray-500">Hook Size</dt>
                    <dd className="font-medium text-gray-900">{pattern.hook_size}</dd>
                  </div>
                )}
                {pattern.yarn_info && (
                  <div>
                    <dt className="text-gray-500">Yarn</dt>
                    <dd className="font-medium text-gray-900">{pattern.yarn_info}</dd>
                  </div>
                )}
                {pattern.gauge && (
                  <div className="col-span-2">
                    <dt className="text-gray-500">Gauge</dt>
                    <dd className="font-medium text-gray-900">{pattern.gauge}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="font-medium text-gray-900 capitalize">{pattern.type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Downloads</dt>
                  <dd className="font-medium text-gray-900">{pattern.purchase_count}</dd>
                </div>
              </dl>
            </div>

            {/* Tags */}
            {pattern.tags && pattern.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pattern.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reviews */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Reviews {reviews.length > 0 && `(${reviews.length})`}
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet. Be the first to review this pattern!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PatternDetailActions
                patternId={pattern.id}
                isFree={isFree}
                price={pattern.price}
                currency={pattern.currency}
                sellerName={pattern.seller?.display_name ?? 'Unknown'}
                sellerSlug={pattern.seller?.slug ?? ''}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
