import Link from 'next/link'
import { getCustomers } from '@/lib/actions/customers'
import QuoteForm from '@/components/invoicing/quote-form'

export default async function NewQuotePage() {
  const { data: customers } = await getCustomers()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/invoicing/quotes"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Quotes
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create Quote</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new quote for a customer.
        </p>
      </div>

      <QuoteForm
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
