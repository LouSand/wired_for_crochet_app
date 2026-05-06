'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  createExpense,
  updateExpense,
  type ExpenseActionState,
} from '@/lib/actions/expenses'
import { EXPENSE_CATEGORIES } from '@/types/business'
import type { PurchaseRow, SupplierRow } from '@/types/business'
import InvoiceUploader from './InvoiceUploader'

interface ExpenseFormProps {
  expense?: PurchaseRow
  suppliers: SupplierRow[]
}

export default function ExpenseForm({ expense, suppliers }: ExpenseFormProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const isEditing = !!expense

  const [invoicePath, setInvoicePath] = useState<string>(expense?.invoice_path ?? '')
  const [invoiceFileName, setInvoiceFileName] = useState<string>(expense?.invoice_file_name ?? '')

  const action = isEditing
    ? updateExpense.bind(null, expense.id)
    : createExpense

  const [state, formAction, pending] = useActionState<ExpenseActionState, FormData>(
    action,
    null
  )

  // On success (null return after submission), redirect
  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      router.push('/business/expenses')
    }
  }, [state, pending, router])

  const handleSubmit = (formData: FormData) => {
    // Inject invoice data into form
    formData.set('invoice_path', invoicePath)
    formData.set('invoice_file_name', invoiceFileName)
    hasSubmitted.current = true
    formAction(formData)
  }

  const handleUploadComplete = (path: string, filename: string) => {
    setInvoicePath(path)
    setInvoiceFileName(filename)
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      {/* General error */}
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Purchase Date */}
      <div>
        <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
          Purchase Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="purchase_date"
          name="purchase_date"
          required
          defaultValue={expense?.purchase_date ?? new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.purchase_date ? 'purchase_date-error' : undefined}
        />
        {state?.fieldErrors?.purchase_date && (
          <p id="purchase_date-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.purchase_date[0]}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="description"
          name="description"
          required
          defaultValue={expense?.description ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.description ? 'description-error' : undefined}
        />
        {state?.fieldErrors?.description && (
          <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={expense?.category ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.category ? 'category-error' : undefined}
        >
          <option value="">Select a category</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.category && (
          <p id="category-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.category[0]}
          </p>
        )}
      </div>

      {/* Cost */}
      <div>
        <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
          Cost <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="cost"
          name="cost"
          required
          step="0.01"
          min="0"
          defaultValue={expense?.cost ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.cost ? 'cost-error' : undefined}
        />
        {state?.fieldErrors?.cost && (
          <p id="cost-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.cost[0]}
          </p>
        )}
      </div>

      {/* Supplier */}
      <div>
        <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">
          Supplier
        </label>
        <select
          id="supplier_id"
          name="supplier_id"
          defaultValue={expense?.supplier_id ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">No supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice Upload */}
      <InvoiceUploader
        onUploadComplete={handleUploadComplete}
        existingInvoicePath={expense?.invoice_path}
        existingInvoiceFileName={expense?.invoice_file_name}
      />

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
              : 'Add Expense'}
        </button>
        <Link
          href="/business/expenses"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
