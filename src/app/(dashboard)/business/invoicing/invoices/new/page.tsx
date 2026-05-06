import Link from 'next/link'
import { getCustomers } from '@/lib/actions/customers'
import InvoiceForm from '@/components/invoicing/invoice-form'

export default async function NewInvoicePage() {
  const { data: customers } = await getCustomers()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/invoicing/invoices"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Invoices
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new invoice for a customer.
        </p>
      </div>

      <InvoiceForm
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
