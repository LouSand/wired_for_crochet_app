import Link from 'next/link'
import type { InvoiceWithDetails, InvoiceStatus } from '@/types/invoicing'

interface InvoiceDetailProps {
  invoice: InvoiceWithDetails
}

const STATUS_BADGES: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  unpaid: { label: 'Unpaid', className: 'bg-yellow-100 text-yellow-800' },
  partial: { label: 'Partial', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
}

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const badge = STATUS_BADGES[invoice.status]
  const balance = Number(invoice.total) - Number(invoice.amount_paid)
  const canEdit = invoice.status === 'draft' || invoice.status === 'unpaid'
  const canDelete = invoice.status === 'draft'

  // Stage payment calculations
  const depositAmount = (Number(invoice.total) * invoice.deposit_percent) / 100
  const stage2Amount = (Number(invoice.total) * invoice.stage2_percent) / 100
  const finalAmount = (Number(invoice.total) * invoice.final_percent) / 100

  const depositThreshold = depositAmount
  const stage2Threshold = depositAmount + stage2Amount
  const finalThreshold = Number(invoice.total)

  const amountPaid = Number(invoice.amount_paid)
  const depositCovered = amountPaid >= depositThreshold
  const stage2Covered = amountPaid >= stage2Threshold
  const finalCovered = amountPaid >= finalThreshold

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {invoice.customer?.name}
            </p>
          </div>

          <div className="flex gap-2">
            {canEdit && (
              <Link
                href={`/business/invoicing/invoices/${invoice.id}/edit`}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Edit
              </Link>
            )}
            {canDelete && (
              <form action={`/business/invoicing/invoices/${invoice.id}`} method="POST">
                <button
                  type="submit"
                  name="_action"
                  value="delete"
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                >
                  Delete
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Issue Date</p>
            <p className="text-sm text-gray-900">{invoice.issue_date}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Due Date</p>
            <p className="text-sm text-gray-900">{invoice.due_date}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total</p>
            <p className="text-sm font-medium text-gray-900">£{Number(invoice.total).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Balance Due</p>
            <p className="text-sm font-bold text-gray-900">£{balance.toFixed(2)}</p>
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
            {invoice.items.map((item) => (
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
                Invoice Total
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                £{Number(invoice.total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Stage Payment Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage Payments</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${depositCovered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {depositCovered ? '✓' : '1'}
              </span>
              <span className="text-sm text-gray-700">
                Deposit ({invoice.deposit_percent}%)
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">£{depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${stage2Covered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {stage2Covered ? '✓' : '2'}
              </span>
              <span className="text-sm text-gray-700">
                Stage 2 ({invoice.stage2_percent}%)
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">£{stage2Amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${finalCovered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {finalCovered ? '✓' : '3'}
              </span>
              <span className="text-sm text-gray-700">
                Final ({invoice.final_percent}%)
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">£{finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        {invoice.payments.length === 0 ? (
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500">No payments recorded yet.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-3 text-sm text-gray-900">{payment.payment_date}</td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-green-700">
                    £{Number(payment.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Balance Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Paid</span>
          <span className="text-sm text-gray-900">£{amountPaid.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
          <span className="text-sm font-bold text-gray-900">Remaining Balance</span>
          <span className="text-lg font-bold text-gray-900">£{balance.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
