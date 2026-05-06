'use client'

import { useActionState } from 'react'
import { createNote, type NoteActionState } from '@/lib/actions/notes'

interface NoteFormProps {
  projectId: string
}

export default function NoteForm({ projectId }: NoteFormProps) {
  const createNoteWithProject = createNote.bind(null, projectId)
  const [state, formAction, isPending] = useActionState<NoteActionState, FormData>(
    createNoteWithProject,
    null
  )

  return (
    <form action={formAction} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Add a Note</h3>

      <div className="space-y-3">
        {/* Content */}
        <div>
          <label htmlFor="note-content" className="sr-only">
            Note content
          </label>
          <textarea
            id="note-content"
            name="content"
            rows={3}
            placeholder="Write your note here..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
            required
          />
          {state?.fieldErrors?.content && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.content[0]}</p>
          )}
        </div>

        {/* Category */}
        <div className="flex items-center gap-3">
          <label htmlFor="note-category" className="text-sm text-gray-600">
            Category:
          </label>
          <select
            id="note-category"
            name="category"
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
            defaultValue="general"
          >
            <option value="general">General</option>
            <option value="remember_next_time">Remember Next Time</option>
            <option value="pattern_alteration">Pattern Alteration</option>
          </select>
          {state?.fieldErrors?.category && (
            <p className="text-xs text-red-600">{state.fieldErrors.category[0]}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add Note'}
          </button>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
        </div>
      </div>
    </form>
  )
}
