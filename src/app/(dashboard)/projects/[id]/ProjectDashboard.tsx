'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Project, TimeSession, Counter, Pattern, Note } from '@/types/database'
import { useTimer } from '@/hooks/useTimer'
import { incrementCounter, decrementCounter } from '@/lib/actions/counters'
import { deleteProject, updateProject } from '@/lib/actions/projects'
import { deleteAllAnnotations } from '@/lib/actions/pattern-annotations'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PdfAnnotationViewer from '@/components/patterns/PdfAnnotationViewer'
import PatternAnalysisPanel from '@/components/patterns/PatternAnalysisPanel'
import TranslateButton from '@/components/patterns/TranslateButton'
import ShareProjectButton from '@/components/projects/ShareProjectButton'

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

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

function formatTotalTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  abandoned: 'bg-red-100 text-red-700',
}

const PRIORITY_LABELS = ['', 'Highest', 'High', 'Medium', 'Low', 'Lowest']

interface ProjectDashboardProps {
  project: Project
  pattern: Pattern | null
  patternFileUrl: string | null
  activeSession: TimeSession | null
  totalDurationSeconds: number
  counters: Counter[]
  notes: Note[]
}

export default function ProjectDashboard({
  project,
  pattern,
  patternFileUrl,
  activeSession,
  totalDurationSeconds,
  counters,
  notes,
}: ProjectDashboardProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteProject(project.id)
    if (result?.error) {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      return
    }
    router.push('/projects')
  }

  const handleComplete = async (keepAnnotations: boolean) => {
    setIsCompleting(true)
    // Mark project as completed
    const formData = new FormData()
    formData.set('mark_as_finished', 'true')
    formData.set('date_completed', new Date().toISOString().split('T')[0])
    await updateProject(project.id, null, formData)

    // Discard annotations if user chose not to keep them
    if (!keepAnnotations && pattern) {
      await deleteAllAnnotations(project.id, pattern.id)
    }

    setIsCompleting(false)
    setShowCompleteDialog(false)
    router.refresh()
  }

  const statusColor = STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-700'

  // Calculate overall project progress from counters or manual progress
  const countersWithTargets = counters.filter((c) => c.target_value && c.target_value > 0)
  const counterProgress = countersWithTargets.length > 0
    ? Math.round(
        countersWithTargets.reduce((sum, c) => {
          const pct = Math.min(100, (c.current_value / (c.target_value ?? 1)) * 100)
          return sum + pct
        }, 0) / countersWithTargets.length
      )
    : null
  const overallProgress = project.manual_progress ?? counterProgress

  // ─── FOCUS MODE (Active Crocheting Mode) ─────────────────────────────────
  if (focusMode) {
    return (
      <FocusMode
        project={project}
        activeSession={activeSession}
        totalDurationSeconds={totalDurationSeconds}
        counters={counters}
        pattern={pattern}
        patternFileUrl={patternFileUrl}
        onExit={() => setFocusMode(false)}
      />
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Compact Header — mobile optimised */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl truncate">{project.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>
              {formatLabel(project.status)}
            </span>
          </div>
          {/* Compact info row */}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            {project.estimated_completion_date && (
              <span>Due {formatDate(project.estimated_completion_date)}</span>
            )}
            {project.priority && (
              <span>{PRIORITY_LABELS[project.priority]} priority</span>
            )}
            {pattern && (
              <Link href={`/patterns/${project.pattern_id}`} className="text-purple-600 hover:underline">
                {pattern.title}
              </Link>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFocusMode(true)}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-purple-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-purple-700 active:bg-purple-800 transition-colors"
            aria-label="Enter focus mode"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            <span className="hidden sm:inline">Focus</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 active:bg-gray-100"
            aria-label="Project options"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {overallProgress !== null && (
        <ProgressBar progress={overallProgress} />
      )}

      {/* Expandable details/actions panel */}
      {showDetails && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {project.description && (
            <p className="text-sm text-gray-600">{project.description}</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span>Started: {formatDate(project.date_started)}</span>
            {project.difficulty && <span>• {formatLabel(project.difficulty)}</span>}
            {project.customer_name && <span>• {project.customer_name}</span>}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={`/projects/${project.id}/edit`}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
            >
              Edit Project
            </Link>
            <Link
              href={`/business/invoicing/invoices/new?from_project=${project.id}`}
              className="inline-flex items-center rounded-lg border border-purple-300 bg-white px-4 py-2.5 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 active:bg-purple-100 min-h-[44px]"
            >
              Create Invoice
            </Link>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 active:bg-red-100 min-h-[44px]"
            >
              Delete
            </button>
            {project.status === 'completed' && (
              <ShareProjectButton projectId={project.id} projectName={project.name} />
            )}
            {project.status !== 'completed' && (
              <button
                type="button"
                onClick={() => setShowCompleteDialog(true)}
                className="inline-flex items-center rounded-lg border border-green-300 bg-white px-4 py-2.5 text-sm font-medium text-green-700 shadow-sm hover:bg-green-50 active:bg-green-100 min-h-[44px]"
              >
                ✓ Complete Project
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ MAIN WORKSPACE: Timer + Counters ═══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimerCard projectId={project.id} activeSession={activeSession} totalDurationSeconds={totalDurationSeconds} />
        <CountersCard projectId={project.id} counters={counters} />
      </div>

      {/* ═══ PATTERN VIEWER ═══ */}
      {pattern && (
        <PatternViewer pattern={pattern} patternFileUrl={patternFileUrl} projectId={project.id} />
      )}

      {/* ═══ PATTERN ANALYSIS (auto-counters) ═══ */}
      {pattern && pattern.instructions && (
        <PatternAnalysisPanel patternId={pattern.id} projectId={project.id} />
      )}

      {/* ═══ QUICK NOTES PANEL ═══ */}
      <NotesPanel projectId={project.id} notes={notes} />

      {/* ═══ QUICK NAVIGATION ═══ */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <QuickLink href={`/projects/${project.id}/time`} label="Time" icon="clock" />
        <QuickLink href={`/projects/${project.id}/counters`} label="Counters" icon="counter" />
        <QuickLink href={`/projects/${project.id}/yarn`} label="Yarn" icon="yarn" />
        <QuickLink href={`/projects/${project.id}/photos`} label="Photos" icon="camera" />
        <QuickLink href={`/projects/${project.id}/notes`} label="Notes" icon="note" />
        <QuickLink href={`/projects/${project.id}/hooks`} label="Hooks" icon="hook" />
        <QuickLink href={`/projects/${project.id}/pricing`} label="Pricing" icon="pricing" />
      </div>

      {/* Delete dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This will permanently remove all associated data. This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Project'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Complete project dialog — asks about annotations */}
      {showCompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">🎉 Complete Project</h2>
            <p className="text-sm text-gray-600">
              Mark &quot;{project.name}&quot; as finished?
            </p>
            {pattern && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
                <p className="text-sm font-medium text-purple-800">
                  Pattern annotations
                </p>
                <p className="text-xs text-purple-700">
                  You have annotations on &quot;{pattern.title}&quot;. Would you like to keep them for next time you use this pattern, or discard them?
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleComplete(true)}
                    disabled={isCompleting}
                    className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[40px]"
                  >
                    {isCompleting ? 'Completing...' : 'Keep annotations'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleComplete(false)}
                    disabled={isCompleting}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-[40px]"
                  >
                    Discard annotations
                  </button>
                </div>
              </div>
            )}
            {!pattern && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleComplete(true)}
                  disabled={isCompleting}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 min-h-[40px]"
                >
                  {isCompleting ? 'Completing...' : 'Yes, mark as finished'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompleteDialog(false)}
                  disabled={isCompleting}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-[40px]"
                >
                  Cancel
                </button>
              </div>
            )}
            {pattern && (
              <button
                type="button"
                onClick={() => setShowCompleteDialog(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel — don&apos;t complete yet
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const getColor = () => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-emerald-500'
    if (progress >= 50) return 'bg-purple-500'
    if (progress >= 25) return 'bg-blue-500'
    return 'bg-gray-400'
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-600">Overall Progress</span>
        <span className="text-xs font-bold text-gray-800">{progress}%</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getColor()}`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Project progress: ${progress}%`}
        />
      </div>
      {progress >= 100 && (
        <p className="mt-1.5 text-xs text-green-700 font-medium text-center">🎉 All counters complete!</p>
      )}
    </div>
  )
}

// ─── Timer Card (mobile-first, large touch targets) ──────────────────────────

function TimerCard({
  projectId,
  activeSession,
  totalDurationSeconds,
}: {
  projectId: string
  activeSession: TimeSession | null
  totalDurationSeconds: number
}) {
  const { isRunning, elapsed, isLoading, start, stop } = useTimer({
    projectId,
    activeSession,
  })

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-sm transition-colors ${
      isRunning ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-600">Timer</span>
        </div>
        <Link href={`/projects/${projectId}/time`} className="text-xs text-purple-600 hover:text-purple-700 min-h-[44px] min-w-[44px] flex items-center justify-center">
          History →
        </Link>
      </div>

      <div className="text-center py-2">
        <p
          className="font-mono text-5xl font-bold tracking-wider text-gray-900 sm:text-6xl tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatElapsed(elapsed)}
        </p>
        {isRunning && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-medium text-green-700">Running</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-center">
        {isRunning ? (
          <button
            type="button"
            onClick={stop}
            disabled={isLoading}
            aria-label="Stop timer"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-red-600 px-10 py-4 text-base font-bold text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 active:scale-95 disabled:opacity-50 transition-all min-h-[52px] min-w-[160px]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            {isLoading ? 'Stopping...' : 'Stop'}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={isLoading}
            aria-label="Start timer"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-green-600 px-10 py-4 text-base font-bold text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 active:scale-95 disabled:opacity-50 transition-all min-h-[52px] min-w-[160px]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
            {isLoading ? 'Starting...' : 'Start'}
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        Total tracked: <span className="font-semibold text-gray-700">{formatTotalTime(totalDurationSeconds)}</span>
      </p>
    </div>
  )
}

// ─── Counters Card (large tap targets for crocheting) ────────────────────────

function CountersCard({ projectId, counters }: { projectId: string; counters: Counter[] }) {
  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
          </svg>
          <span className="text-sm font-medium text-gray-600">Counters</span>
        </div>
        <Link href={`/projects/${projectId}/counters`} className="text-xs text-purple-600 hover:text-purple-700 min-h-[44px] min-w-[44px] flex items-center justify-center">
          Manage →
        </Link>
      </div>

      {counters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-3">No counters yet</p>
          <Link
            href={`/projects/${projectId}/counters`}
            className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 active:bg-purple-800 min-h-[44px]"
          >
            + Add Counter
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {counters.map((counter) => (
            <CounterRow key={counter.id} counter={counter} />
          ))}
        </div>
      )}
    </div>
  )
}

function CounterRow({ counter }: { counter: Counter }) {
  const [value, setValue] = useState(counter.current_value)
  const [loading, setLoading] = useState(false)
  const [showTargetReached, setShowTargetReached] = useState(false)
  const [targetAcknowledged, setTargetAcknowledged] = useState(false)

  const handleIncrement = async () => {
    // If at target and not yet acknowledged, show popup
    if (counter.target_value && value >= counter.target_value && !targetAcknowledged) {
      setShowTargetReached(true)
      return
    }
    setLoading(true)
    const { data } = await incrementCounter(counter.id)
    if (data) {
      setValue(data.current_value)
      // Show popup when hitting target for the first time
      if (counter.target_value && data.current_value >= counter.target_value && !targetAcknowledged) {
        setShowTargetReached(true)
      }
    }
    setLoading(false)
  }

  const handleContinuePastTarget = async () => {
    setTargetAcknowledged(true)
    setShowTargetReached(false)
    // Do the increment that was blocked
    setLoading(true)
    const { data } = await incrementCounter(counter.id)
    if (data) setValue(data.current_value)
    setLoading(false)
  }

  const handleDecrement = async () => {
    if (value <= 0) return
    setLoading(true)
    const { data } = await decrementCounter(counter.id)
    if (data) setValue(data.current_value)
    setLoading(false)
  }

  const progress = counter.target_value ? Math.min(100, (value / counter.target_value) * 100) : null

  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-800 truncate">{counter.name}</p>
        {counter.target_value && (
          <span className="text-xs text-gray-500 shrink-0 ml-2">
            {value}/{counter.target_value}
          </span>
        )}
      </div>

      {counter.target_value && (
        <div className="mb-3 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Target reached popup */}
      {showTargetReached && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-center space-y-2">
          <p className="text-sm font-medium text-green-800">
            🎉 Target reached! ({counter.target_value})
          </p>
          <p className="text-xs text-green-700">Continue counting past the target?</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleContinuePastTarget}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 min-h-[32px]"
            >
              Yes, keep going
            </button>
            <button
              type="button"
              onClick={() => setShowTargetReached(false)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 min-h-[32px]"
            >
              Stop here
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={loading || value <= 0}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-xl font-bold text-gray-600 shadow-sm hover:bg-gray-100 active:bg-gray-200 active:scale-95 disabled:opacity-30 transition-all min-h-[48px] min-w-[48px]"
          aria-label={`Decrease ${counter.name}`}
        >
          −
        </button>
        <span className="min-w-[3rem] text-center text-2xl font-bold text-gray-900 tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={loading}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-purple-400 bg-purple-50 text-xl font-bold text-purple-700 shadow-sm hover:bg-purple-100 active:bg-purple-200 active:scale-95 disabled:opacity-30 transition-all min-h-[48px] min-w-[48px]"
          aria-label={`Increase ${counter.name}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Pattern Viewer with Annotations ─────────────────────────────────────────

function PatternViewer({
  pattern,
  patternFileUrl,
  projectId,
}: {
  pattern: Pattern
  patternFileUrl: string | null
  projectId: string
}) {
  const [expanded, setExpanded] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [highlights, setHighlights] = useState<Array<{ id: string; row: number; color: string; note: string }>>([])
  const [currentRow, setCurrentRow] = useState<number | null>(null)
  const [showAnnotationForm, setShowAnnotationForm] = useState(false)
  const [annotationNote, setAnnotationNote] = useState('')
  const [annotationColor, setAnnotationColor] = useState('#fef08a') // yellow

  const isUploaded = pattern.type === 'uploaded'
  const isPdf = pattern.file_name?.toLowerCase().endsWith('.pdf')
  const isImage = pattern.file_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  const hasFile = isUploaded && patternFileUrl
  const hasInstructions = pattern.instructions && pattern.instructions.trim().length > 0

  // Split written pattern into rows for highlighting
  const patternRows = pattern.instructions?.split('\n') ?? []

  const handleAddHighlight = () => {
    if (currentRow === null) return
    const newHighlight = {
      id: crypto.randomUUID(),
      row: currentRow,
      color: annotationColor,
      note: annotationNote,
    }
    setHighlights((prev) => [...prev, newHighlight])
    setAnnotationNote('')
    setShowAnnotationForm(false)
  }

  const handleRemoveHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id))
  }

  const highlightColors = [
    { value: '#fef08a', label: 'Yellow' },
    { value: '#bbf7d0', label: 'Green' },
    { value: '#bfdbfe', label: 'Blue' },
    { value: '#fecaca', label: 'Red' },
    { value: '#e9d5ff', label: 'Purple' },
  ]

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 hover:bg-gray-50 transition-colors min-h-[48px]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">{pattern.title}</span>
          <span className="text-[10px] rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 font-medium">
            {isUploaded ? 'Uploaded' : 'Written'}
          </span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Pattern content */}
          <div className="p-4 space-y-4">
            {/* Uploaded file viewer (PDF or image) — with annotation support */}
            {hasFile && patternFileUrl && (isPdf || isImage) && (
              <PdfAnnotationViewer
                pdfUrl={patternFileUrl}
                projectId={projectId}
                patternId={pattern.id}
                patternTitle={pattern.title}
                fileType={isPdf ? 'pdf' : 'image'}
              />
            )}
            {hasFile && !isPdf && !isImage && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-2">File: {pattern.file_name}</p>
                <a
                  href={patternFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 min-h-[44px]"
                >
                  Download File
                </a>
              </div>
            )}

            {/* Written instructions with row highlighting — shown for ALL patterns that have instructions */}
            {hasInstructions && patternRows.length > 0 && (
              <div>
                {hasFile && (
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Instructions / Notes
                  </h3>
                )}
                {/* Instructions toolbar */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500 mr-1">Text:</span>
                    <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 25))} className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-white text-xs font-bold text-gray-600 hover:bg-gray-100">A−</button>
                    <button type="button" onClick={() => setZoom((z) => Math.min(200, z + 25))} className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-white text-xs font-bold text-gray-600 hover:bg-gray-100">A+</button>
                  </div>
                  <div className="h-4 w-px bg-gray-300" />
                  <div className="flex items-center gap-1">
                    {highlightColors.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setAnnotationColor(c.value)}
                        className={`h-5 w-5 rounded-full border-2 transition-all ${annotationColor === c.value ? 'border-gray-800 scale-110' : 'border-gray-300'}`}
                        style={{ backgroundColor: c.value }}
                        aria-label={`Highlight color: ${c.label}`}
                        title={c.label}
                      />
                    ))}
                  </div>
                  {highlights.length > 0 && (
                    <>
                      <div className="h-4 w-px bg-gray-300" />
                      <button type="button" onClick={() => setHighlights([])} className="text-[10px] text-red-600 hover:text-red-700 font-medium">Clear all</button>
                    </>
                  )}
                </div>
                <div
                  className="max-h-[400px] overflow-y-auto rounded-lg bg-gray-50 border border-gray-200 font-mono leading-relaxed transition-all duration-200"
                  style={{ fontSize: `${Math.round(14 * (zoom / 100))}px` }}
                >
                  {patternRows.map((row, idx) => {
                    const highlight = highlights.find((h) => h.row === idx)
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 px-3 py-1 cursor-pointer hover:bg-gray-100 transition-colors border-l-4 ${
                          currentRow === idx ? 'border-l-purple-500' : 'border-l-transparent'
                        }`}
                        style={highlight ? { backgroundColor: highlight.color } : undefined}
                        onClick={() => {
                          setCurrentRow(idx)
                          setShowAnnotationForm(true)
                        }}
                      >
                        <span className="text-[10px] text-gray-400 select-none min-w-[2rem] text-right pt-0.5 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-gray-800 whitespace-pre-wrap flex-1">
                          {row || '\u00A0'}
                        </span>
                        {highlight?.note && (
                          <span className="text-[10px] text-gray-500 italic shrink-0 max-w-[100px] truncate" title={highlight.note}>
                            💬 {highlight.note}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Annotation form */}
                {showAnnotationForm && currentRow !== null && (
                  <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
                    <p className="text-xs font-medium text-purple-700">
                      Annotate row {currentRow + 1}
                    </p>
                    <input
                      type="text"
                      value={annotationNote}
                      onChange={(e) => setAnnotationNote(e.target.value)}
                      placeholder="Add a note (optional)..."
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddHighlight}
                        className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 min-h-[32px]"
                      >
                        Highlight Row
                      </button>
                      {highlights.find((h) => h.row === currentRow) && (
                        <button
                          type="button"
                          onClick={() => {
                            const h = highlights.find((h) => h.row === currentRow)
                            if (h) handleRemoveHighlight(h.id)
                          }}
                          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 min-h-[32px]"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAnnotationForm(false)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 min-h-[32px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Abbreviations */}
                {pattern.abbreviations && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-purple-600 hover:text-purple-700">
                      Abbreviations
                    </summary>
                    <div className="mt-2 rounded-lg bg-purple-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
                      {pattern.abbreviations}
                    </div>
                  </details>
                )}

                {/* Translate Button */}
                <TranslateButton
                  text={pattern.instructions ?? ''}
                  onTranslated={() => {}}
                />
              </div>
            )}

            {/* No content at all */}
            {!hasFile && !hasInstructions && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No pattern content available</p>
                <Link
                  href={`/patterns/${pattern.id}`}
                  className="mt-2 inline-flex items-center text-sm text-purple-600 hover:text-purple-700"
                >
                  Edit pattern →
                </Link>
              </div>
            )}

            {/* Link to full pattern page + reset progress */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <ResetProgressButton projectId={projectId} patternId={pattern.id} />
              <Link
                href={`/patterns/${pattern.id}`}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium min-h-[44px] flex items-center"
              >
                View full pattern →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ─── Notes Panel (collapsible quick-access with inline creation) ─────────────

function NotesPanel({ projectId, notes }: { projectId: string; notes: Note[] }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteCategory, setNoteCategory] = useState('general')
  const [saving, setSaving] = useState(false)
  const [localNotes, setLocalNotes] = useState(notes)

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    setSaving(true)
    try {
      const { createNote } = await import('@/lib/actions/notes')
      const formData = new FormData()
      formData.set('content', noteContent.trim())
      formData.set('category', noteCategory)
      const result = await createNote(projectId, null, formData)
      if (!result?.error) {
        // Add to local list
        setLocalNotes((prev) => [
          {
            id: crypto.randomUUID(),
            project_id: projectId,
            user_id: '',
            content: noteContent.trim(),
            category: noteCategory,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ])
        setNoteContent('')
        setNoteCategory('general')
        setShowAddForm(false)
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 hover:bg-gray-50 transition-colors min-h-[48px]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">Notes</span>
          {localNotes.length > 0 && (
            <span className="text-[10px] rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">
              {localNotes.length}
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4">
          {/* Inline add note form */}
          {showAddForm ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your note..."
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="general">General</option>
                  <option value="remember_next_time">Remember Next Time</option>
                  <option value="pattern_alteration">Pattern Alteration</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={saving || !noteContent.trim()}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 min-h-[32px]"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNoteContent('') }}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 min-h-[32px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors min-h-[40px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Quick Note
            </button>
          )}

          {localNotes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">No notes yet</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {localNotes.slice(0, 5).map((note) => (
                <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${
                      note.category === 'remember_next_time'
                        ? 'bg-orange-100 text-orange-700'
                        : note.category === 'pattern_alteration'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {formatLabel(note.category)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {localNotes.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-1">
                  +{localNotes.length - 5} more notes
                </p>
              )}
              <div className="pt-2 flex justify-end">
                <Link
                  href={`/projects/${projectId}/notes`}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium min-h-[44px] flex items-center"
                >
                  View all notes →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Focus Mode (Active Crocheting Mode) ─────────────────────────────────────
// Minimal UI: just timer, counters, and optionally pattern. Large buttons, no distractions.

function FocusMode({
  project,
  activeSession,
  totalDurationSeconds,
  counters,
  pattern,
  patternFileUrl,
  onExit,
}: {
  project: Project
  activeSession: TimeSession | null
  totalDurationSeconds: number
  counters: Counter[]
  pattern: Pattern | null
  patternFileUrl: string | null
  onExit: () => void
}) {
  const { isRunning, elapsed, isLoading, start, stop } = useTimer({
    projectId: project.id,
    activeSession,
  })
  const [showPattern, setShowPattern] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-y-auto">
      {/* Top bar — minimal */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-sm font-semibold text-gray-200 truncate max-w-[60%]">{project.name}</h2>
        <div className="flex items-center gap-2">
          {pattern && (
            <button
              type="button"
              onClick={() => setShowPattern(!showPattern)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600 transition-colors"
              aria-label={showPattern ? 'Hide pattern' : 'Show pattern'}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-gray-800 px-3 text-sm font-medium text-gray-300 hover:bg-gray-700 active:bg-gray-600 transition-colors"
            aria-label="Exit focus mode"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Pattern viewer in focus mode */}
      {showPattern && pattern && (
        <div className="px-4 py-3 border-b border-gray-800">
          {pattern.type === 'uploaded' && patternFileUrl ? (
            <div className="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
              {pattern.file_name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={patternFileUrl}
                  className="w-full h-[250px] sm:h-[300px]"
                  title={`Pattern: ${pattern.title}`}
                />
              ) : pattern.file_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={patternFileUrl}
                  alt={`Pattern: ${pattern.title}`}
                  className="max-w-full max-h-[300px] object-contain mx-auto"
                />
              ) : null}
            </div>
          ) : pattern.instructions ? (
            <div className="max-h-[250px] overflow-y-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed border border-gray-700">
              {pattern.instructions}
            </div>
          ) : null}
        </div>
      )}

      {/* Main content — timer + counters */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-8">
        {/* Timer — extra large in focus mode */}
        <div className="text-center w-full max-w-md">
          <p
            className="font-mono text-6xl font-bold tracking-wider text-white sm:text-7xl tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatElapsed(elapsed)}
          </p>
          {isRunning && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-400">Running</span>
            </div>
          )}
          <div className="mt-6 flex justify-center">
            {isRunning ? (
              <button
                type="button"
                onClick={stop}
                disabled={isLoading}
                aria-label="Stop timer"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-red-600 px-12 py-5 text-lg font-bold text-white shadow-xl hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-400/50 active:scale-95 disabled:opacity-50 transition-all min-h-[60px] min-w-[180px]"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                {isLoading ? 'Stopping...' : 'Stop'}
              </button>
            ) : (
              <button
                type="button"
                onClick={start}
                disabled={isLoading}
                aria-label="Start timer"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-green-600 px-12 py-5 text-lg font-bold text-white shadow-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-400/50 active:scale-95 disabled:opacity-50 transition-all min-h-[60px] min-w-[180px]"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
                {isLoading ? 'Starting...' : 'Start'}
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-400">
            Total: <span className="font-semibold text-gray-200">{formatTotalTime(totalDurationSeconds)}</span>
          </p>
        </div>

        {/* Counters — large, swipe-friendly */}
        {counters.length > 0 && (
          <div className="w-full max-w-md space-y-4">
            {counters.map((counter) => (
              <FocusCounterRow key={counter.id} counter={counter} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FocusCounterRow({ counter }: { counter: Counter }) {
  const [value, setValue] = useState(counter.current_value)
  const [loading, setLoading] = useState(false)
  const [showTargetReached, setShowTargetReached] = useState(false)
  const [targetAcknowledged, setTargetAcknowledged] = useState(false)

  const handleIncrement = async () => {
    if (counter.target_value && value >= counter.target_value && !targetAcknowledged) {
      setShowTargetReached(true)
      return
    }
    setLoading(true)
    const { data } = await incrementCounter(counter.id)
    if (data) {
      setValue(data.current_value)
      if (counter.target_value && data.current_value >= counter.target_value && !targetAcknowledged) {
        setShowTargetReached(true)
      }
    }
    setLoading(false)
  }

  const handleContinuePastTarget = async () => {
    setTargetAcknowledged(true)
    setShowTargetReached(false)
    setLoading(true)
    const { data } = await incrementCounter(counter.id)
    if (data) setValue(data.current_value)
    setLoading(false)
  }

  const handleDecrement = async () => {
    if (value <= 0) return
    setLoading(true)
    const { data } = await decrementCounter(counter.id)
    if (data) setValue(data.current_value)
    setLoading(false)
  }

  const progress = counter.target_value ? Math.min(100, (value / counter.target_value) * 100) : null

  return (
    <div className="rounded-2xl bg-gray-800/80 p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-200 truncate">{counter.name}</p>
        {counter.target_value && (
          <span className="text-xs text-gray-400 shrink-0 ml-2">
            {value}/{counter.target_value}
          </span>
        )}
      </div>

      {counter.target_value && (
        <div className="mb-3 h-2 rounded-full bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Target reached popup — dark mode */}
      {showTargetReached && (
        <div className="mb-3 rounded-lg border border-green-700 bg-green-900/50 p-3 text-center space-y-2">
          <p className="text-sm font-medium text-green-300">
            🎉 Target reached! ({counter.target_value})
          </p>
          <p className="text-xs text-green-400">Continue counting past the target?</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleContinuePastTarget}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 min-h-[32px]"
            >
              Yes, keep going
            </button>
            <button
              type="button"
              onClick={() => setShowTargetReached(false)}
              className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 min-h-[32px]"
            >
              Stop here
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={loading || value <= 0}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800 text-2xl font-bold text-gray-300 shadow-lg hover:bg-gray-700 active:bg-gray-600 active:scale-95 disabled:opacity-30 transition-all min-h-[56px] min-w-[56px]"
          aria-label={`Decrease ${counter.name}`}
        >
          −
        </button>
        <span className="min-w-[4rem] text-center text-3xl font-bold text-white tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={loading}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-purple-500 bg-purple-900/50 text-2xl font-bold text-purple-300 shadow-lg hover:bg-purple-800/50 active:bg-purple-700/50 active:scale-95 disabled:opacity-30 transition-all min-h-[56px] min-w-[56px]"
          aria-label={`Increase ${counter.name}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Reset Progress Button ───────────────────────────────────────────────────

function ResetProgressButton({ projectId, patternId }: { projectId: string; patternId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    await deleteAllAnnotations(projectId, patternId)
    setResetting(false)
    setConfirming(false)
    // Force page reload to clear annotation state
    window.location.reload()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-red-600">Clear all annotations?</span>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="text-[10px] font-medium text-red-600 hover:text-red-700 underline"
        >
          {resetting ? 'Clearing...' : 'Yes'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-[10px] font-medium text-gray-500 hover:text-gray-700"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs text-gray-500 hover:text-red-600 font-medium min-h-[44px] flex items-center gap-1 transition-colors"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      Reset progress
    </button>
  )
}

// ─── Quick Link (touch-friendly navigation) ──────────────────────────────────

function QuickLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    yarn: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />,
    camera: <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />,
    note: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
    hook: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.658 5.659a2.25 2.25 0 01-3.182-3.182l5.659-5.658m0 0L3.75 7.5m4.489 4.489l4.242-4.242m3.536 3.536l5.658-5.659a2.25 2.25 0 00-3.182-3.182l-5.659 5.658m0 0l4.489 4.489" />,
    counter: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
    pricing: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />,
  }

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:border-purple-300 hover:shadow-md active:bg-gray-50 active:scale-95 transition-all min-h-[64px] justify-center"
    >
      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        {icons[icon]}
      </svg>
      <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{label}</span>
    </Link>
  )
}
