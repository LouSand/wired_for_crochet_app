import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCustomer, deleteCustomer } from '@/lib/actions/customers'
import { getInvoices } from '@/lib/actions/invoices'
import { getQuotes } from '@/lib/actions/quotes'
import { getSubscriptionTier } from '@/lib/actions/business-gate'

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

  // Fetch invoices and quotes for this customer (pro_plus only, will return null if not on tier)
  const tier = await getSubscriptionTier()
  const isProPlus = tier === 'pro_plus'

  let customerInvoices: { id: string; invoice_number: string; total: number; status: string }[] = []
  let customerQuotes: { id: string; quote_number: string; total: number; status: string }[] = []

  if (isProPlus) {
    const [invoiceResult, quoteResult] = await Promise.all([
      getInvoices({ customer_id: id }),
      getQuotes({ customer_id: id }),
    ])
    customerInvoices = (invoiceResult.data ?? []).map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      total: Number(inv.total),
      status: inv.status,
    }))
    customerQuotes = (quoteResult.data ?? []).map((q) => ({
      id: q.id,
      quote_number: q.quote_number,
      total: Number(q.total),
      status: q.status,
    }))
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

      {/* Invoices for this customer (Pro+ only) */}
      {isProPlus && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
          {customerInvoices.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <ul className="divide-y divide-gray-200" role="list">
                {customerInvoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href={`/business/invoicing/invoices/${inv.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-purple-600">{inv.invoice_number}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-900">£{inv.total.toFixed(2)}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                          {inv.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No invoices for this customer yet.</p>
          )}
        </div>
      )}

      {/* Quotes for this customer (Pro+ only) */}
      {isProPlus && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
          {customerQuotes.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <ul className="divide-y divide-gray-200" role="list">
                {customerQuotes.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/business/invoicing/quotes/${q.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-purple-600">{q.quote_number}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-900">£{q.total.toFixed(2)}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                          {q.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No quotes for this customer yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
