'use client'

import { useState, useActionState } from 'react'
import type { TimeSession } from '@/types/database'
import {
  updateTimeSession,
  deleteTimeSession,
  type TimeSessionActionState,
} from '@/lib/actions/time-sessions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface TimeSessionListProps {
  sessions: TimeSession[]
  projectId: string
}

/**
 * Format a duration in seconds to a readable string like "1h 23m 45s".
 */
function formatDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return 'In progress...'

  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000))

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  parts.push(`${seconds}s`)

  return parts.join(' ')
}

/**
 * Format a timestamp to a readable date/time string.
 */
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Convert an ISO timestamp to a datetime-local input value.
 */
function toDatetimeLocal(isoStr: string): string {
  const date = new Date(isoStr)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function SessionEditForm({
  session,
  onCancel,
}: {
  session: TimeSession
  onCancel: () => void
}) {
  const updateWithId = updateTimeSession.bind(null, session.id)
  const [state, formAction, isPending] = useActionState<
    TimeSessionActionState,
    FormData
  >(updateWithId, null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // If state is null after a submission, the update succeeded
  if (hasSubmitted && state === null && !isPending) {
    onCancel()
  }

  return (
    <form
      action={(formData) => {
        setHasSubmitted(true)
        formAction(formData)
      }}
      className="mt-3 space-y-3 border-t border-gray-100 pt-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`start_time_${session.id}`}
            className="block text-xs font-medium text-gray-600"
          >
            Start Time
          </label>
          <input
            type="datetime-local"
            id={`start_time_${session.id}`}
            name="start_time"
            defaultValue={toDatetimeLocal(session.start_time)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state?.fieldErrors?.start_time && (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.start_time[0]}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor={`end_time_${session.id}`}
            className="block text-xs font-medium text-gray-600"
          >
            End Time
          </label>
          <input
            type="datetime-local"
            id={`end_time_${session.id}`}
            name="end_time"
            defaultValue={
              session.end_time ? toDatetimeLocal(session.end_time) : ''
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state?.fieldErrors?.end_time && (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.end_time[0]}
            </p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor={`note_${session.id}`}
          className="block text-xs font-medium text-gray-600"
        >
          Note
        </label>
        <textarea
          id={`note_${session.id}`}
          name="note"
          rows={2}
          defaultValue={session.note ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Optional note about this session..."
        />
        {state?.fieldErrors?.note && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.note[0]}
          </p>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function SessionItem({
  session,
  projectId,
}: {
  session: TimeSession
  projectId: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteTimeSession(session.id)
    setShowDeleteConfirm(false)
    setIsDeleting(false)
  }

  const isRunning = !session.end_time

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Duration */}
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-semibold ${
                isRunning ? 'text-green-700' : 'text-gray-900'
              }`}
            >
              {formatDuration(session.start_time, session.end_time)}
            </span>
            {isRunning && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Active
              </span>
            )}
          </div>

          {/* Times */}
          <div className="mt-1 text-sm text-gray-500">
            <span>{formatDateTime(session.start_time)}</span>
            {session.end_time && (
              <>
                <span className="mx-1">→</span>
                <span>{formatDateTime(session.end_time)}</span>
              </>
            )}
          </div>

          {/* Note */}
          {session.note && (
            <p className="mt-2 text-sm text-gray-600 italic">
              {session.note}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] justify-center"
            aria-label={`Edit session from ${formatDateTime(session.start_time)}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] justify-center"
            aria-label={`Delete session from ${formatDateTime(session.start_time)}`}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <SessionEditForm
          session={session}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Session"
        message="Are you sure you want to delete this time session? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </li>
  )
}

export default function TimeSessionList({
  sessions,
  projectId,
}: TimeSessionListProps) {
  return (
    <ul className="space-y-3" aria-label="Time sessions">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          projectId={projectId}
        />
      ))}
    </ul>
  )
}
