import Link from 'next/link'
import { getDashboardMetrics, getWhatCanIMake } from '@/lib/actions/dashboard'
import { getSettings } from '@/lib/actions/settings'
import { formatCurrency } from '@/lib/currency'
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

  const [{ data: metrics, error }, { data: whatCanIMake }, settings] = await Promise.all([
    getDashboardMetrics({ start_date, end_date }),
    getWhatCanIMake(),
    getSettings(),
  ])

  const currency = settings.default_currency

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your crochet business performance.
          </p>
        </div>
        <Link
          href="/business/tax-return"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Tax Return
        </Link>
        <Link
          href="/business/universal-credit"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
          UC Reporting
        </Link>
      </div>

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
          <DashboardSummary metrics={metrics} currency={currency} />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expense category chart */}
            <ExpenseCategoryChart categoryBreakdown={metrics.expenses_by_category} currency={currency} />

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
                        {formatCurrency(product.total_revenue, currency)}
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

          <Link
            href="/business/invoicing"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">Invoicing</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create invoices, quotes, and track payments.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
