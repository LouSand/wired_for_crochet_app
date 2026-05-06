import Link from 'next/link'
import { getProducts } from '@/lib/actions/business-products'
import { getSettings } from '@/lib/actions/settings'
import { formatCurrency } from '@/lib/currency'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const showDiscontinued = params.show_discontinued === 'true'

  const [{ data: products, error }, settings] = await Promise.all([
    getProducts(showDiscontinued),
    getSettings(),
  ])
  const currency = settings.default_currency

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your product catalog.
          </p>
        </div>
        <Link
          href="/business/products/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Add Product
        </Link>
      </div>

      {/* Toggle discontinued */}
      <div className="mt-6">
        {showDiscontinued ? (
          <Link
            href="/business/products"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Hide discontinued products
          </Link>
        ) : (
          <Link
            href="/business/products?show_discontinued=true"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Show discontinued products
          </Link>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Product list */}
      {products && products.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {showDiscontinued
              ? 'No products found.'
              : 'No active products yet. Add your first product to get started.'}
          </p>
        </div>
      )}

      {products && products.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-200" role="list">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/business/products/${product.id}`}
                  className="block px-4 py-4 hover:bg-gray-50 transition-colors sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-purple-700">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatCurrency(Number(product.sell_price), currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
