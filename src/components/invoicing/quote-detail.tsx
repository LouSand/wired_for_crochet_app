'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { QuoteWithDetails, QuoteStatus } from '@/types/invoicing'
import { convertQuoteToInvoice } from '@/lib/actions/quotes'

interface QuoteDetailProps {
  quote: QuoteWithDetails
}

const STATUS_BADGES: Record<QuoteStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', className: 'bg-yellow-100 text-yellow-800' },
}

export default function QuoteDetail({ quote }: QuoteDetailProps) {
  const router = useRouter()
  const badge = STATUS_BADGES[quote.status]
  const canEdit = quote.status === 'draft'
  const canDelete = quote.status === 'draft'
  const canConvert = quote.status === 'draft' || quote.status === 'sent'

  const [showConvertModal, setShowConvertModal] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState<string | null>(null)

  async function handleConvert() {
    if (!dueDate) {
      setConvertError('Please select a due date.')
      return
    }

    setConverting(true)
    setConvertError(null)

    const result = await convertQuoteToInvoice(quote.id, dueDate)

    if (result.success && result.data?.id) {
      router.push(`/business/invoicing/invoices/${result.data.id}`)
    } else {
      setConvertError(result.error || 'Failed to convert quote.')
      setConverting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{quote.quote_number}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {quote.customer?.name}
            </p>
          </div>

          <div className="flex gap-2">
            {canConvert && (
              <button
                type="button"
                onClick={() => setShowConvertModal(true)}
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
              >
                Convert to Invoice
              </button>
            )}
            {canEdit && (
              <Link
                href={`/business/invoicing/quotes/${quote.id}/edit`}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Edit
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Issue Date</p>
            <p className="text-sm text-gray-900">{quote.issue_date}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total</p>
            <p className="text-sm font-medium text-gray-900">£{Number(quote.total).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Customer Email</p>
            <p className="text-sm text-gray-900">{quote.customer?.email || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Qty
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Unit Price
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quote.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-3 text-sm text-gray-900">{item.description}</td>
                <td className="px-6 py-3 text-right text-sm text-gray-900">{item.quantity}</td>
                <td className="px-6 py-3 text-right text-sm text-gray-900">
                  £{Number(item.unit_price).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  £{Number(item.line_total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                Quote Total
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                £{Number(quote.total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Email History */}
      {quote.email_logs.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Email History</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sent To
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Times Sent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quote.email_logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-3 text-sm text-gray-900">{log.recipient}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(log.sent_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-900">{log.send_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Convert to Invoice Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Convert to Invoice</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will create a new invoice from this quote and mark the quote as accepted.
            </p>

            {convertError && (
              <div className="mt-3 rounded-md bg-red-50 p-3" role="alert">
                <p className="text-sm text-red-700">{convertError}</p>
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="convert_due_date" className="block text-sm font-medium text-gray-700">
                Invoice Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="convert_due_date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConvertModal(false)
                  setConvertError(null)
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                disabled={converting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={converting}
                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {converting ? 'Converting...' : 'Convert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
