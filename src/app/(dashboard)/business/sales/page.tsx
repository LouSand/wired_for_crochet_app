import Link from 'next/link'
import { getSales } from '@/lib/actions/sales'
import { getProducts } from '@/lib/actions/business-products'
import { getCustomers } from '@/lib/actions/customers'

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const product_id = typeof params.product_id === 'string' ? params.product_id : undefined
  const customer_id = typeof params.customer_id === 'string' ? params.customer_id : undefined
  const start_date = typeof params.start_date === 'string' ? params.start_date : undefined
  const end_date = typeof params.end_date === 'string' ? params.end_date : undefined

  const { data: sales, error } = await getSales({
    product_id,
    customer_id,
    start_date,
    end_date,
  })

  const { data: products } = await getProducts(true)
  const { data: customers } = await getCustomers()

  const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.sale_price), 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your sales and revenue.
          </p>
        </div>
        <Link
          href="/business/sales/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Record Sale
        </Link>
      </div>

      {/* Running total */}
      <div className="mt-4 rounded-md bg-green-50 p-4">
        <p className="text-sm text-green-700">
          Total Revenue: <span className="font-semibold">${totalRevenue.toFixed(2)}</span>
        </p>
      </div>

      {/* Filters */}
      <form className="mt-6" action="/business/sales" method="GET">
        <div className="flex flex-wrap gap-3">
          <select
            name="product_id"
            defaultValue={product_id ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Products</option>
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            name="customer_id"
            defaultValue={customer_id ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Customers</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="start_date"
            defaultValue={start_date ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <input
            type="date"
            name="end_date"
            defaultValue={end_date ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Filter
          </button>

          {(product_id || customer_id || start_date || end_date) && (
            <Link
              href="/business/sales"
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

      {/* Sales list */}
      {sales && sales.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            No sales found. Record your first sale to get started.
          </p>
        </div>
      )}

      {sales && sales.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((sale) => {
                const productName = products?.find((p) => p.id === sale.product_id)?.name
                const customerName = customers?.find((c) => c.id === sale.customer_id)?.name
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {sale.sale_date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {productName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customerName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {sale.quantity_sold}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      ${Number(sale.sale_price).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
