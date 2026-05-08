'use client'

import { useState } from 'react'
import { deletePricingExtra } from '@/lib/actions/pricing'
import type { PricingExtra } from '@/types/database'

interface ExtrasListProps {
  extras: PricingExtra[]
}

export default function ExtrasList({ extras }: ExtrasListProps) {
  if (extras.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No extra costs added yet.</p>
    )
  }

  return (
    <ul className="space-y-2">
      {extras.map((extra) => (
        <ExtraItem key={extra.id} extra={extra} />
      ))}
    </ul>
  )
}

function ExtraItem({ extra }: { extra: PricingExtra }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const result = await deletePricingExtra(extra.id)
    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
    }
  }

  return (
    <li className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex-1">
        <span className="text-sm text-gray-700">{extra.description}</span>
        <span className="ml-2 text-sm font-medium text-gray-900">
          ${extra.amount.toFixed(2)}
        </span>
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-xs text-red-500 hover:text-red-700 focus:outline-none focus:underline disabled:opacity-50"
        aria-label={`Delete ${extra.description}`}
      >
        {isDeleting ? 'Removing...' : 'Remove'}
      </button>
      {error && <p className="text-xs text-red-600 ml-2">{error}</p>}
    </li>
  )
}
