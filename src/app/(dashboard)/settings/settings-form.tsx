'use client'

import { useActionState } from 'react'
import { updateSettings, type SettingsState } from '@/lib/actions/settings'

interface SettingsFormProps {
  defaultHourlyRate: number | null
}

export default function SettingsForm({ defaultHourlyRate }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    updateSettings,
    null
  )

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="default_hourly_rate"
          className="block text-sm font-medium text-gray-700"
        >
          Default Hourly Rate
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Used in the pricing calculator when no project-specific rate is set.
        </p>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            $
          </span>
          <input
            type="number"
            id="default_hourly_rate"
            name="default_hourly_rate"
            step="0.01"
            min="0"
            defaultValue={defaultHourlyRate ?? ''}
            placeholder="0.00"
            className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-describedby="rate-description"
          />
        </div>
        <p id="rate-description" className="sr-only">
          Enter your default hourly rate in dollars. This is used for pricing calculations.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      {state?.message && (
        <p className="text-sm text-green-600" role="status">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
