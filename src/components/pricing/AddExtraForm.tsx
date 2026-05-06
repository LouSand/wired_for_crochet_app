'use client'

import { useActionState } from 'react'
import { addPricingExtra, type PricingActionState } from '@/lib/actions/pricing'

interface AddExtraFormProps {
  projectId: string
}

export default function AddExtraForm({ projectId }: AddExtraFormProps) {
  const boundAction = addPricingExtra.bind(null, projectId)
  const [state, formAction, pending] = useActionState<PricingActionState, FormData>(
    boundAction,
    null
  )

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Add Extra Cost</h3>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="extra-description" className="sr-only">
            Description
          </label>
          <input
            type="text"
            id="extra-description"
            name="description"
            placeholder="e.g., Shipping, Packaging"
            maxLength={255}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.description && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.description[0]}</p>
          )}
        </div>
        <div className="w-28">
          <label htmlFor="extra-amount" className="sr-only">
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
              $
            </span>
            <input
              type="number"
              id="extra-amount"
              name="amount"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          {state?.fieldErrors?.amount && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.amount[0]}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Adding...' : 'Add'}
        </button>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}
    </form>
  )
}
