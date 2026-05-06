import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSupplier, deleteSupplier } from '@/lib/actions/suppliers'
import { getSettings } from '@/lib/actions/settings'
import { formatCurrency } from '@/lib/currency'

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ data: supplier, error }, settings] = await Promise.all([
    getSupplier(id),
    getSettings(),
  ])
  const currency = settings.default_currency

  if (error || !supplier) {
    notFound()
  }

  async function handleDelete() {
    'use server'
    await deleteSupplier(id)
    redirect('/business/suppliers')
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/suppliers"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Suppliers
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            {supplier.website && (
              <a
                href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-purple-600 hover:text-purple-700 hover:underline"
              >
                {supplier.website}
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/business/suppliers/${id}/edit`}
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

        {supplier.notes && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-gray-700">Notes</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
              {supplier.notes}
            </p>
          </div>
        )}
      </div>

      {/* Linked purchases */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Purchase History</h2>

        {supplier.purchases && supplier.purchases.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supplier.purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {purchase.purchase_date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {purchase.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {purchase.category.replace(/_/g, ' ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(Number(purchase.cost), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No purchases linked to this supplier yet.
          </p>
        )}
      </div>
    </div>
  )
}
