import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getQuote } from '@/lib/actions/quotes'
import { getCustomers } from '@/lib/actions/customers'
import QuoteForm from '@/components/invoicing/quote-form'

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [quoteResult, customersResult] = await Promise.all([
    getQuote(id),
    getCustomers(),
  ])

  const quote = quoteResult.data
  const customers = customersResult.data

  if (!quote) {
    notFound()
  }

  // Only draft quotes can be edited
  if (quote.status !== 'draft') {
    return (
      <div>
        <div className="mb-6">
          <Link
            href={`/business/invoicing/quotes/${id}`}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            ← Back to Quote
          </Link>
        </div>
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">
            This quote cannot be edited because its status is &quot;{quote.status}&quot;.
            Only draft quotes can be modified.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/business/invoicing/quotes/${id}`}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Quote
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Edit {quote.quote_number}
        </h1>
      </div>

      <QuoteForm
        quote={{ ...quote, items: quote.items }}
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
