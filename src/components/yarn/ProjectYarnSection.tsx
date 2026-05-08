'use client'

import { useState, useActionState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { YarnEntry, YarnUsage } from '@/types/database'
import {
  linkYarnToProject,
  updateYarnUsage,
  deleteYarnUsage,
  type YarnActionState,
} from '@/lib/actions/yarn'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface YarnUsageWithEntry extends YarnUsage {
  yarn_entries: YarnEntry
}

interface ProjectYarnSectionProps {
  projectId: string
  yarnUsages: YarnUsageWithEntry[]
  allYarnEntries: YarnEntry[]
}

export default function ProjectYarnSection({
  projectId,
  yarnUsages,
  allYarnEntries,
}: ProjectYarnSectionProps) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUsageId, setEditingUsageId] = useState<string | null>(null)
  const [deleteUsageId, setDeleteUsageId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Link yarn form state
  const linkFormRef = useRef<HTMLFormElement>(null)
  const hasSubmittedLink = useRef(false)
  const [linkState, linkFormAction, linkPending] = useActionState<YarnActionState, FormData>(
    linkYarnToProject,
    null
  )

  // On successful link, close the form and refresh
  useEffect(() => {
    if (hasSubmittedLink.current && linkState === null && !linkPending) {
      setShowAddForm(false)
      hasSubmittedLink.current = false
      linkFormRef.current?.reset()
      router.refresh()
    }
  }, [linkState, linkPending, router])

  const handleLinkSubmit = (formData: FormData) => {
    hasSubmittedLink.current = true
    linkFormAction(formData)
  }

  const handleDelete = async () => {
    if (!deleteUsageId) return
    setIsDeleting(true)
    await deleteYarnUsage(deleteUsageId)
    setIsDeleting(false)
    setDeleteUsageId(null)
    router.refresh()
  }

  // Filter out yarn entries already linked to this project
  const linkedYarnIds = new Set(yarnUsages.map((u) => u.yarn_entry_id))
  const availableYarn = allYarnEntries.filter((y) => !linkedYarnIds.has(y.id))

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Linked Yarn</h2>
          <p className="mt-1 text-sm text-gray-500">
            Yarn from your inventory used in this project
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Yarn'}
        </button>
      </div>

      {/* Add Yarn Form */}
      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-900">Link Yarn to Project</h3>
          {availableYarn.length === 0 ? (
            <p className="text-sm text-gray-500">
              All yarn entries are already linked to this project, or you have no yarn in your inventory.
            </p>
          ) : (
            <form ref={linkFormRef} action={handleLinkSubmit} className="space-y-4">
              <input type="hidden" name="project_id" value={projectId} />

              {linkState?.error && (
                <div className="rounded-md bg-red-50 p-3" role="alert">
                  <p className="text-sm text-red-700">{linkState.error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Yarn selection */}
                <div className="sm:col-span-2">
                  <label htmlFor="yarn_entry_id" className="block text-sm font-medium text-gray-700">
                    Yarn <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="yarn_entry_id"
                    name="yarn_entry_id"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Select yarn...</option>
                    {availableYarn.map((yarn) => (
                      <option key={yarn.id} value={yarn.id}>
                        {yarn.name}
                        {yarn.colour ? ` — ${yarn.colour}` : ''}
                        {yarn.brand ? ` (${yarn.brand})` : ''}
                      </option>
                    ))}
                  </select>
                  {linkState?.fieldErrors?.yarn_entry_id && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {linkState.fieldErrors.yarn_entry_id[0]}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label htmlFor="quantity_used" className="block text-sm font-medium text-gray-700">
                    Quantity Used
                  </label>
                  <input
                    type="number"
                    id="quantity_used"
                    name="quantity_used"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {linkState?.fieldErrors?.quantity_used && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {linkState.fieldErrors.quantity_used[0]}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={linkPending}
                  className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {linkPending ? 'Linking...' : 'Link Yarn'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Yarn Usage List */}
      {yarnUsages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            No yarn linked to this project yet. Click &quot;Add Yarn&quot; to link yarn from your inventory.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {yarnUsages.map((usage) => (
            <YarnUsageRow
              key={usage.id}
              usage={usage}
              isEditing={editingUsageId === usage.id}
              onEdit={() => setEditingUsageId(usage.id)}
              onCancelEdit={() => setEditingUsageId(null)}
              onEditSuccess={() => {
                setEditingUsageId(null)
                router.refresh()
              }}
              onDelete={() => setDeleteUsageId(usage.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteUsageId !== null}
        title="Remove Yarn Link"
        message="Are you sure you want to remove this yarn from the project? This will not delete the yarn from your inventory."
        confirmLabel={isDeleting ? 'Removing...' : 'Remove'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteUsageId(null)}
      />
    </div>
  )
}

// ─── Yarn Usage Row ──────────────────────────────────────────────────────────

interface YarnUsageRowProps {
  usage: YarnUsageWithEntry
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onEditSuccess: () => void
  onDelete: () => void
}

function YarnUsageRow({
  usage,
  isEditing,
  onEdit,
  onCancelEdit,
  onEditSuccess,
  onDelete,
}: YarnUsageRowProps) {
  const yarn = usage.yarn_entries

  if (isEditing) {
    return (
      <EditYarnUsageRow
        usage={usage}
        onCancel={onCancelEdit}
        onSuccess={onEditSuccess}
      />
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {yarn.name}
          {yarn.colour && (
            <span className="ml-2 text-gray-500">({yarn.colour})</span>
          )}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-500">
          {yarn.brand && <span>{yarn.brand}</span>}
          {yarn.weight_category && (
            <span className="capitalize">{yarn.weight_category.replace(/_/g, ' ')}</span>
          )}
          <span>Qty used: {usage.quantity_used}</span>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ─── Edit Yarn Usage Row ─────────────────────────────────────────────────────

interface EditYarnUsageRowProps {
  usage: YarnUsageWithEntry
  onCancel: () => void
  onSuccess: () => void
}

function EditYarnUsageRow({ usage, onCancel, onSuccess }: EditYarnUsageRowProps) {
  const yarn = usage.yarn_entries
  const updateWithId = updateYarnUsage.bind(null, usage.id)
  const hasSubmitted = useRef(false)
  const [editState, editFormAction, editPending] = useActionState<YarnActionState, FormData>(
    updateWithId,
    null
  )

  useEffect(() => {
    if (hasSubmitted.current && editState === null && !editPending) {
      hasSubmitted.current = false
      onSuccess()
    }
  }, [editState, editPending, onSuccess])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    editFormAction(formData)
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <form action={handleSubmit} className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {yarn.name}
            {yarn.colour && (
              <span className="ml-2 text-gray-500">({yarn.colour})</span>
            )}
          </p>
          {editState?.error && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {editState.error}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`edit-qty-${usage.id}`} className="sr-only">
            Quantity used
          </label>
          <input
            type="number"
            id={`edit-qty-${usage.id}`}
            name="quantity_used"
            step="0.01"
            min="0"
            defaultValue={usage.quantity_used}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {editState?.fieldErrors?.quantity_used && (
            <p className="text-xs text-red-600" role="alert">
              {editState.fieldErrors.quantity_used[0]}
            </p>
          )}
          <button
            type="submit"
            disabled={editPending}
            className="rounded-md bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
