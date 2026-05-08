'use client'

import { useActionState, useState } from 'react'
import { addPatternYarnRequirement, removePatternYarnRequirement } from '@/lib/actions/pattern-yarn'
import type { PatternYarnRequirement } from '@/types/pattern-yarn'
import type { YarnRequirementActionState } from '@/lib/actions/pattern-yarn'
import { YARN_WEIGHT_CATEGORIES } from '@/types/pattern-yarn'
import { MATERIAL_UNITS } from '@/types/business'

interface PatternYarnRequirementsProps {
  patternId: string
  requirements: PatternYarnRequirement[]
}

function RemoveButton({ requirementId, patternId }: { requirementId: string; patternId: string }) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!confirm('Remove this yarn requirement?')) return
    setRemoving(true)
    await removePatternYarnRequirement(requirementId, patternId)
    setRemoving(false)
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={removing}
      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {removing ? '...' : 'Remove'}
    </button>
  )
}

export default function PatternYarnRequirements({ patternId, requirements }: PatternYarnRequirementsProps) {
  const [showForm, setShowForm] = useState(false)

  const addAction = addPatternYarnRequirement.bind(null, patternId)
  const [state, formAction, pending] = useActionState<YarnRequirementActionState, FormData>(
    addAction,
    null
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Yarn Requirements</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          {showForm ? 'Cancel' : '+ Add Yarn'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form action={formAction} className="mb-4 rounded-md border border-purple-200 bg-purple-50 p-4 space-y-3">
          {state?.error && (
            <div className="rounded-md bg-red-50 p-2" role="alert">
              <p className="text-xs text-red-700">{state.error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Yarn Name */}
            <div className="sm:col-span-2">
              <label htmlFor="yarn_name" className="block text-xs font-medium text-gray-700">
                Yarn Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="yarn_name"
                name="yarn_name"
                required
                placeholder="e.g. Stylecraft Special DK"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Colour */}
            <div>
              <label htmlFor="yarn_colour" className="block text-xs font-medium text-gray-700">
                Colour
              </label>
              <input
                type="text"
                id="yarn_colour"
                name="colour"
                placeholder="e.g. Cream, #1005"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Weight Category */}
            <div>
              <label htmlFor="weight_category" className="block text-xs font-medium text-gray-700">
                Weight
              </label>
              <select
                id="weight_category"
                name="weight_category"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select weight...</option>
                {YARN_WEIGHT_CATEGORIES.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Primary Quantity + Unit */}
            <div>
              <label htmlFor="yarn_quantity" className="block text-xs font-medium text-gray-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="yarn_quantity"
                name="quantity"
                required
                step="0.01"
                min="0.01"
                placeholder="e.g. 200"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="yarn_unit" className="block text-xs font-medium text-gray-700">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                id="yarn_unit"
                name="unit"
                defaultValue="grams"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {MATERIAL_UNITS.map((u) => (
                  <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Secondary Quantity + Unit (optional) */}
            <div>
              <label htmlFor="secondary_quantity" className="block text-xs font-medium text-gray-700">
                Also (optional)
              </label>
              <input
                type="number"
                id="secondary_quantity"
                name="secondary_quantity"
                step="0.01"
                min="0.01"
                placeholder="e.g. 2"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="secondary_unit" className="block text-xs font-medium text-gray-700">
                Unit
              </label>
              <select
                id="secondary_unit"
                name="secondary_unit"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">None</option>
                {MATERIAL_UNITS.map((u) => (
                  <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="yarn_notes" className="block text-xs font-medium text-gray-700">
                Notes
              </label>
              <input
                type="text"
                id="yarn_notes"
                name="notes"
                placeholder="e.g. Any DK weight acrylic will work"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Adding...' : 'Add Yarn Requirement'}
          </button>
        </form>
      )}

      {/* Requirements list */}
      {requirements.length === 0 ? (
        <p className="text-sm text-gray-500">
          No yarn requirements specified yet. Add the yarns needed for this pattern.
        </p>
      ) : (
        <div className="space-y-3">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="flex items-start justify-between rounded-md border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{req.yarn_name}</span>
                  {req.weight_category && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {req.weight_category}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                  <span>
                    {req.quantity} {req.unit}
                  </span>
                  {req.secondary_quantity && req.secondary_unit && (
                    <span className="text-gray-400">
                      / {req.secondary_quantity} {req.secondary_unit}
                    </span>
                  )}
                  {req.colour && <span>Colour: {req.colour}</span>}
                </div>
                {req.notes && (
                  <p className="mt-1 text-xs text-gray-500 italic">{req.notes}</p>
                )}
              </div>
              <RemoveButton requirementId={req.id} patternId={patternId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
