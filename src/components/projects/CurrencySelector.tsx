'use client'

import { SUPPORTED_CURRENCIES } from '@/lib/validators/project'
import { CURRENCY_SYMBOLS } from '@/lib/currency'

interface CurrencySelectorProps {
  name: string
  defaultValue?: string
}

/**
 * Dropdown selector for project currency.
 * Shows currency code + symbol for each option.
 */
export default function CurrencySelector({ name, defaultValue = 'USD' }: CurrencySelectorProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        Currency
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        {SUPPORTED_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code} ({CURRENCY_SYMBOLS[code] ?? code})
          </option>
        ))}
      </select>
    </div>
  )
}
