'use client'

import { useActionState } from 'react'
import { useRef } from 'react'
import { recordPayment } from '@/lib/actions/payments'
import type { PaymentActionState } from '@/types/invoicing'

interface PaymentFormProps {
  invoiceId: string
  balance: number
}

export default function PaymentForm({ invoiceId, balance }: PaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, pending] = useActionState<PaymentActionState | null, FormData>(
    recordPayment,
    null
  )

  // Reset form on success
  if (state?.success && formRef.current) {
    formRef.current.reset()
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="invoice_id" value={invoiceId} />

      {/* Error */}
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3" role="alert">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Success */}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-3" role="status">
          <p className="text-sm text-green-700">Payment recorded successfully.</p>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Current balance: <span className="font-medium text-gray-900">£{balance.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="payment_amount" className="block text-sm font-medium text-gray-700">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="payment_amount"
            name="amount"
            required
            min="0.01"
            max={balance}
            step="0.01"
            placeholder={`Max: £${balance.toFixed(2)}`}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.amount && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.amount[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="payment_date"
            name="payment_date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.payment_date && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.payment_date[0]}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || balance <= 0}
        className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Recording...' : 'Record Payment'}
      </button>
    </form>
  )
}
