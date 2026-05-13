import Link from 'next/link'
import type { Project } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700 border-gray-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  abandoned: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_ICONS: Record<string, string> = {
  planned: '📋',
  in_progress: '🧶',
  paused: '⏸️',
  completed: '✅',
  abandoned: '🗑️',
}

function formatStatus(status: string): string {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function getDueDateColor(dateStr: string, status: string): string {
  if (status === 'completed' || status === 'abandoned') return 'text-gray-500'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'text-red-600 font-semibold'
  if (diff <= 2) return 'text-amber-600 font-medium'
  return 'text-gray-600'
}

function getPriorityIndicator(priority: number): { color: string; label: string } {
  switch (priority) {
    case 1: return { color: 'bg-red-500', label: 'P1' }
    case 2: return { color: 'bg-orange-500', label: 'P2' }
    case 3: return { color: 'bg-yellow-500', label: 'P3' }
    case 4: return { color: 'bg-blue-400', label: 'P4' }
    case 5: return { color: 'bg-gray-400', label: 'P5' }
    default: return { color: 'bg-gray-300', label: '' }
  }
}

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  const statusIcon = STATUS_ICONS[project.status] ?? '📋'
  const priorityInfo = project.priority ? getPriorityIndicator(project.priority) : null

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-purple-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[120px]"
    >
      {/* Card content */}
      <div className="p-4 sm:p-5">
        {/* Top row: icon + name + priority */}
        <div className="flex items-start gap-3">
          {/* Status icon as visual tile */}
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg ${statusColor}`}>
            {statusIcon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                {project.name}
              </h3>
              {priorityInfo && (
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatStatus(project.status)}
            </p>
          </div>
        </div>

        {/* Info row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {project.estimated_completion_date && (
            <span className={`inline-flex items-center gap-1 ${getDueDateColor(project.estimated_completion_date, project.status)}`}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Due {formatDate(project.estimated_completion_date)}
            </span>
          )}
          {project.customer_name && (
            <span className="inline-flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
              {project.customer_name}
            </span>
          )}
          {project.date_started && !project.estimated_completion_date && (
            <span>Started {formatDate(project.date_started)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
