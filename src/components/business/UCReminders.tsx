'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getUCPeriods } from '@/lib/actions/universal-credit'
import type { UCReportingPeriod } from '@/types/universal-credit'

/**
 * UC Reminder notifications component.
 * Shows alerts for upcoming submission deadlines and overdue periods.
 * Can be placed on the business dashboard or as a global notification.
 */
export default function UCReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function checkReminders() {
      const { data: periods } = await getUCPeriods()
      const now = new Date()
      const alerts: Reminder[] = []

      for (const period of periods) {
        if (period.status === 'submitted' || period.status === 'locked') continue

        const dueDate = new Date(period.submission_due)
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilDue < 0) {
          alerts.push({
            id: `overdue-${period.id}`,
            periodId: period.id,
            type: 'overdue',
            message: `UC report overdue! Was due ${formatDate(period.submission_due)}`,
            periodLabel: `${formatDate(period.period_start)} – ${formatDate(period.period_end)}`,
            urgency: 'critical',
          })
        } else if (daysUntilDue <= 3) {
          alerts.push({
            id: `urgent-${period.id}`,
            periodId: period.id,
            type: 'due_soon',
            message: `UC report due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
            periodLabel: `${formatDate(period.period_start)} – ${formatDate(period.period_end)}`,
            urgency: 'high',
          })
        } else if (daysUntilDue <= 7) {
          alerts.push({
            id: `upcoming-${period.id}`,
            periodId: period.id,
            type: 'upcoming',
            message: `UC report due in ${daysUntilDue} days`,
            periodLabel: `${formatDate(period.period_start)} – ${formatDate(period.period_end)}`,
            urgency: 'medium',
          })
        }

        // Check if period end has passed but status is still draft
        const periodEnd = new Date(period.period_end)
        if (periodEnd < now && period.status === 'draft') {
          alerts.push({
            id: `incomplete-${period.id}`,
            periodId: period.id,
            type: 'incomplete',
            message: 'Period ended but report not started',
            periodLabel: `${formatDate(period.period_start)} – ${formatDate(period.period_end)}`,
            urgency: 'high',
          })
        }
      }

      setReminders(alerts)
    }

    checkReminders()
  }, [])

  const visibleReminders = reminders.filter((r) => !dismissed.has(r.id))

  if (visibleReminders.length === 0) return null

  return (
    <div className="space-y-2">
      {visibleReminders.map((reminder) => (
        <div
          key={reminder.id}
          className={`flex items-center justify-between rounded-lg border p-3 ${
            reminder.urgency === 'critical'
              ? 'border-red-300 bg-red-50'
              : reminder.urgency === 'high'
              ? 'border-amber-300 bg-amber-50'
              : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {reminder.urgency === 'critical' ? '🚨' : reminder.urgency === 'high' ? '⚠️' : '📋'}
            </span>
            <div>
              <p className={`text-sm font-medium ${
                reminder.urgency === 'critical' ? 'text-red-800' : reminder.urgency === 'high' ? 'text-amber-800' : 'text-blue-800'
              }`}>
                {reminder.message}
              </p>
              <p className="text-xs text-gray-500">{reminder.periodLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/business/universal-credit"
              className={`rounded-md px-3 py-1.5 text-xs font-medium min-h-[32px] flex items-center ${
                reminder.urgency === 'critical'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              Open
            </Link>
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set([...prev, reminder.id]))}
              className="text-gray-400 hover:text-gray-600 text-xs"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

interface Reminder {
  id: string
  periodId: string
  type: 'overdue' | 'due_soon' | 'upcoming' | 'incomplete'
  message: string
  periodLabel: string
  urgency: 'critical' | 'high' | 'medium'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
