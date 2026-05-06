'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { createPattern, type PatternActionState } from '@/lib/actions/patterns'

interface InlinePatternFormProps {
  onPatternCreated: (patternId: string) => void
  onCancel: () => void
}

/**
 * Collapsible inline form for creating a pattern directly from the project form.
 * On successful creation, calls onPatternCreated with the new pattern ID.
 */
export default function InlinePatternForm({ onPatternCreated, onCancel }: InlinePatternFormProps) {
  const hasSubmitted = useRef(false)
  const [state, formAction, pending] = useActionState<PatternActionState, FormData>(
    createPattern,
    null
  )

  // When pattern is created successfully, notify parent
  useEffect(() => {
    if (hasSubmitted.current && state?.patternId) {
      onPatternCreated(state.patternId)
    }
  }, [state, onPatternCreated])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-purple-900">Create New Pattern</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <form action={handleSubmit} className="space-y-3">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-3" role="alert">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        {/* Hidden type field - inline patterns are always "written" */}
        <input type="hidden" name="type" value="written" />

        {/* Title */}
        <div>
          <label htmlFor="inline-pattern-title" className="block text-sm font-medium text-gray-700">
            Pattern Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="inline-pattern-title"
            name="title"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.title && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Introduction */}
        <div>
          <label htmlFor="inline-pattern-introduction" className="block text-sm font-medium text-gray-700">
            Introduction
          </label>
          <textarea
            id="inline-pattern-introduction"
            name="introduction"
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Materials List */}
        <div>
          <label htmlFor="inline-pattern-materials" className="block text-sm font-medium text-gray-700">
            Materials List
          </label>
          <textarea
            id="inline-pattern-materials"
            name="materials_list"
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Hook Size */}
          <div>
            <label htmlFor="inline-pattern-hook-size" className="block text-sm font-medium text-gray-700">
              Hook Size
            </label>
            <input
              type="text"
              id="inline-pattern-hook-size"
              name="hook_size"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Yarn Info */}
          <div>
            <label htmlFor="inline-pattern-yarn-info" className="block text-sm font-medium text-gray-700">
              Yarn Info
            </label>
            <input
              type="text"
              id="inline-pattern-yarn-info"
              name="yarn_info"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Gauge */}
          <div>
            <label htmlFor="inline-pattern-gauge" className="block text-sm font-medium text-gray-700">
              Gauge
            </label>
            <input
              type="text"
              id="inline-pattern-gauge"
              name="gauge"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Abbreviations */}
          <div>
            <label htmlFor="inline-pattern-abbreviations" className="block text-sm font-medium text-gray-700">
              Abbreviations
            </label>
            <input
              type="text"
              id="inline-pattern-abbreviations"
              name="abbreviations"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="inline-pattern-instructions" className="block text-sm font-medium text-gray-700">
            Instructions
          </label>
          <textarea
            id="inline-pattern-instructions"
            name="instructions"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="inline-pattern-notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="inline-pattern-notes"
            name="notes"
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Creating...' : 'Create Pattern'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
