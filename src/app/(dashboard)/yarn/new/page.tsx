'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { createYarnEntry, type YarnActionState } from '@/lib/actions/yarn'
import { YARN_WEIGHT_CATEGORIES } from '@/lib/validators/yarn'

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function NewYarnPage() {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const [state, formAction, pending] = useActionState<YarnActionState, FormData>(
    createYarnEntry,
    null
  )

  // On success (null return after submission), redirect to /yarn
  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      router.push('/yarn')
    }
  }, [state, pending, router])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/yarn"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Yarn Inventory
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add Yarn</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new yarn to your inventory.
        </p>
      </div>

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
            Yarn Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-describedby={state?.fieldErrors?.name ? 'name-error' : undefined}
          />
          {state?.fieldErrors?.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
            Brand
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.brand && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.brand[0]}
            </p>
          )}
        </div>

        {/* Colour */}
        <div>
          <label htmlFor="colour" className="block text-sm font-medium text-gray-700">
            Colour
          </label>
          <input
            type="text"
            id="colour"
            name="colour"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.colour && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.colour[0]}
            </p>
          )}
        </div>

        {/* Shade Code */}
        <div>
          <label htmlFor="shade_code" className="block text-sm font-medium text-gray-700">
            Shade Code
          </label>
          <input
            type="text"
            id="shade_code"
            name="shade_code"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.shade_code && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.shade_code[0]}
            </p>
          )}
        </div>

        {/* Dye Lot */}
        <div>
          <label htmlFor="dye_lot" className="block text-sm font-medium text-gray-700">
            Dye Lot
          </label>
          <input
            type="text"
            id="dye_lot"
            name="dye_lot"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.dye_lot && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.dye_lot[0]}
            </p>
          )}
        </div>

        {/* Weight Category */}
        <div>
          <label htmlFor="weight_category" className="block text-sm font-medium text-gray-700">
            Weight Category
          </label>
          <select
            id="weight_category"
            name="weight_category"
            defaultValue=""
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Select weight...</option>
            {YARN_WEIGHT_CATEGORIES.map((w) => (
              <option key={w} value={w}>
                {formatLabel(w)}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.weight_category && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.weight_category[0]}
            </p>
          )}
        </div>

        {/* Thickness */}
        <div>
          <label htmlFor="thickness" className="block text-sm font-medium text-gray-700">
            Thickness
          </label>
          <input
            type="text"
            id="thickness"
            name="thickness"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.thickness && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.thickness[0]}
            </p>
          )}
        </div>

        {/* Fibre Content */}
        <div>
          <label htmlFor="fibre_content" className="block text-sm font-medium text-gray-700">
            Fibre Content
          </label>
          <textarea
            id="fibre_content"
            name="fibre_content"
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.fibre_content && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.fibre_content[0]}
            </p>
          )}
        </div>

        {/* Washing Instructions */}
        <div>
          <label htmlFor="washing_instructions" className="block text-sm font-medium text-gray-700">
            Washing Instructions
          </label>
          <textarea
            id="washing_instructions"
            name="washing_instructions"
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.washing_instructions && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.washing_instructions[0]}
            </p>
          )}
        </div>

        {/* Recommended Hook Size */}
        <div>
          <label htmlFor="recommended_hook_size" className="block text-sm font-medium text-gray-700">
            Recommended Hook Size
          </label>
          <input
            type="text"
            id="recommended_hook_size"
            name="recommended_hook_size"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.recommended_hook_size && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.recommended_hook_size[0]}
            </p>
          )}
        </div>

        {/* Quantity Owned */}
        <div>
          <label htmlFor="quantity_owned" className="block text-sm font-medium text-gray-700">
            Quantity Owned
          </label>
          <input
            type="number"
            id="quantity_owned"
            name="quantity_owned"
            step="0.01"
            min="0"
            defaultValue="0"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.quantity_owned && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.quantity_owned[0]}
            </p>
          )}
        </div>

        {/* Cost Per Unit */}
        <div>
          <label htmlFor="cost_per_unit" className="block text-sm font-medium text-gray-700">
            Cost Per Unit
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              $
            </span>
            <input
              type="number"
              id="cost_per_unit"
              name="cost_per_unit"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          {state?.fieldErrors?.cost_per_unit && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.cost_per_unit[0]}
            </p>
          )}
        </div>

        {/* Yarn Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Yarn Photo</label>
          <p className="mt-0.5 text-xs text-gray-500">Upload a photo of the yarn so you can identify it easily.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 rounded-md border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 cursor-pointer transition-colors min-h-[44px]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              </svg>
              Take Photo
              <input type="file" name="yarn_photo" accept="image/*" capture="environment" className="hidden" />
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Choose File
              <input type="file" name="yarn_photo" accept="image/jpeg,image/png,image/webp" className="hidden" />
            </label>
          </div>
        </div>

        {/* Label Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Label Photo</label>
          <p className="mt-0.5 text-xs text-gray-500">Take a photo of the yarn label — shows washing instructions, gauge, fibre content, dye lot etc.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 rounded-md border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 cursor-pointer transition-colors min-h-[44px]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              </svg>
              Take Photo of Label
              <input type="file" name="label_photo" accept="image/*" capture="environment" className="hidden" />
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Choose File
              <input type="file" name="label_photo" accept="image/jpeg,image/png,image/webp" className="hidden" />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Adding...' : 'Add Yarn'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/yarn')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
