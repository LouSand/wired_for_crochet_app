import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTimeSessions, getActiveSession } from '@/lib/actions/time-sessions'
import Timer from '@/components/timer/Timer'
import TimeSessionList from './TimeSessionList'

/**
 * Format total seconds into a human-readable "Xh Ym Zs" string.
 */
function formatTotalTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  parts.push(`${seconds}s`)

  return parts.join(' ')
}

export default async function TimeTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [sessionsResult, activeResult] = await Promise.all([
    getTimeSessions(id),
    getActiveSession(id),
  ])

  if (sessionsResult.error && !sessionsResult.data) {
    notFound()
  }

  const sessions = sessionsResult.data ?? []
  const totalDurationSeconds = sessionsResult.totalDurationSeconds
  const activeSession = activeResult.data

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          ← Back to project
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track time spent on this project
        </p>
      </div>

      {/* Timer component */}
      <Timer projectId={id} activeSession={activeSession} />

      {/* Total time display */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-500">Total Time</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {formatTotalTime(totalDurationSeconds)}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Across {sessions.filter((s) => s.end_time).length} completed session
          {sessions.filter((s) => s.end_time).length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Session history */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Session History
        </h2>
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-500">
              No sessions recorded yet. Start the timer above to begin tracking.
            </p>
          </div>
        ) : (
          <TimeSessionList sessions={sessions} projectId={id} />
        )}
      </div>
    </div>
  )
}
