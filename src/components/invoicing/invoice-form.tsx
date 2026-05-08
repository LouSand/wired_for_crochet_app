'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createInvoice, updateInvoice } from '@/lib/actions/invoices'
import type { InvoiceActionState, InvoiceRow, InvoiceItemRow } from '@/types/invoicing'
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

interface Project {
  id: string
  name: string
}

interface InvoiceFormProps {
  invoice?: InvoiceRow & { items?: InvoiceItemRow[] }
  customers: Customer[]
  projects?: Project[]
  prefill?: {
    customer_id?: string
    project_id?: string
    items: { description: string; quantity: number; unit_price: number }[]
  }
}

export default function InvoiceForm({ invoice, customers, projects, prefill }: InvoiceFormProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const isEditing = !!invoice

  const [items, setItems] = useState<LineItem[]>(
    invoice?.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) ?? prefill?.items ?? [{ description: '', quantity: 1, unit_price: 0 }]
  )

  const action = isEditing
    ? updateInvoice.bind(null, invoice.id)
    : createInvoice

  const [state, formAction, pending] = useActionState<InvoiceActionState | null, FormData>(
    action,
    null
  )

  // On success, redirect
  useEffect(() => {
    if (hasSubmitted.current && state?.success && !pending) {
      if (state.data?.id) {
        router.push(`/business/invoicing/invoices/${state.data.id}`)
      } else {
        router.push('/business/invoicing/invoices')
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

  const invoiceTotal = items.reduce(
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
            defaultValue={invoice?.customer_id ?? prefill?.customer_id}
            name="customer_id"
          />
        </div>
        {state?.fieldErrors?.customer_id && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.customer_id[0]}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
            Issue Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="issue_date"
            name="issue_date"
            required
            defaultValue={invoice?.issue_date ?? new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.issue_date && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.issue_date[0]}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
            Due Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            required
            defaultValue={invoice?.due_date ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.due_date && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.due_date[0]}
            </p>
          )}
        </div>
      </div>

      {/* Project (optional) */}
      {projects && projects.length > 0 && (
        <div>
          <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
            Project (optional)
          </label>
          <select
            id="project_id"
            name="project_id"
            defaultValue={invoice?.project_id ?? prefill?.project_id ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hidden project_id when prefilled but no project dropdown */}
      {!projects && prefill?.project_id && (
        <input type="hidden" name="project_id" value={prefill.project_id} />
      )}

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

      {/* Invoice Total */}
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Invoice Total</span>
          <span className="text-lg font-bold text-gray-900">£{invoiceTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Stage Payment Percentages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stage Payment Percentages
        </label>
        <p className="text-xs text-gray-500 mb-3">Must sum to 100%</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="deposit_percent" className="block text-xs font-medium text-gray-500">
              Deposit %
            </label>
            <input
              type="number"
              id="deposit_percent"
              name="deposit_percent"
              defaultValue={invoice?.deposit_percent ?? 40}
              min="0"
              max="100"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="stage2_percent" className="block text-xs font-medium text-gray-500">
              Stage 2 %
            </label>
            <input
              type="number"
              id="stage2_percent"
              name="stage2_percent"
              defaultValue={invoice?.stage2_percent ?? 40}
              min="0"
              max="100"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="final_percent" className="block text-xs font-medium text-gray-500">
              Final %
            </label>
            <input
              type="number"
              id="final_percent"
              name="final_percent"
              defaultValue={invoice?.final_percent ?? 20}
              min="0"
              max="100"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
        {state?.fieldErrors?.[''] && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {state.fieldErrors[''][0]}
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
              : 'Creating...'
            : isEditing
              ? 'Save Changes'
              : 'Create Invoice'}
        </button>
        <Link
          href={isEditing ? `/business/invoicing/invoices/${invoice.id}` : '/business/invoicing/invoices'}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
