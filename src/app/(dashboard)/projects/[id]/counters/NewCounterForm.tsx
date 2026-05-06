'use client'

import { useActionState } from 'react'
import type { CounterActionState } from '@/lib/actions/counters'

interface NewCounterFormProps {
  action: (
    prevState: CounterActionState,
    formData: FormData
  ) => Promise<CounterActionState>
}

/**
 * Form for creating a new counter.
 * Uses useActionState for progressive enhancement and pending state.
 */
export default function NewCounterForm({ action }: NewCounterFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">New Counter</h2>

      <form action={formAction} className="space-y-4">
        {/* Counter name */}
        <div>
          <label
            htmlFor="counter-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="counter-name"
            name="name"
            type="text"
            required
            maxLength={100}
            placeholder="e.g., Rows, Stitches, Repeats"
            className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 focus:outline-none"
          />
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Target value (optional) */}
        <div>
          <label
            htmlFor="counter-target"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Target (optional)
          </label>
          <input
            id="counter-target"
            name="target_value"
            type="number"
            min="1"
            step="1"
            placeholder="e.g., 100"
            className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 focus:outline-none"
          />
          {state?.fieldErrors?.target_value && (
            <p className="mt-1 text-sm text-red-600">
              {state.fieldErrors.target_value[0]}
            </p>
          )}
        </div>

        {/* General error */}
        {state?.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[44px] w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Adding...' : 'Add Counter'}
        </button>
      </form>
    </div>
  )
}
