'use client'

import { useState } from 'react'
import { useCounter } from '@/hooks/useCounter'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { Counter as CounterType } from '@/types/database'

interface CounterProps {
  counter: CounterType
}

/**
 * Counter component with large, touch-friendly increment/decrement controls.
 * Designed to feel satisfying to tap while crocheting.
 */
export default function Counter({ counter }: CounterProps) {
  const {
    displayValue,
    isPending,
    error,
    increment,
    decrement,
    reset,
    setValue,
    remove,
  } = useCounter({ counter })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditValue, setShowEditValue] = useState(false)
  const [editInput, setEditInput] = useState('')

  const hasTarget = counter.target_value !== null && counter.target_value > 0
  const progressPercent = hasTarget
    ? Math.min(100, Math.round((displayValue / counter.target_value!) * 100))
    : 0

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseInt(editInput, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      setValue(parsed)
      setShowEditValue(false)
      setEditInput('')
    }
  }

  const handleDelete = async () => {
    setShowDeleteConfirm(false)
    await remove()
  }

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
      {/* Counter name */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {counter.name}
        </h3>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label={`Delete counter ${counter.name}`}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      </div>

      {/* Current value display */}
      <div className="text-center mb-4">
        <p
          className="font-mono text-5xl font-bold text-gray-900 sm:text-6xl tabular-nums"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${counter.name}: ${displayValue}${hasTarget ? ` of ${counter.target_value}` : ''}`}
        >
          {displayValue}
        </p>

        {/* Progress toward target */}
        {hasTarget && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-600">
              {displayValue} / {counter.target_value}
            </p>
            <div
              className="mt-2 h-3 w-full rounded-full bg-gray-200 overflow-hidden"
              role="progressbar"
              aria-valuenow={displayValue}
              aria-valuemin={0}
              aria-valuemax={counter.target_value!}
              aria-label={`Progress: ${progressPercent}%`}
            >
              <div
                className="h-full rounded-full bg-purple-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{progressPercent}% complete</p>
          </div>
        )}
      </div>

      {/* Increment / Decrement controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          type="button"
          onClick={decrement}
          disabled={isPending || displayValue === 0}
          aria-label={`Decrement ${counter.name}`}
          className="min-h-[56px] min-w-[56px] flex items-center justify-center rounded-full bg-gray-100 text-gray-700 text-2xl font-bold shadow-sm hover:bg-gray-200 active:bg-gray-300 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all select-none"
        >
          −
        </button>

        <button
          type="button"
          onClick={increment}
          aria-label={`Increment ${counter.name}`}
          className="min-h-[72px] min-w-[72px] flex items-center justify-center rounded-full bg-purple-600 text-white text-3xl font-bold shadow-lg hover:bg-purple-700 active:bg-purple-800 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all select-none"
          disabled={isPending}
        >
          +
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          disabled={isPending || displayValue === 0}
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            setEditInput(String(displayValue))
            setShowEditValue(true)
          }}
          disabled={isPending}
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Edit value
        </button>
      </div>

      {/* Edit value form */}
      {showEditValue && (
        <form onSubmit={handleEditSubmit} className="mt-4 flex items-center gap-2">
          <label htmlFor={`edit-value-${counter.id}`} className="sr-only">
            Set counter value
          </label>
          <input
            id={`edit-value-${counter.id}`}
            type="number"
            min="0"
            step="1"
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            className="min-h-[44px] w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-mono focus:border-purple-500 focus:ring-2 focus:ring-purple-300 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors"
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => setShowEditValue(false)}
            className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Counter"
        message={`Are you sure you want to delete "${counter.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
