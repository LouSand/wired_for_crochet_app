import Link from 'next/link'
import type { QuoteRow, QuoteStatus } from '@/types/invoicing'

interface QuoteWithCustomer extends QuoteRow {
  customer: { name: string }
}

interface QuoteListProps {
  quotes: QuoteWithCustomer[]
}

const STATUS_BADGES: Record<QuoteStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', className: 'bg-yellow-100 text-yellow-800' },
}

export default function QuoteList({ quotes }: QuoteListProps) {
  if (quotes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No quotes found.</p>
        <Link
          href="/business/invoicing/quotes/new"
          className="mt-4 inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
        >
          Create Your First Quote
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Quote #
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Client
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Total
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {quotes.map((quote) => {
            const badge = STATUS_BADGES[quote.status]

            return (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/business/invoicing/quotes/${quote.id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    {quote.quote_number}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {quote.customer?.name ?? 'Unknown'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                  £{Number(quote.total).toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {quote.issue_date}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
