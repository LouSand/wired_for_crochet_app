'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { updateHookEntry, type HookActionState } from '@/lib/actions/hooks'
import HookCompatibilityFields from '@/components/hooks/HookCompatibilityFields'
import type { HookEntry } from '@/types/database'

interface HookEditFormProps {
  hookEntry: HookEntry
}

export default function HookEditForm({ hookEntry }: HookEditFormProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)

  const boundUpdateAction = useCallback(
    (prevState: HookActionState, formData: FormData) =>
      updateHookEntry(hookEntry.id, prevState, formData),
    [hookEntry.id]
  )

  const [state, formAction, pending] = useActionState<HookActionState, FormData>(
    boundUpdateAction,
    null
  )

  // On success (null return after submission), redirect to detail page
  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      router.push(`/hooks/${hookEntry.id}`)
    }
  }, [state, pending, router, hookEntry.id])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/hooks/${hookEntry.id}`}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to {hookEntry.size}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Hook</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update the details for the {hookEntry.size} hook.
        </p>
      </div>

      <form action={handleSubmit} className="max-w-2xl space-y-6">
        {/* General error */}
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        {/* Size */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700">
            Hook Size <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="size"
            name="size"
            required
            defaultValue={hookEntry.size}
            placeholder="e.g., 4.0mm, G/6"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-describedby={state?.fieldErrors?.size ? 'size-error' : undefined}
          />
          {state?.fieldErrors?.size && (
            <p id="size-error" className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.size[0]}
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <input
            type="text"
            id="type"
            name="type"
            defaultValue={hookEntry.type ?? ''}
            placeholder="e.g., inline, tapered"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.type && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.type[0]}
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
            defaultValue={hookEntry.brand ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.brand && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.brand[0]}
            </p>
          )}
        </div>

        {/* Material */}
        <div>
          <label htmlFor="material" className="block text-sm font-medium text-gray-700">
            Material
          </label>
          <input
            type="text"
            id="material"
            name="material"
            defaultValue={hookEntry.material ?? ''}
            placeholder="e.g., aluminum, bamboo, steel"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.material && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.material[0]}
            </p>
          )}
        </div>

        {/* Compatibility Metadata */}
        <HookCompatibilityFields
          yarnTypes={hookEntry.yarn_types ?? []}
          patternTypes={hookEntry.pattern_types ?? []}
        />

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/hooks/${hookEntry.id}`)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
