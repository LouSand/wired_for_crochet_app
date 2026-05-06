'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  createMaterial,
  updateMaterial,
  type MaterialActionState,
} from '@/lib/actions/materials'
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from '@/types/business'
import type { MaterialRow } from '@/types/business'

interface MaterialFormProps {
  material?: MaterialRow
}

export default function MaterialForm({ material }: MaterialFormProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const isEditing = !!material

  const [quantityOwned, setQuantityOwned] = useState<number>(material?.quantity_owned ?? 0)
  const [quantityUsed, setQuantityUsed] = useState<number>(material?.quantity_used ?? 0)
  const [totalCost, setTotalCost] = useState<number | null>(material?.total_cost ?? null)

  const action = isEditing
    ? updateMaterial.bind(null, material.id)
    : createMaterial

  const [state, formAction, pending] = useActionState<MaterialActionState, FormData>(
    action,
    null
  )

  // On success (null return after submission), redirect
  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      router.push('/business/materials')
    }
  }, [state, pending, router])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  // Computed values
  const costPerUnit =
    quantityOwned > 0 && totalCost !== null && totalCost > 0
      ? (totalCost / quantityOwned).toFixed(4)
      : '—'

  const availableStock = Math.max(0, quantityOwned - quantityUsed)

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
          Material Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={material?.name ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.name ? 'name-error' : undefined}
        />
        {state?.fieldErrors?.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Material Type */}
      <div>
        <label htmlFor="material_type" className="block text-sm font-medium text-gray-700">
          Material Type
        </label>
        <input
          type="text"
          id="material_type"
          name="material_type"
          defaultValue={material?.material_type ?? ''}
          placeholder="e.g., acrylic, cotton, metal"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
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
          defaultValue={material?.category ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.category ? 'category-error' : undefined}
        >
          <option value="">Select a category</option>
          {MATERIAL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.category && (
          <p id="category-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.category[0]}
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
          defaultValue={material?.colour ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
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
          defaultValue={material?.quantity_owned ?? 0}
          onChange={(e) => setQuantityOwned(parseFloat(e.target.value) || 0)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.quantity_owned ? 'quantity_owned-error' : undefined}
        />
        {state?.fieldErrors?.quantity_owned && (
          <p id="quantity_owned-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.quantity_owned[0]}
          </p>
        )}
      </div>

      {/* Quantity Used */}
      <div>
        <label htmlFor="quantity_used" className="block text-sm font-medium text-gray-700">
          Quantity Used
        </label>
        <input
          type="number"
          id="quantity_used"
          name="quantity_used"
          step="0.01"
          min="0"
          defaultValue={material?.quantity_used ?? 0}
          onChange={(e) => setQuantityUsed(parseFloat(e.target.value) || 0)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.quantity_used ? 'quantity_used-error' : undefined}
        />
        {state?.fieldErrors?.quantity_used && (
          <p id="quantity_used-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.quantity_used[0]}
          </p>
        )}
      </div>

      {/* Total Cost */}
      <div>
        <label htmlFor="total_cost" className="block text-sm font-medium text-gray-700">
          Total Cost
        </label>
        <input
          type="number"
          id="total_cost"
          name="total_cost"
          step="0.01"
          min="0"
          defaultValue={material?.total_cost ?? ''}
          onChange={(e) => setTotalCost(e.target.value ? parseFloat(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.total_cost ? 'total_cost-error' : undefined}
        />
        {state?.fieldErrors?.total_cost && (
          <p id="total_cost-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.total_cost[0]}
          </p>
        )}
      </div>

      {/* Unit */}
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
          Unit
        </label>
        <select
          id="unit"
          name="unit"
          defaultValue={material?.unit ?? 'pieces'}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {MATERIAL_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit.charAt(0).toUpperCase() + unit.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Computed fields (read-only) */}
      <div className="rounded-md bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-700">Computed Values</h3>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Cost per Unit</p>
            <p className="text-sm font-medium text-gray-900">{costPerUnit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Available Stock</p>
            <p className="text-sm font-medium text-gray-900">{availableStock}</p>
          </div>
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
              : 'Adding...'
            : isEditing
              ? 'Save Changes'
              : 'Add Material'}
        </button>
        <Link
          href="/business/materials"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
