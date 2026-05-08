'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  createSupplier,
  updateSupplier,
  type SupplierActionState,
} from '@/lib/actions/suppliers'
import type { SupplierRow } from '@/types/business'

interface SupplierFormProps {
  supplier?: SupplierRow
}

export default function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const isEditing = !!supplier

  const action = isEditing
    ? updateSupplier.bind(null, supplier.id)
    : createSupplier

  const [state, formAction, pending] = useActionState<SupplierActionState, FormData>(
    action,
    null
  )

  // On success (null return after submission), redirect
  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      if (isEditing) {
        router.push(`/business/suppliers/${supplier.id}`)
      } else {
        router.push('/business/suppliers')
      }
    }
  }, [state, pending, router, isEditing, supplier?.id])

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
          Supplier Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={supplier?.name ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.name ? 'name-error' : undefined}
        />
        {state?.fieldErrors?.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website
        </label>
        <input
          type="text"
          id="website"
          name="website"
          defaultValue={supplier?.website ?? ''}
          placeholder="https://example.com"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.website ? 'website-error' : undefined}
        />
        {state?.fieldErrors?.website && (
          <p id="website-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.website[0]}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={supplier?.notes ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.notes ? 'notes-error' : undefined}
        />
        {state?.fieldErrors?.notes && (
          <p id="notes-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.notes[0]}
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
              : 'Add Supplier'}
        </button>
        <Link
          href={isEditing ? `/business/suppliers/${supplier.id}` : '/business/suppliers'}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
