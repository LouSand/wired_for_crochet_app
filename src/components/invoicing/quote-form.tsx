'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createQuote, updateQuote } from '@/lib/actions/quotes'
import type { QuoteActionState, QuoteRow, QuoteItemRow } from '@/types/invoicing'
import CustomerSelect from './customer-select'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

interface QuoteFormProps {
  quote?: QuoteRow & { items?: QuoteItemRow[] }
  customers: Customer[]
}

export default function QuoteForm({ quote, customers }: QuoteFormProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const isEditing = !!quote

  const [items, setItems] = useState<LineItem[]>(
    quote?.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) ?? [{ description: '', quantity: 1, unit_price: 0 }]
  )

  const action = isEditing
    ? updateQuote.bind(null, quote.id)
    : createQuote

  const [state, formAction, pending] = useActionState<QuoteActionState | null, FormData>(
    action,
    null
  )

  // On success, redirect
  useEffect(() => {
    if (hasSubmitted.current && state?.success && !pending) {
      if (state.data?.id) {
        router.push(`/business/invoicing/quotes/${state.data.id}`)
      } else {
        router.push('/business/invoicing/quotes')
      }
    }
  }, [state, pending, router])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items]
    if (field === 'description') {
      updated[index].description = value as string
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value as string, 10) || 0
    } else if (field === 'unit_price') {
      updated[index].unit_price = parseFloat(value as string) || 0
    }
    setItems(updated)
  }

  const quoteTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-6">
      {/* General error */}
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Customer Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Customer <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <CustomerSelect
            customers={customers}
            defaultValue={quote?.customer_id}
            name="customer_id"
          />
        </div>
        {state?.fieldErrors?.customer_id && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.customer_id[0]}
          </p>
        )}
      </div>

      {/* Issue Date */}
      <div>
        <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
          Issue Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="issue_date"
          name="issue_date"
          required
          defaultValue={quote?.issue_date ?? new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        {state?.fieldErrors?.issue_date && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.issue_date[0]}
          </p>
        )}
      </div>

      {/* Line Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Line Items <span className="text-red-500">*</span>
        </label>
        {state?.fieldErrors?.items && (
          <p className="mb-2 text-sm text-red-600" role="alert">
            {state.fieldErrors.items[0]}
          </p>
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-end rounded-md border border-gray-200 bg-gray-50 p-3"
            >
              {/* Description */}
              <div className="col-span-5">
                {index === 0 && (
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Description
                  </label>
                )}
                <input
                  type="text"
                  name="description[]"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  required
                  placeholder="Item description"
                  className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Quantity */}
              <div className="col-span-2">
                {index === 0 && (
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Qty
                  </label>
                )}
                <input
                  type="number"
                  name="quantity[]"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  required
                  min="1"
                  className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Unit Price */}
              <div className="col-span-2">
                {index === 0 && (
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Unit Price
                  </label>
                )}
                <input
                  type="number"
                  name="unit_price[]"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Line Total */}
              <div className="col-span-2">
                {index === 0 && (
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Total
                  </label>
                )}
                <div className="px-2 py-1.5 text-sm font-medium text-gray-700">
                  £{(item.quantity * item.unit_price).toFixed(2)}
                </div>
              </div>

              {/* Remove */}
              <div className="col-span-1">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          + Add Item
        </button>
      </div>

      {/* Quote Total */}
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Quote Total</span>
          <span className="text-lg font-bold text-gray-900">£{quoteTotal.toFixed(2)}</span>
        </div>
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
              : 'Creating...'
            : isEditing
              ? 'Save Changes'
              : 'Create Quote'}
        </button>
        <Link
          href={isEditing ? `/business/invoicing/quotes/${quote.id}` : '/business/invoicing/quotes'}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
