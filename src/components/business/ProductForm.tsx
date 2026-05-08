'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  createProduct,
  updateProduct,
  type ProductActionState,
} from '@/lib/actions/business-products'
import { PRODUCT_STATUSES } from '@/types/business'
import type { ProductRow } from '@/types/business'

interface ProductFormProps {
  product?: ProductRow
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const isEditing = !!product

  const action = isEditing
    ? updateProduct.bind(null, product.id)
    : createProduct

  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    action,
    null
  )

  // On success (null return after submission), redirect
  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      if (isEditing) {
        router.push(`/business/products/${product.id}`)
      } else {
        router.push('/business/products')
      }
    }
  }, [state, pending, router, isEditing, product?.id])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      {/* General error */}
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={product?.name ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.name ? 'name-error' : undefined}
        />
        {state?.fieldErrors?.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Sell Price */}
      <div>
        <label htmlFor="sell_price" className="block text-sm font-medium text-gray-700">
          Sell Price <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="sell_price"
          name="sell_price"
          required
          step="0.01"
          min="0"
          defaultValue={product?.sell_price ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.sell_price ? 'sell_price-error' : undefined}
        />
        {state?.fieldErrors?.sell_price && (
          <p id="sell_price-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.sell_price[0]}
          </p>
        )}
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={product?.status ?? 'active'}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Time Taken */}
      <div>
        <label htmlFor="time_taken_minutes" className="block text-sm font-medium text-gray-700">
          Time Taken (minutes)
        </label>
        <input
          type="number"
          id="time_taken_minutes"
          name="time_taken_minutes"
          min="0"
          step="1"
          defaultValue={product?.time_taken_minutes ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.time_taken_minutes ? 'time_taken_minutes-error' : undefined}
        />
        {state?.fieldErrors?.time_taken_minutes && (
          <p id="time_taken_minutes-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.time_taken_minutes[0]}
          </p>
        )}
      </div>

      {/* Wages per Minute */}
      <div>
        <label htmlFor="wages_per_minute" className="block text-sm font-medium text-gray-700">
          Wages per Minute
        </label>
        <input
          type="number"
          id="wages_per_minute"
          name="wages_per_minute"
          min="0"
          step="0.0001"
          defaultValue={product?.wages_per_minute ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.wages_per_minute ? 'wages_per_minute-error' : undefined}
        />
        {state?.fieldErrors?.wages_per_minute && (
          <p id="wages_per_minute-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.wages_per_minute[0]}
          </p>
        )}
      </div>

      {/* Profit Margin */}
      <div>
        <label htmlFor="profit_margin_percent" className="block text-sm font-medium text-gray-700">
          Profit Margin (%)
        </label>
        <input
          type="number"
          id="profit_margin_percent"
          name="profit_margin_percent"
          min="0"
          step="0.01"
          defaultValue={product?.profit_margin_percent ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.profit_margin_percent ? 'profit_margin_percent-error' : undefined}
        />
        {state?.fieldErrors?.profit_margin_percent && (
          <p id="profit_margin_percent-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.profit_margin_percent[0]}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending
            ? isEditing
              ? 'Saving...'
              : 'Adding...'
            : isEditing
              ? 'Save Changes'
              : 'Add Product'}
        </button>
        <Link
          href={isEditing ? `/business/products/${product.id}` : '/business/products'}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
