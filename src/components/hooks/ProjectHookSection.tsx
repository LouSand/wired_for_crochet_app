'use client'

import { useState, useActionState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { HookEntry, HookUsage } from '@/types/database'
import {
  linkHookToProject,
  deleteHookUsage,
  type HookActionState,
} from '@/lib/actions/hooks'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface HookUsageWithEntry extends HookUsage {
  hook_entries: HookEntry
}

interface ProjectHookSectionProps {
  projectId: string
  hookUsages: HookUsageWithEntry[]
  allHookEntries: HookEntry[]
}

export default function ProjectHookSection({
  projectId,
  hookUsages,
  allHookEntries,
}: ProjectHookSectionProps) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteUsageId, setDeleteUsageId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Link hook form state
  const linkFormRef = useRef<HTMLFormElement>(null)
  const hasSubmittedLink = useRef(false)
  const [linkState, linkFormAction, linkPending] = useActionState<HookActionState, FormData>(
    linkHookToProject,
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
    await deleteHookUsage(deleteUsageId)
    setIsDeleting(false)
    setDeleteUsageId(null)
    router.refresh()
  }

  // Filter out hook entries already linked to this project
  const linkedHookIds = new Set(hookUsages.map((u) => u.hook_entry_id))
  const availableHooks = allHookEntries.filter((h) => !linkedHookIds.has(h.id))

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Linked Hooks</h2>
          <p className="mt-1 text-sm text-gray-500">
            Hooks from your collection used in this project
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Hook'}
        </button>
      </div>

      {/* Add Hook Form */}
      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-900">Link Hook to Project</h3>
          {availableHooks.length === 0 ? (
            <p className="text-sm text-gray-500">
              All hooks are already linked to this project, or you have no hooks in your collection.
            </p>
          ) : (
            <form ref={linkFormRef} action={handleLinkSubmit} className="space-y-4">
              <input type="hidden" name="project_id" value={projectId} />

              {linkState?.error && (
                <div className="rounded-md bg-red-50 p-3" role="alert">
                  <p className="text-sm text-red-700">{linkState.error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Hook selection */}
                <div>
                  <label htmlFor="hook_entry_id" className="block text-sm font-medium text-gray-700">
                    Hook <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="hook_entry_id"
                    name="hook_entry_id"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Select hook...</option>
                    {availableHooks.map((hook) => (
                      <option key={hook.id} value={hook.id}>
                        {hook.size}
                        {hook.brand ? ` — ${hook.brand}` : ''}
                        {hook.material ? ` (${hook.material})` : ''}
                      </option>
                    ))}
                  </select>
                  {linkState?.fieldErrors?.hook_entry_id && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {linkState.fieldErrors.hook_entry_id[0]}
                    </p>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                    Note
                  </label>
                  <input
                    type="text"
                    id="note"
                    name="note"
                    placeholder="e.g., used for main body"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {linkState?.fieldErrors?.note && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {linkState.fieldErrors.note[0]}
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
                  {linkPending ? 'Linking...' : 'Link Hook'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Hook Usage List */}
      {hookUsages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            No hooks linked to this project yet. Click &quot;Add Hook&quot; to link a hook from your collection.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hookUsages.map((usage) => (
            <div
              key={usage.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {usage.hook_entries.size}
                  {usage.hook_entries.brand && (
                    <span className="ml-2 text-gray-500">({usage.hook_entries.brand})</span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-500">
                  {usage.hook_entries.type && (
                    <span className="capitalize">{usage.hook_entries.type}</span>
                  )}
                  {usage.hook_entries.material && (
                    <span className="capitalize">{usage.hook_entries.material}</span>
                  )}
                  {usage.note && (
                    <span className="italic">{usage.note}</span>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => setDeleteUsageId(usage.id)}
                  className="rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteUsageId !== null}
        title="Remove Hook Link"
        message="Are you sure you want to remove this hook from the project? This will not delete the hook from your collection."
        confirmLabel={isDeleting ? 'Removing...' : 'Remove'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteUsageId(null)}
      />
    </div>
  )
}
