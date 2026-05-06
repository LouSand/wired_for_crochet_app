import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getProduct, deleteProduct } from '@/lib/actions/business-products'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: product, error } = await getProduct(id)

  if (error || !product) {
    notFound()
  }

  async function handleDelete() {
    'use server'
    await deleteProduct(id)
    redirect('/business/products')
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/products"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Products
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900">
                ${Number(product.sell_price).toFixed(2)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  product.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/business/products/${id}/bom`}
              className="inline-flex items-center rounded-md border border-purple-300 bg-white px-3 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              BOM
            </Link>
            <Link
              href={`/business/products/${id}/edit`}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Edit
            </Link>
            <form action={handleDelete}>
              <button
                type="submit"
                className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete
              </button>
            </form>
          </div>
        </div>

        {product.description && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-gray-700">Description</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
              {product.description}
            </p>
          </div>
        )}

        {/* Product details */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {product.time_taken_minutes !== null && (
            <div>
              <p className="text-xs text-gray-500">Time to Produce</p>
              <p className="text-sm font-medium text-gray-900">
                {product.time_taken_minutes} minutes
              </p>
            </div>
          )}
          {product.wages_per_minute !== null && (
            <div>
              <p className="text-xs text-gray-500">Wages per Minute</p>
              <p className="text-sm font-medium text-gray-900">
                ${Number(product.wages_per_minute).toFixed(4)}
              </p>
            </div>
          )}
          {product.profit_margin_percent !== null && (
            <div>
              <p className="text-xs text-gray-500">Profit Margin</p>
              <p className="text-sm font-medium text-gray-900">
                {Number(product.profit_margin_percent).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
