import Link from 'next/link'
import { getSuppliers } from '@/lib/actions/suppliers'

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { search } = await searchParams
  const searchStr = typeof search === 'string' ? search : undefined
  const { data: suppliers, error } = await getSuppliers(searchStr)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your yarn and material suppliers.
          </p>
        </div>
        <Link
          href="/business/suppliers/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Add Supplier
        </Link>
      </div>

      {/* Search */}
      <form className="mt-6" action="/business/suppliers" method="GET">
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search suppliers by name..."
            defaultValue={searchStr ?? ''}
            className="block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Search
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Supplier list */}
      {suppliers && suppliers.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {searchStr
              ? 'No suppliers found matching your search.'
              : 'No suppliers yet. Add your first supplier to get started.'}
          </p>
        </div>
      )}

      {suppliers && suppliers.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-200" role="list">
            {suppliers.map((supplier) => (
              <li key={supplier.id}>
                <Link
                  href={`/business/suppliers/${supplier.id}`}
                  className="block px-4 py-4 hover:bg-gray-50 transition-colors sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-purple-700">
                        {supplier.name}
                      </p>
                      {supplier.website && (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {supplier.website}
                        </p>
                      )}
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
