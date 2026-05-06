'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deletePayment } from '@/lib/actions/payments'
import type { PaymentRow } from '@/types/invoicing'

interface PaymentHistoryProps {
  payments: PaymentRow[]
  invoiceId: string
}

export default function PaymentHistory({ payments, invoiceId }: PaymentHistoryProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(paymentId: string) {
    if (!confirm('Are you sure you want to delete this payment?')) return

    setDeletingId(paymentId)
    const result = await deletePayment(paymentId, invoiceId)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to delete payment.')
    }
    setDeletingId(null)
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-gray-500">No payments recorded yet.</p>
    )
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            Date
          </th>
          <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
            Amount
          </th>
          <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {payments.map((payment) => (
          <tr key={payment.id}>
            <td className="px-6 py-3 text-sm text-gray-900">{payment.payment_date}</td>
            <td className="px-6 py-3 text-right text-sm font-medium text-green-700">
              £{Number(payment.amount).toFixed(2)}
            </td>
            <td className="px-6 py-3 text-right">
              <button
                type="button"
                onClick={() => handleDelete(payment.id)}
                disabled={deletingId === payment.id}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {deletingId === payment.id ? 'Deleting...' : 'Delete'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
