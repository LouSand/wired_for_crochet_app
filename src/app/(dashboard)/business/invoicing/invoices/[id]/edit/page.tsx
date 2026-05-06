import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoice } from '@/lib/actions/invoices'
import { getCustomers } from '@/lib/actions/customers'
import InvoiceForm from '@/components/invoicing/invoice-form'

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [invoiceResult, customersResult] = await Promise.all([
    getInvoice(id),
    getCustomers(),
  ])

  const invoice = invoiceResult.data
  const customers = customersResult.data

  if (!invoice) {
    notFound()
  }

  // Only draft or unpaid invoices can be edited
  if (invoice.status !== 'draft' && invoice.status !== 'unpaid') {
    return (
      <div>
        <div className="mb-6">
          <Link
            href={`/business/invoicing/invoices/${id}`}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            ← Back to Invoice
          </Link>
        </div>
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">
            This invoice cannot be edited because its status is &quot;{invoice.status}&quot;.
            Only draft or unpaid invoices can be modified.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/business/invoicing/invoices/${id}`}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Invoice
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Edit {invoice.invoice_number}
        </h1>
      </div>

      <InvoiceForm
        invoice={{ ...invoice, items: invoice.items }}
        customers={(customers ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
        }))}
      />
    </div>
  )
}
