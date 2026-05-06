import Link from 'next/link'
import type { Project } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  abandoned: 'bg-red-100 text-red-700',
}

function formatStatus(status: string): string {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDifficulty(difficulty: string): string {
  return difficulty.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface ProjectCardProps {
  project: Project
}

function getDueDateColor(dateStr: string, status: string): string {
  if (status === 'completed' || status === 'abandoned') return 'text-gray-600'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'text-red-600 font-medium'
  if (diff <= 2) return 'text-amber-600 font-medium'
  return 'text-gray-600'
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1: return 'text-red-600 font-medium'
    case 2: return 'text-orange-600 font-medium'
    case 3: return 'text-yellow-600'
    case 4: return 'text-blue-600'
    case 5: return 'text-gray-500'
    default: return 'text-gray-600'
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-700'

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
          {project.name}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
        >
          {formatStatus(project.status)}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
        {project.difficulty && (
          <p>
            <span className="font-medium text-gray-700">Difficulty:</span>{' '}
            {formatDifficulty(project.difficulty)}
          </p>
        )}
        {project.date_started && (
          <p>
            <span className="font-medium text-gray-700">Started:</span>{' '}
            {formatDate(project.date_started)}
          </p>
        )}
        {project.estimated_completion_date && (
          <p>
            <span className="font-medium text-gray-700">Due:</span>{' '}
            <span className={getDueDateColor(project.estimated_completion_date, project.status)}>
              {formatDate(project.estimated_completion_date)}
            </span>
          </p>
        )}
        {project.priority && (
          <p>
            <span className="font-medium text-gray-700">Priority:</span>{' '}
            <span className={getPriorityColor(project.priority)}>
              {['', 'Highest', 'High', 'Medium', 'Low', 'Lowest'][project.priority]}
            </span>
          </p>
        )}
        {project.customer_name && (
          <p>
            <span className="font-medium text-gray-700">Customer:</span>{' '}
            {project.customer_name}
          </p>
        )}
      </div>
    </Link>
  )
}
