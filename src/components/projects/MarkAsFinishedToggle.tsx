'use client'

import { useState } from 'react'

interface MarkAsFinishedToggleProps {
  defaultChecked?: boolean
  defaultDate?: string
}

/**
 * Toggle/checkbox that marks a project as finished.
 * When activated, shows a date picker and sets hidden fields for status and date_completed.
 * When deactivated, hides the date picker and reverts.
 */
export default function MarkAsFinishedToggle({
  defaultChecked = false,
  defaultDate,
}: MarkAsFinishedToggleProps) {
  const [isFinished, setIsFinished] = useState(defaultChecked)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="mark_as_finished"
          checked={isFinished}
          onChange={(e) => setIsFinished(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <label htmlFor="mark_as_finished" className="text-sm font-medium text-gray-700">
          Mark as finished
        </label>
      </div>

      {/* Hidden input to communicate the toggle state to the server action */}
      <input type="hidden" name="mark_as_finished" value={isFinished ? 'true' : 'false'} />

      {isFinished && (
        <div>
          <label htmlFor="date_completed" className="block text-sm font-medium text-gray-700">
            Date Finished
          </label>
          <input
            type="date"
            id="date_completed"
            name="date_completed"
            defaultValue={defaultDate ?? today}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      )}
    </div>
  )
}
