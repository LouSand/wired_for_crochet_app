'use client'

import { useState, useActionState } from 'react'
import { addManualTimeSession } from '@/lib/actions/time-sessions'
import type { TimeSessionActionState } from '@/lib/actions/time-sessions'

interface ManualTimeEntryProps {
  projectId: string
}

export default function ManualTimeEntry({ projectId }: ManualTimeEntryProps) {
  const [showForm, setShowForm] = useState(false)

  const boundAction = addManualTimeSession.bind(null, projectId)
  const [state, formAction, pending] = useActionState<TimeSessionActionState, FormData>(
    boundAction,
    null
  )

  // Get sensible defaults for the date inputs
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Add time manually (forgot to press start?)
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-purple-800">Add Time Manually</h3>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close manual time entry"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-purple-600 mb-3">
        Forgot to start the timer? Add the time you worked here.
      </p>

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="manual_start_time" className="block text-xs font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="datetime-local"
              id="manual_start_time"
              name="start_time"
              defaultValue={formatDateTimeLocal(oneHourAgo)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="manual_end_time" className="block text-xs font-medium text-gray-700">
              End Time
            </label>
            <input
              type="datetime-local"
              id="manual_end_time"
              name="end_time"
              defaultValue={formatDateTimeLocal(now)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="manual_note" className="block text-xs font-medium text-gray-700">
            Note (optional)
          </label>
          <input
            type="text"
            id="manual_note"
            name="note"
            placeholder="e.g. Worked on sleeves"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {state?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-2" role="alert">
            <p className="text-xs text-red-700">{state.error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Adding...' : 'Add Time'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
