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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
              {formatLabel(project.status)}
            </span>
            {project.priority && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                P{project.priority}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/business/invoicing/invoices/new?from_project=${project.id}`}
            className="inline-flex items-center rounded-md border border-purple-300 bg-white px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm hover:bg-purple-50"
          >
            Invoice
          </Link>
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main grid: Timer + Counters side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Timer Card */}
        <TimerCard projectId={project.id} activeSession={activeSession} totalDurationSeconds={totalDurationSeconds} />

        {/* Counters Card */}
        <CountersCard projectId={project.id} counters={counters} />
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <InfoChip label="Started" value={formatDate(project.date_started)} />
        {project.estimated_completion_date && (
          <InfoChip label="Due" value={formatDate(project.estimated_completion_date)} />
        )}
        {project.difficulty && (
          <InfoChip label="Difficulty" value={formatLabel(project.difficulty)} />
        )}
        {project.customer_name && (
          <InfoChip label="Customer" value={project.customer_name} />
        )}
        {project.priority && (
          <InfoChip label="Priority" value={PRIORITY_LABELS[project.priority]} />
        )}
        {patternTitle && (
          <InfoChip label="Pattern" value={patternTitle} href={`/patterns/${project.pattern_id}`} />
        )}
      </div>

      {/* Quick links to detailed views */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href={`/projects/${project.id}/time`} label="Time History" icon="clock" />
        <QuickLink href={`/projects/${project.id}/yarn`} label="Yarn" icon="yarn" />
        <QuickLink href={`/projects/${project.id}/photos`} label="Photos" icon="camera" />
        <QuickLink href={`/projects/${project.id}/notes`} label="Notes" icon="note" />
        <QuickLink href={`/projects/${project.id}/hooks`} label="Hooks" icon="hook" />
        <QuickLink href={`/projects/${project.id}/counters`} label="All Counters" icon="counter" />
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

// ─── Timer Card ──────────────────────────────────────────────────────────────

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
    <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Timer</h2>
        <Link href={`/projects/${projectId}/time`} className="text-xs text-purple-600 hover:text-purple-700">
          History →
        </Link>
      </div>

      {/* Elapsed display */}
      <div className="text-center">
        <p className="font-mono text-4xl font-bold tracking-wider text-gray-900" aria-live="polite">
          {formatElapsed(elapsed)}
        </p>
        {isRunning && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-xs font-medium text-green-700">Running</span>
          </div>
        )}
      </div>

      {/* Start/Stop button */}
      <div className="mt-4 flex justify-center">
        {isRunning ? (
          <button
            type="button"
            onClick={stop}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:opacity-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            {isLoading ? 'Stopping...' : 'Stop'}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
            {isLoading ? 'Starting...' : 'Start'}
          </button>
        )}
      </div>

      {/* Total time */}
      <p className="mt-3 text-center text-xs text-gray-500">
        Total: {formatTotalTime(totalDurationSeconds)}
      </p>
    </div>
  )
}

// ─── Counters Card ───────────────────────────────────────────────────────────

function CountersCard({ projectId, counters }: { projectId: string; counters: Counter[] }) {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Counters</h2>
        <Link href={`/projects/${projectId}/counters`} className="text-xs text-purple-600 hover:text-purple-700">
          Manage →
        </Link>
      </div>

      {counters.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">No counters yet.</p>
          <Link
            href={`/projects/${projectId}/counters`}
            className="mt-2 inline-flex text-xs text-purple-600 hover:text-purple-700"
          >
            + Add counter
          </Link>
        </div>
      ) : (
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
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
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
      {/* Counter name + progress */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{counter.name}</p>
        {counter.target_value && (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 shrink-0">
              {value}/{counter.target_value}
            </span>
          </div>
        )}
      </div>

      {/* Value + buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={loading || value <= 0}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
          aria-label={`Decrease ${counter.name}`}
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-bold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-30 transition-colors"
          aria-label={`Increase ${counter.name}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Info Chip ───────────────────────────────────────────────────────────────

function InfoChip({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900 truncate">{value}</p>
    </div>
  )

  if (href) {
    return <Link href={href} className="hover:ring-2 hover:ring-purple-200 rounded-lg transition-shadow">{content}</Link>
  }
  return content
}

// ─── Quick Link ──────────────────────────────────────────────────────────────

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
      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
    >
      <svg className="h-4 w-4 text-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        {icons[icon]}
      </svg>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </Link>
  )
}
