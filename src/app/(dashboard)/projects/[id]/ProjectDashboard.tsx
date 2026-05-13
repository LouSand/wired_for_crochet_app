'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Project, TimeSession, Counter } from '@/types/database'
import { useTimer } from '@/hooks/useTimer'
import { incrementCounter, decrementCounter } from '@/lib/actions/counters'
import { deleteProject } from '@/lib/actions/projects'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

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
  patternTitle: string | null
  activeSession: TimeSession | null
  totalDurationSeconds: number
  counters: Counter[]
}

export default function ProjectDashboard({
  project,
  patternTitle,
  activeSession,
  totalDurationSeconds,
  counters,
}: ProjectDashboardProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

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

  const statusColor = STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-700'

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
            {patternTitle && (
              <Link href={`/patterns/${project.pattern_id}`} className="text-purple-600 hover:underline">
                {patternTitle}
              </Link>
            )}
          </div>
        </div>
        {/* Actions menu */}
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
          </div>
        </div>
      )}

      {/* ═══ MAIN WORKSPACE: Timer + Counters ═══ */}
      {/* On mobile: stacked vertically. On desktop: side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Timer — large, easy to tap */}
        <TimerCard projectId={project.id} activeSession={activeSession} totalDurationSeconds={totalDurationSeconds} />

        {/* Counters — tap-friendly with large buttons */}
        <CountersCard projectId={project.id} counters={counters} />
      </div>

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
      {/* Header row */}
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

      {/* Large elapsed display */}
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

      {/* Large Start/Stop button — minimum 48px height for easy tapping */}
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

      {/* Total time */}
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

  const handleIncrement = async () => {
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
      {/* Counter name */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-800 truncate">{counter.name}</p>
        {counter.target_value && (
          <span className="text-xs text-gray-500 shrink-0 ml-2">
            {value}/{counter.target_value}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {counter.target_value && (
        <div className="mb-3 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Large counter controls — designed for tapping while crocheting */}
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

// ─── Quick Link (touch-friendly navigation) ──────────────────────────────────

function QuickLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const icons: Record<string, JSX.Element> = {
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
