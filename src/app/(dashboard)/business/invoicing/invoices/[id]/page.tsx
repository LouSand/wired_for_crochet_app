import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoice, deleteInvoice } from '@/lib/actions/invoices'
import InvoiceDetail from '@/components/invoicing/invoice-detail'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: invoice, error } = await getInvoice(id)

  if (error || !invoice) {
    notFound()
  }

  async function handleDelete() {
    'use server'
    const result = await deleteInvoice(id)
    if (result.success) {
      redirect('/business/invoicing/invoices')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/invoicing/invoices"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Invoices
        </Link>
      </div>

      <InvoiceDetail invoice={invoice} />

      {/* Server-side delete action */}
      {invoice.status === 'draft' && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <form action={handleDelete}>
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete Invoice
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
