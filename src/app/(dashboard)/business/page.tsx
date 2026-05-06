import Link from 'next/link'
import { getDashboardMetrics, getWhatCanIMake } from '@/lib/actions/dashboard'
import DashboardSummary from '@/components/business/DashboardSummary'
import ExpenseCategoryChart from '@/components/business/ExpenseCategoryChart'

export default async function BusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const start_date = typeof params.start_date === 'string' ? params.start_date : undefined
  const end_date = typeof params.end_date === 'string' ? params.end_date : undefined

  const { data: metrics, error } = await getDashboardMetrics({
    start_date,
    end_date,
  })

  const { data: whatCanIMake } = await getWhatCanIMake()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Overview of your crochet business performance.
      </p>

      {/* Date range filter */}
      <form className="mt-6" action="/business" method="GET">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label htmlFor="start_date" className="block text-xs font-medium text-gray-600">From</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              defaultValue={start_date ?? ''}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-xs font-medium text-gray-600">To</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              defaultValue={end_date ?? ''}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Apply
          </button>
          {(start_date || end_date) && (
            <Link
              href="/business"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Dashboard metrics */}
      {metrics && (
        <div className="mt-6 space-y-6">
          <DashboardSummary metrics={metrics} />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expense category chart */}
            <ExpenseCategoryChart categoryBreakdown={metrics.expenses_by_category} />

            {/* Top products */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
              {metrics.top_products.length === 0 ? (
                <p className="text-sm text-gray-500">No sales data available.</p>
              ) : (
                <ul className="space-y-3">
                  {metrics.top_products.map((product, index) => (
                    <li key={product.product_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                          {index + 1}
                        </span>
                        <Link
                          href={`/business/products/${product.product_id}`}
                          className="text-sm text-purple-700 hover:underline"
                        >
                          {product.name}
                        </Link>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ${product.total_revenue.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* What Can I Make? */}
          {whatCanIMake && whatCanIMake.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What Can I Make?</h3>
              <p className="text-xs text-gray-500 mb-3">
                Based on your current material stock and product BOMs.
              </p>
              <div className="space-y-3">
                {whatCanIMake.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                    <div>
                      <Link
                        href={`/business/products/${item.product_id}`}
                        className="text-sm font-medium text-purple-700 hover:underline"
                      >
                        {item.product_name}
                      </Link>
                      {item.limiting_materials.length > 0 && (
                        <p className="mt-1 text-xs text-red-600">
                          Insufficient: {item.limiting_materials.map(m =>
                            `need ${m.need} ${m.name} (have ${m.have})`
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${item.can_make > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Can make: {item.can_make} unit{item.can_make !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/business/suppliers"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">Suppliers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your yarn and material suppliers.
            </p>
          </Link>

          <Link
            href="/business/expenses"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
            <p className="mt-1 text-sm text-gray-500">
              Track business purchases and costs.
            </p>
          </Link>

          <Link
            href="/business/materials"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">Materials</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your materials inventory.
            </p>
          </Link>

          <Link
            href="/business/products"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your product catalog.
            </p>
          </Link>

          <Link
            href="/business/customers"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your customer database.
            </p>
          </Link>

          <Link
            href="/business/sales"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">Sales</h3>
            <p className="mt-1 text-sm text-gray-500">
              Track sales and revenue.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
