'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  createSale,
  updateSale,
  type SaleActionState,
} from '@/lib/actions/sales'
import type { SaleRow, ProductRow, CustomerRow } from '@/types/business'

interface SaleFormProps {
  sale?: SaleRow
  products: ProductRow[]
  customers: CustomerRow[]
}

export default function SaleForm({ sale, products, customers }: SaleFormProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const isEditing = !!sale

  const action = isEditing
    ? updateSale.bind(null, sale.id)
    : createSale

  const [state, formAction, pending] = useActionState<SaleActionState, FormData>(
    action,
    null
  )

  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      router.push('/business/sales')
    }
  }, [state, pending, router])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Sale Date */}
      <div>
        <label htmlFor="sale_date" className="block text-sm font-medium text-gray-700">
          Sale Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="sale_date"
          name="sale_date"
          required
          defaultValue={sale?.sale_date ?? new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.sale_date ? 'sale_date-error' : undefined}
        />
        {state?.fieldErrors?.sale_date && (
          <p id="sale_date-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.sale_date[0]}
          </p>
        )}
      </div>

      {/* Product */}
      <div>
        <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
          Product
        </label>
        <select
          id="product_id"
          name="product_id"
          defaultValue={sale?.product_id ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">No product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (${Number(p.sell_price).toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* Customer */}
      <div>
        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
          Customer
        </label>
        <select
          id="customer_id"
          name="customer_id"
          defaultValue={sale?.customer_id ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">No customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="quantity_sold" className="block text-sm font-medium text-gray-700">
          Quantity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="quantity_sold"
          name="quantity_sold"
          required
          min="1"
          step="1"
          defaultValue={sale?.quantity_sold ?? 1}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.quantity_sold ? 'quantity_sold-error' : undefined}
        />
        {state?.fieldErrors?.quantity_sold && (
          <p id="quantity_sold-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.quantity_sold[0]}
          </p>
        )}
      </div>

      {/* Sale Price */}
      <div>
        <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700">
          Sale Price <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="sale_price"
          name="sale_price"
          required
          step="0.01"
          min="0"
          defaultValue={sale?.sale_price ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.sale_price ? 'sale_price-error' : undefined}
        />
        {state?.fieldErrors?.sale_price && (
          <p id="sale_price-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.sale_price[0]}
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
              : 'Recording...'
            : isEditing
              ? 'Save Changes'
              : 'Record Sale'}
        </button>
        <Link
          href="/business/sales"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
