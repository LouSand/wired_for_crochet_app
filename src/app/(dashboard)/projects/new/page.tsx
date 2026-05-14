'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createProject, type ProjectActionState } from '@/lib/actions/projects'
import { PROJECT_STATUSES, PROJECT_DIFFICULTIES } from '@/lib/validators/project'
import CurrencySelector from '@/components/projects/CurrencySelector'
import PatternSelector from '@/components/projects/PatternSelector'
import InlinePatternForm from '@/components/projects/InlinePatternForm'
import MarkAsFinishedToggle from '@/components/projects/MarkAsFinishedToggle'
import HookRecommendations from '@/components/hooks/HookRecommendations'
import CustomerSelector from '@/components/projects/CustomerSelector'
import type { Pattern } from '@/types/database'

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function NewProjectPage() {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const [state, formAction, pending] = useActionState<ProjectActionState, FormData>(
    createProject,
    null
  )
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [showInlinePattern, setShowInlinePattern] = useState(false)
  const [createdPatternId, setCreatedPatternId] = useState<string>('')
  const [hookRecYarnTypes, setHookRecYarnTypes] = useState<string[]>([])
  const [hookRecPatternTypes, setHookRecPatternTypes] = useState<string[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState<string>('GBP')

  // Fetch patterns and settings
  useEffect(() => {
    async function fetchData() {
      try {
        const [patternsRes, settingsRes] = await Promise.all([
          fetch('/api/patterns'),
          fetch('/api/settings'),
        ])
        if (patternsRes.ok) {
          setPatterns(await patternsRes.json())
        }
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          if (settings.default_currency) {
            setDefaultCurrency(settings.default_currency)
          }
        }
      } catch {
        // Defaults will be used if fetch fails
      }
    }
    fetchData()
  }, [])

  // On success (null return after submission), redirect to /projects
  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      router.push('/projects')
    }
  }, [state, pending, router])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  const handlePatternCreated = (patternId: string) => {
    setCreatedPatternId(patternId)
    setShowInlinePattern(false)
    // Add a temporary pattern to the list so it shows as selected
    setPatterns((prev) => [
      { id: patternId, title: 'New Pattern (just created)', user_id: '', type: 'written', category: null, introduction: null, materials_list: null, hook_size: null, yarn_info: null, gauge: null, abbreviations: null, instructions: null, notes: null, file_path: null, file_name: null, is_published: false, price: null, currency: 'GBP', slug: null, preview_description: null, tags: [], view_count: 0, purchase_count: 0, average_completion_seconds: null, completion_count: 0, terminology: 'uk', difficulty: null, stitches_used: [], created_at: '', updated_at: '' },
      ...prev,
    ])
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new crochet project to start tracking your work.
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
            Project Name <span className="text-red-500">*</span>
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

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="planned"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatLabel(s)}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.status && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.status[0]}
            </p>
          )}
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
            Difficulty
          </label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue=""
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Select difficulty...</option>
            {PROJECT_DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {formatLabel(d)}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.difficulty && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.difficulty[0]}
            </p>
          )}
        </div>

        {/* Customer Name */}
        <CustomerSelector name="customer_name" />
        {state?.fieldErrors?.customer_name && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.customer_name[0]}
          </p>
        )}

        {/* Date Started */}
        <div>
          <label htmlFor="date_started" className="block text-sm font-medium text-gray-700">
            Date Started
          </label>
          <input
            type="date"
            id="date_started"
            name="date_started"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.date_started && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.date_started[0]}
            </p>
          )}
        </div>

        {/* Estimated Completion Date (Due Date) */}
        <div>
          <label htmlFor="estimated_completion_date" className="block text-sm font-medium text-gray-700">
            Due Date (Estimated Completion)
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            When do you need this project finished? You&apos;ll get reminders as the deadline approaches.
          </p>
          <input
            type="date"
            id="estimated_completion_date"
            name="estimated_completion_date"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.estimated_completion_date && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.estimated_completion_date[0]}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            Higher priority projects appear first and get earlier deadline reminders.
          </p>
          <select
            id="priority"
            name="priority"
            defaultValue=""
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">No priority</option>
            <option value="1">1 - Highest</option>
            <option value="2">2 - High</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - Low</option>
            <option value="5">5 - Lowest</option>
          </select>
          {state?.fieldErrors?.priority && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.priority[0]}
            </p>
          )}
        </div>

        {/* Currency Selector */}
        <CurrencySelector name="currency" defaultValue={defaultCurrency} />

        {/* Hourly Rate Override */}
        <div>
          <label htmlFor="hourly_rate_override" className="block text-sm font-medium text-gray-700">
            Hourly Rate Override
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            Overrides your default hourly rate for this project&apos;s pricing.
          </p>
          <input
            type="number"
            id="hourly_rate_override"
            name="hourly_rate_override"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state?.fieldErrors?.hourly_rate_override && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.hourly_rate_override[0]}
            </p>
          )}
        </div>

        {/* Profit Margin Override */}
        <div>
          <label htmlFor="profit_margin" className="block text-sm font-medium text-gray-700">
            Profit Margin (%)
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            Overrides your default profit margin for this project.
          </p>
          <input
            type="number"
            id="profit_margin"
            name="profit_margin"
            step="0.1"
            min="0"
            placeholder="e.g. 20"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Pattern Selector */}
        <PatternSelector
          patterns={patterns}
          defaultValue={createdPatternId}
          onCreateNew={() => setShowInlinePattern(true)}
        />

        {/* Inline Pattern Form */}
        {showInlinePattern && (
          <InlinePatternForm
            onPatternCreated={handlePatternCreated}
            onCancel={() => setShowInlinePattern(false)}
          />
        )}

        {/* Mark as Finished Toggle */}
        <MarkAsFinishedToggle />

        {/* Hook Recommendations */}
        <HookRecommendations
          yarnTypes={hookRecYarnTypes}
          patternTypes={hookRecPatternTypes}
        />

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Creating...' : 'Create Project'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/projects')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
