import Link from 'next/link'
import { getCustomers } from '@/lib/actions/customers'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : undefined

  const { data: customers, error } = await getCustomers(search)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your customer database.
          </p>
        </div>
        <Link
          href="/business/customers/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Add Customer
        </Link>
      </div>

      {/* Search */}
      <form className="mt-6" action="/business/customers" method="GET">
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search by name or email..."
            defaultValue={search ?? ''}
            className="block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Search
          </button>
          {search && (
            <Link
              href="/business/customers"
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

      {/* Customer list */}
      {customers && customers.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {search
              ? 'No customers found matching your search.'
              : 'No customers yet. Add your first customer to get started.'}
          </p>
        </div>
      )}

      {customers && customers.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-200" role="list">
            {customers.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/business/customers/${customer.id}`}
                  className="block px-4 py-4 hover:bg-gray-50 transition-colors sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-purple-700">
                        {customer.name}
                      </p>
                      <div className="mt-1 flex gap-3">
                        {customer.email && (
                          <p className="truncate text-xs text-gray-500">
                            {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-xs text-gray-500">
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
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
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
