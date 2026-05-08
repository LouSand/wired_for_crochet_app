'use client'

import { useState, useTransition } from 'react'
import { createPattern, type PatternActionState } from '@/lib/actions/patterns'

interface InlinePatternFormProps {
  onPatternCreated: (patternId: string) => void
  onCancel: () => void
}

/**
 * Inline pattern creation panel (NOT a <form> — avoids nested form issue).
 * Collects data via state and calls the server action manually.
 */
export default function InlinePatternForm({ onPatternCreated, onCancel }: InlinePatternFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [title, setTitle] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [materialsList, setMaterialsList] = useState('')
  const [hookSize, setHookSize] = useState('')
  const [yarnInfo, setYarnInfo] = useState('')
  const [gauge, setGauge] = useState('')
  const [abbreviations, setAbbreviations] = useState('')
  const [instructions, setInstructions] = useState('')
  const [notes, setNotes] = useState('')

  const handleCreate = () => {
    setError(null)
    setFieldErrors({})

    if (!title.trim()) {
      setFieldErrors({ title: ['Pattern title is required.'] })
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', title)
      formData.set('type', 'written')
      if (introduction) formData.set('introduction', introduction)
      if (materialsList) formData.set('materials_list', materialsList)
      if (hookSize) formData.set('hook_size', hookSize)
      if (yarnInfo) formData.set('yarn_info', yarnInfo)
      if (gauge) formData.set('gauge', gauge)
      if (abbreviations) formData.set('abbreviations', abbreviations)
      if (instructions) formData.set('instructions', instructions)
      if (notes) formData.set('notes', notes)

      const result: PatternActionState = await createPattern(null, formData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.fieldErrors) {
        setFieldErrors(result.fieldErrors)
      } else if (result?.patternId) {
        onPatternCreated(result.patternId)
      }
    })
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

      <div className="space-y-3">
        {error && (
          <div className="rounded-md bg-red-50 p-3" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="inline-pattern-title" className="block text-sm font-medium text-gray-700">
            Pattern Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="inline-pattern-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Introduction */}
        <div>
          <label htmlFor="inline-pattern-introduction" className="block text-sm font-medium text-gray-700">
            Introduction
          </label>
          <textarea
            id="inline-pattern-introduction"
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
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
            value={materialsList}
            onChange={(e) => setMaterialsList(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="inline-pattern-hook-size" className="block text-sm font-medium text-gray-700">
              Hook Size
            </label>
            <input
              type="text"
              id="inline-pattern-hook-size"
              value={hookSize}
              onChange={(e) => setHookSize(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="inline-pattern-yarn-info" className="block text-sm font-medium text-gray-700">
              Yarn Info
            </label>
            <input
              type="text"
              id="inline-pattern-yarn-info"
              value={yarnInfo}
              onChange={(e) => setYarnInfo(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="inline-pattern-gauge" className="block text-sm font-medium text-gray-700">
              Gauge
            </label>
            <input
              type="text"
              id="inline-pattern-gauge"
              value={gauge}
              onChange={(e) => setGauge(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="inline-pattern-abbreviations" className="block text-sm font-medium text-gray-700">
              Abbreviations
            </label>
            <input
              type="text"
              id="inline-pattern-abbreviations"
              value={abbreviations}
              onChange={(e) => setAbbreviations(e.target.value)}
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
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="inline-flex items-center rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating...' : 'Create Pattern'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
