'use client'

import { useState, useActionState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import type { Project } from '@/types/database'
import { updateProject, deleteProject, type ProjectActionState } from '@/lib/actions/projects'
import { PROJECT_STATUSES, PROJECT_DIFFICULTIES } from '@/lib/validators/project'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  abandoned: 'bg-red-100 text-red-700',
}

interface ProjectDetailClientProps {
  project: Project
  patternTitle?: string | null
}

export default function ProjectDetailClient({ project, patternTitle }: ProjectDetailClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bind updateProject with the project ID
  const updateProjectWithId = updateProject.bind(null, project.id)
  const hasSubmittedEdit = useRef(false)
  const [editState, editFormAction, editPending] = useActionState<ProjectActionState, FormData>(
    updateProjectWithId,
    null
  )

  // On successful edit, close the form
  useEffect(() => {
    if (hasSubmittedEdit.current && editState === null && !editPending) {
      setIsEditing(false)
      hasSubmittedEdit.current = false
      router.refresh()
    }
  }, [editState, editPending, router])

  const handleEditSubmit = (formData: FormData) => {
    hasSubmittedEdit.current = true
    editFormAction(formData)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteProject(project.id)
    if (result?.error) {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      // Could show an error toast here
      return
    }
    router.push('/projects')
  }

  const tabs = [
    { label: 'Overview', href: `/projects/${project.id}` },
    { label: 'Time', href: `/projects/${project.id}/time` },
    { label: 'Counters', href: `/projects/${project.id}/counters` },
    { label: 'Yarn', href: `/projects/${project.id}/yarn` },
    { label: 'Hooks', href: `/projects/${project.id}/hooks` },
    { label: 'Photos', href: `/projects/${project.id}/photos` },
    { label: 'Notes', href: `/projects/${project.id}/notes` },
    { label: 'Pricing', href: `/projects/${project.id}/pricing` },
  ]

  const statusColor = STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-700'

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
            >
              {formatLabel(project.status)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {project.difficulty && (
              <span>
                <span className="font-medium text-gray-700">Difficulty:</span>{' '}
                {formatLabel(project.difficulty)}
              </span>
            )}
            {project.date_started && (
              <span>
                <span className="font-medium text-gray-700">Started:</span>{' '}
                {formatDate(project.date_started)}
              </span>
            )}
            {project.date_completed && (
              <span>
                <span className="font-medium text-gray-700">Completed:</span>{' '}
                {formatDate(project.date_completed)}
              </span>
            )}
            {project.customer_name && (
              <span>
                <span className="font-medium text-gray-700">Customer:</span>{' '}
                {project.customer_name}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/business/invoicing/invoices/new?from_project=${project.id}`}
            className="inline-flex items-center rounded-md border border-purple-300 bg-white px-3 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Create Invoice
          </Link>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditing && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Edit Project</h2>
          <form action={handleEditSubmit} className="space-y-4">
            {editState?.error && (
              <div className="rounded-md bg-red-50 p-3" role="alert">
                <p className="text-sm text-red-700">{editState.error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="sm:col-span-2">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={project.name}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {editState?.fieldErrors?.name && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.name[0]}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  defaultValue={project.description ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="edit-status"
                  name="status"
                  defaultValue={project.status}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {formatLabel(s)}
                    </option>
                  ))}
                </select>
                {editState?.fieldErrors?.status && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.status[0]}
                  </p>
                )}
              </div>

              {/* Difficulty */}
              <div>
                <label htmlFor="edit-difficulty" className="block text-sm font-medium text-gray-700">
                  Difficulty
                </label>
                <select
                  id="edit-difficulty"
                  name="difficulty"
                  defaultValue={project.difficulty ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select difficulty...</option>
                  {PROJECT_DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {formatLabel(d)}
                    </option>
                  ))}
                </select>
                {editState?.fieldErrors?.difficulty && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.difficulty[0]}
                  </p>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label htmlFor="edit-customer_name" className="block text-sm font-medium text-gray-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="edit-customer_name"
                  name="customer_name"
                  defaultValue={project.customer_name ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {editState?.fieldErrors?.customer_name && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.customer_name[0]}
                  </p>
                )}
              </div>

              {/* Date Started */}
              <div>
                <label htmlFor="edit-date_started" className="block text-sm font-medium text-gray-700">
                  Date Started
                </label>
                <input
                  type="date"
                  id="edit-date_started"
                  name="date_started"
                  defaultValue={project.date_started ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {editState?.fieldErrors?.date_started && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.date_started[0]}
                  </p>
                )}
              </div>

              {/* Date Completed */}
              <div>
                <label htmlFor="edit-date_completed" className="block text-sm font-medium text-gray-700">
                  Date Completed
                </label>
                <input
                  type="date"
                  id="edit-date_completed"
                  name="date_completed"
                  defaultValue={project.date_completed ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {editState?.fieldErrors?.date_completed && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.date_completed[0]}
                  </p>
                )}
              </div>

              {/* Estimated Completion Date */}
              <div>
                <label htmlFor="edit-estimated_completion_date" className="block text-sm font-medium text-gray-700">
                  Due Date (Estimated Completion)
                </label>
                <input
                  type="date"
                  id="edit-estimated_completion_date"
                  name="estimated_completion_date"
                  defaultValue={project.estimated_completion_date ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {editState?.fieldErrors?.estimated_completion_date && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.estimated_completion_date[0]}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  id="edit-priority"
                  name="priority"
                  defaultValue={project.priority ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">No priority</option>
                  <option value="1">1 - Highest</option>
                  <option value="2">2 - High</option>
                  <option value="3">3 - Medium</option>
                  <option value="4">4 - Low</option>
                  <option value="5">5 - Lowest</option>
                </select>
                {editState?.fieldErrors?.priority && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.priority[0]}
                  </p>
                )}
              </div>

              {/* Hourly Rate Override */}
              <div>
                <label htmlFor="edit-hourly_rate_override" className="block text-sm font-medium text-gray-700">
                  Hourly Rate Override
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    id="edit-hourly_rate_override"
                    name="hourly_rate_override"
                    step="0.01"
                    min="0"
                    defaultValue={project.hourly_rate_override ?? ''}
                    placeholder="0.00"
                    className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                {editState?.fieldErrors?.hourly_rate_override && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {editState.fieldErrors.hourly_rate_override[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={editPending}
                className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <nav className="mt-6 border-b border-gray-200" aria-label="Project sections">
        <div className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Overview content (shown on the main detail page) */}
      <div className="mt-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>

          {project.description && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700">Description</h3>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          )}

          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-700">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                  {formatLabel(project.status)}
                </span>
              </dd>
            </div>
            {project.difficulty && (
              <div>
                <dt className="text-sm font-medium text-gray-700">Difficulty</dt>
                <dd className="mt-1 text-sm text-gray-600">{formatLabel(project.difficulty)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-700">Date Started</dt>
              <dd className="mt-1 text-sm text-gray-600">{formatDate(project.date_started)}</dd>
            </div>
            {project.date_completed && (
              <div>
                <dt className="text-sm font-medium text-gray-700">Date Completed</dt>
                <dd className="mt-1 text-sm text-gray-600">{formatDate(project.date_completed)}</dd>
              </div>
            )}
            {project.customer_name && (
              <div>
                <dt className="text-sm font-medium text-gray-700">Customer</dt>
                <dd className="mt-1 text-sm text-gray-600">{project.customer_name}</dd>
              </div>
            )}
            {project.hourly_rate_override !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-700">Hourly Rate</dt>
                <dd className="mt-1 text-sm text-gray-600">${project.hourly_rate_override.toFixed(2)}/hr</dd>
              </div>
            )}
            {project.estimated_completion_date && (
              <div>
                <dt className="text-sm font-medium text-gray-700">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-600">{formatDate(project.estimated_completion_date)}</dd>
              </div>
            )}
            {project.priority && (
              <div>
                <dt className="text-sm font-medium text-gray-700">Priority</dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {['', 'Highest', 'High', 'Medium', 'Low', 'Lowest'][project.priority]}
                </dd>
              </div>
            )}
            {patternTitle && project.pattern_id && (
              <div>
                <dt className="text-sm font-medium text-gray-700">Linked Pattern</dt>
                <dd className="mt-1 text-sm">
                  <Link
                    href={`/patterns/${project.pattern_id}`}
                    className="text-purple-600 hover:text-purple-800 hover:underline"
                  >
                    {patternTitle}
                  </Link>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-700">Created</dt>
              <dd className="mt-1 text-sm text-gray-600">{formatDate(project.created_at)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This will permanently remove the project and all associated data including time sessions, counters, photos, and notes. This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Project'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}
