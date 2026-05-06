'use client'

import Link from 'next/link'
import type { Project } from '@/types/database'

interface DeadlineNotificationsProps {
  projects: Project[]
}

interface DeadlineAlert {
  project: Project
  type: 'overdue' | 'due_soon' | 'needs_attention'
  message: string
  daysUntilDue: number
}

/**
 * Calculate deadline alerts for projects.
 *
 * Logic:
 * - If a project has an estimated_completion_date and is NOT completed/abandoned:
 *   - If past due: "overdue" alert
 *   - If due within 2 days: "due_soon" alert
 *   - If due within 2 days + buffer (based on not being in_progress): "needs_attention" alert
 *     The buffer gives an extra 1-2 days warning if the project isn't actively being worked on
 */
function calculateAlerts(projects: Project[]): DeadlineAlert[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const alerts: DeadlineAlert[] = []

  for (const project of projects) {
    // Skip projects without deadlines or that are finished
    if (!project.estimated_completion_date) continue
    if (project.status === 'completed' || project.status === 'abandoned') continue

    const dueDate = new Date(project.estimated_completion_date)
    dueDate.setHours(0, 0, 0, 0)

    const diffMs = dueDate.getTime() - today.getTime()
    const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    // Extra buffer days for projects not actively in progress
    const bufferDays = project.status === 'in_progress' ? 0 : 2

    if (daysUntilDue < 0) {
      // Past due
      alerts.push({
        project,
        type: 'overdue',
        message: `"${project.name}" is ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue!`,
        daysUntilDue,
      })
    } else if (daysUntilDue <= 2) {
      // Due very soon
      alerts.push({
        project,
        type: 'due_soon',
        message: daysUntilDue === 0
          ? `"${project.name}" is due today!`
          : `"${project.name}" is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}!`,
        daysUntilDue,
      })
    } else if (daysUntilDue <= 2 + bufferDays && project.status !== 'in_progress') {
      // Needs attention — not in progress and deadline approaching
      alerts.push({
        project,
        type: 'needs_attention',
        message: `"${project.name}" is due in ${daysUntilDue} days and hasn't been started yet.`,
        daysUntilDue,
      })
    }
  }

  // Sort: overdue first, then by days until due
  alerts.sort((a, b) => a.daysUntilDue - b.daysUntilDue)

  return alerts
}

const ALERT_STYLES = {
  overdue: {
    container: 'border-red-300 bg-red-50',
    icon: 'text-red-600',
    text: 'text-red-800',
    link: 'text-red-700 hover:text-red-900',
  },
  due_soon: {
    container: 'border-amber-300 bg-amber-50',
    icon: 'text-amber-600',
    text: 'text-amber-800',
    link: 'text-amber-700 hover:text-amber-900',
  },
  needs_attention: {
    container: 'border-blue-300 bg-blue-50',
    icon: 'text-blue-600',
    text: 'text-blue-800',
    link: 'text-blue-700 hover:text-blue-900',
  },
}

export default function DeadlineNotifications({ projects }: DeadlineNotificationsProps) {
  const alerts = calculateAlerts(projects)

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2" role="region" aria-label="Project deadline notifications">
      {alerts.map((alert) => {
        const styles = ALERT_STYLES[alert.type]
        return (
          <div
            key={alert.project.id}
            className={`flex items-center gap-3 rounded-lg border p-3 ${styles.container}`}
            role="alert"
          >
            <svg
              className={`h-5 w-5 flex-shrink-0 ${styles.icon}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              {alert.type === 'overdue' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <p className={`flex-1 text-sm font-medium ${styles.text}`}>
              {alert.message}
            </p>
            <Link
              href={`/projects/${alert.project.id}`}
              className={`text-xs font-medium underline ${styles.link}`}
            >
              View
            </Link>
          </div>
        )
      })}
    </div>
  )
}
