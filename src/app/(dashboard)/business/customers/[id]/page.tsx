import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCustomer, deleteCustomer } from '@/lib/actions/customers'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: customer, error } = await getCustomer(id)

  if (error || !customer) {
    notFound()
  }

  async function handleDelete() {
    'use server'
    await deleteCustomer(id)
    redirect('/business/customers')
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/customers"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Customers
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <div className="mt-2 space-y-1">
              {customer.email && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span>{' '}
                  <a href={`mailto:${customer.email}`} className="text-purple-600 hover:underline">
                    {customer.email}
                  </a>
                </p>
              )}
              {customer.phone && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {customer.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
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

        {customer.address && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-gray-700">Address</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
              {customer.address}
            </p>
          </div>
        )}

        {customer.notes && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-gray-700">Notes</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
              {customer.notes}
            </p>
          </div>
        )}
      </div>

      {/* Linked projects */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Linked Projects</h2>

        {customer.customer_projects && customer.customer_projects.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <ul className="divide-y divide-gray-200" role="list">
              {customer.customer_projects.map((cp) => (
                <li key={cp.id} className="px-4 py-3">
                  <Link
                    href={`/projects/${cp.project_id}`}
                    className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    Project {cp.project_id.slice(0, 8)}...
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No projects linked to this customer yet.
          </p>
        )}
      </div>
    </div>
  )
}
