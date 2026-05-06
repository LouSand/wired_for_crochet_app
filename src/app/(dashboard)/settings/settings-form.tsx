'use client'

import { useActionState } from 'react'
import { updateSettings, type SettingsState } from '@/lib/actions/settings'
import { SUPPORTED_CURRENCIES } from '@/lib/validators/project'
import { CURRENCY_SYMBOLS } from '@/lib/currency'

interface SettingsFormProps {
  defaultHourlyRate: number | null
  defaultCurrency: string
  defaultProfitMargin: number | null
}

export default function SettingsForm({ defaultHourlyRate, defaultCurrency, defaultProfitMargin }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    updateSettings,
    null
  )

  return (
    <form action={formAction} className="space-y-6">
      {/* Default Currency */}
      <div>
        <label
          htmlFor="default_currency"
          className="block text-sm font-medium text-gray-700"
        >
          Default Currency
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Used across the app for displaying prices. Can be overridden per project.
        </p>
        <select
          id="default_currency"
          name="default_currency"
          defaultValue={defaultCurrency}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {SUPPORTED_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code} ({CURRENCY_SYMBOLS[code] ?? code})
            </option>
          ))}
        </select>
      </div>

      {/* Default Hourly Rate */}
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
        <input
          type="number"
          id="default_hourly_rate"
          name="default_hourly_rate"
          step="0.01"
          min="0"
          defaultValue={defaultHourlyRate ?? ''}
          placeholder="0.00"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Default Profit Margin */}
      <div>
        <label
          htmlFor="default_profit_margin"
          className="block text-sm font-medium text-gray-700"
        >
          Default Profit Margin (%)
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Applied to pricing calculations. Can be overridden per project.
        </p>
        <input
          type="number"
          id="default_profit_margin"
          name="default_profit_margin"
          step="0.1"
          min="0"
          defaultValue={defaultProfitMargin ?? ''}
          placeholder="e.g. 20"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
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
