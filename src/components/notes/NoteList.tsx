'use client'

import { useState } from 'react'
import { deleteNote, updateNote, type NoteActionState } from '@/lib/actions/notes'
import type { Note } from '@/types/database'

interface NoteListProps {
  notes: Note[]
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  remember_next_time: 'Remember Next Time',
  pattern_alteration: 'Pattern Alteration',
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  remember_next_time: 'bg-yellow-100 text-yellow-800',
  pattern_alteration: 'bg-purple-100 text-purple-800',
}

export default function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">
          No notes yet. Add one above to start documenting.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}

function NoteCard({ note }: { note: Note }) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(note.content)
  const [category, setCategory] = useState(note.category)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    const formData = new FormData()
    formData.append('content', content)
    formData.append('category', category)

    const updateNoteWithId = updateNote.bind(null, note.id)
    const result: NoteActionState = await updateNoteWithId(null, formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.fieldErrors) {
      const firstError = Object.values(result.fieldErrors)[0]?.[0]
      setError(firstError ?? 'Validation error.')
    } else {
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const result = await deleteNote(note.id)
    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formattedDate = new Date(note.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isSaving}
            aria-label="Edit note content"
          />
          <div className="flex items-center gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isSaving}
              aria-label="Note category"
            >
              <option value="general">General</option>
              <option value="remember_next_time">Remember Next Time</option>
              <option value="pattern_alteration">Pattern Alteration</option>
            </select>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setContent(note.content)
                setCategory(note.category)
              }}
              disabled={isSaving}
              className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Content */}
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                CATEGORY_COLORS[note.category] ?? CATEGORY_COLORS.general
              }`}
            >
              {CATEGORY_LABELS[note.category] ?? note.category}
            </span>
            <span className="text-xs text-gray-400">{formattedDate}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              Edit
            </button>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
