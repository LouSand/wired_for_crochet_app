'use client'

import { useActionState } from 'react'
import { useRef } from 'react'
import { addBomLineItem, removeBomLineItem, type BomActionState, type BomLineItemWithMaterial } from '@/lib/actions/bom'
import type { MaterialRow } from '@/types/business'

function RemoveButton({ itemId, productId }: { itemId: string; productId: string }) {
  const handleRemove = async () => {
    await removeBomLineItem(itemId, productId)
  }

  return (
    <form action={handleRemove}>
      <button
        type="submit"
        className="text-sm text-red-600 hover:text-red-800 transition-colors"
      >
        Remove
      </button>
    </form>
  )
}

interface BomEditorProps {
  productId: string
  lineItems: BomLineItemWithMaterial[]
  materials: MaterialRow[]
}

export default function BomEditor({ productId, lineItems, materials }: BomEditorProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const addAction = addBomLineItem.bind(null, productId)
  const [state, formAction, pending] = useActionState<BomActionState, FormData>(
    addAction,
    null
  )

  return (
    <div className="space-y-6">
      {/* Add line item form */}
      <form ref={formRef} action={formAction} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Add Material</h3>

        {state?.error && (
          <div className="mb-3 rounded-md bg-red-50 p-3" role="alert">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="material_id" className="block text-xs font-medium text-gray-700">
              Material <span className="text-red-500">*</span>
            </label>
            <select
              id="material_id"
              name="material_id"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Select material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.unit})
                </option>
              ))}
            </select>
            {state?.fieldErrors?.material_id && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.material_id[0]}</p>
            )}
          </div>

          <div className="w-32">
            <label htmlFor="quantity_required" className="block text-xs font-medium text-gray-700">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity_required"
              name="quantity_required"
              required
              step="0.01"
              min="0.01"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {state?.fieldErrors?.quantity_required && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.quantity_required[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Line items list */}
      {lineItems.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No materials added to this BOM yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Material
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cost/Unit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Line Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item) => {
                const costPerUnit = item.materials?.cost_per_unit ?? 0
                const lineTotal = item.quantity_required * Number(costPerUnit)
                const isInvalid = item.material_id === null

                return (
                  <tr key={item.id} className={isInvalid ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {isInvalid ? (
                        <span className="text-yellow-700 italic">Deleted material</span>
                      ) : (
                        <>
                          {item.materials?.name}
                          <span className="ml-1 text-xs text-gray-500">({item.materials?.unit})</span>
                        </>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {item.quantity_required}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {isInvalid ? '—' : `$${Number(costPerUnit).toFixed(4)}`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {isInvalid ? '—' : `$${lineTotal.toFixed(2)}`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <RemoveButton itemId={item.id} productId={item.product_id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
