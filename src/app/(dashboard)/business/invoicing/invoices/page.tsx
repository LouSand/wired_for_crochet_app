import Link from 'next/link'
import { getInvoices, checkOverdueInvoices } from '@/lib/actions/invoices'
import InvoiceList from '@/components/invoicing/invoice-list'

export default async function InvoicesPage() {
  // Check and update overdue statuses before fetching
  await checkOverdueInvoices()
  const { data: invoices, error } = await getInvoices()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your invoices and track payments.
          </p>
        </div>
        <Link
          href="/business/invoicing/invoices/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          + New Invoice
        </Link>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <InvoiceList invoices={invoices ?? []} />
      )}
    </div>
  )
}
