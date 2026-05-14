import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { SellerProfile, PublishedPattern } from '@/types/marketplace'

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch seller profile
  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!seller) notFound()

  const sellerProfile = seller as unknown as SellerProfile

  // Fetch their published patterns
  const { data: patterns } = await supabase
    .from('patterns')
    .select('*')
    .eq('user_id', sellerProfile.user_id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const publishedPatterns = (patterns ?? []) as unknown as PublishedPattern[]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/marketplace" className="text-sm text-purple-600 hover:text-purple-700">
            ← Back to Marketplace
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Seller header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-700">
            {sellerProfile.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sellerProfile.display_name}</h1>
            {sellerProfile.bio && (
              <p className="mt-1 text-sm text-gray-600">{sellerProfile.bio}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {publishedPatterns.length} pattern{publishedPatterns.length !== 1 ? 's' : ''} published
            </p>
          </div>
        </div>

        {/* Patterns grid */}
        {publishedPatterns.length === 0 ? (
          <p className="text-sm text-gray-500">This seller hasn&apos;t published any patterns yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publishedPatterns.map((pattern) => {
              const isFree = !pattern.price || pattern.price === 0
              return (
                <Link
                  key={pattern.id}
                  href={`/marketplace/${pattern.slug}`}
                  className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{pattern.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                      isFree ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {isFree ? 'Free' : `£${pattern.price?.toFixed(2)}`}
                    </span>
                  </div>
                  {pattern.preview_description && (
                    <p className="mt-2 text-xs text-gray-600 line-clamp-2">{pattern.preview_description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    {pattern.category && <span>{pattern.category}</span>}
                    {pattern.purchase_count > 0 && <span>• {pattern.purchase_count} sold</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
