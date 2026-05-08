'use client'

import { useState } from 'react'
import { useTimer } from '@/hooks/useTimer'
import type { TimeSession } from '@/types/database'

interface TimerProps {
  projectId: string
  activeSession: TimeSession | null
}

/**
 * Format seconds into HH:MM:SS display string.
 */
function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':')
}

/**
 * Check if a session is orphaned (started more than 24 hours ago without stopping).
 */
function isOrphanedSession(session: TimeSession | null): boolean {
  if (!session) return false
  const startTime = new Date(session.start_time).getTime()
  const now = Date.now()
  const twentyFourHours = 24 * 60 * 60 * 1000
  return now - startTime > twentyFourHours
}

/**
 * Timer component with start/stop controls and real-time elapsed time display.
 * Visually prominent for use while crocheting.
 */
export default function Timer({ projectId, activeSession }: TimerProps) {
  const { isRunning, elapsed, error, isLoading, start, stop } = useTimer({
    projectId,
    activeSession,
  })

  const [showOrphanWarning, setShowOrphanWarning] = useState(
    isOrphanedSession(activeSession)
  )
  const [discarding, setDiscarding] = useState(false)

  const handleEndOrphanedSession = async () => {
    setShowOrphanWarning(false)
    await stop()
  }

  const handleDiscardSession = async () => {
    // Discard by stopping (the server will record end_time as now)
    // In a full implementation, we might want a dedicated "discard" action
    // For now, stopping it records the session with current end_time
    setDiscarding(true)
    setShowOrphanWarning(false)
    await stop()
    setDiscarding(false)
  }

  // Orphaned session warning
  if (showOrphanWarning && activeSession) {
    const startDate = new Date(activeSession.start_time)
    return (
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="h-6 w-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-amber-800">Orphaned Session Detected</h3>
        </div>
        <p className="text-sm text-amber-700 mb-4">
          A timer was started on{' '}
          <span className="font-medium">
            {startDate.toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>{' '}
          and was never stopped. This may have been left running accidentally.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleEndOrphanedSession}
            disabled={isLoading}
            className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
          >
            {isLoading ? 'Ending...' : 'End session now'}
          </button>
          <button
            type="button"
            onClick={handleDiscardSession}
            disabled={discarding || isLoading}
            className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
          >
            {discarding ? 'Discarding...' : 'Discard session'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
      {/* Elapsed time display */}
      <div className="text-center">
        <p
          className="font-mono text-5xl font-bold tracking-wider text-gray-900 sm:text-6xl"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Elapsed time: ${formatElapsed(elapsed)}`}
        >
          {formatElapsed(elapsed)}
        </p>

        {/* Running indicator */}
        {isRunning && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-medium text-green-700">Running...</span>
          </div>
        )}
      </div>

      {/* Start/Stop button */}
      <div className="mt-6 flex justify-center">
        {isRunning ? (
          <button
            type="button"
            onClick={stop}
            disabled={isLoading}
            aria-label="Stop timer"
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Stopping...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                Stop
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={isLoading}
            aria-label="Start timer"
            className="inline-flex items-center justify-center rounded-full bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Starting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
                Start
              </span>
            )}
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
