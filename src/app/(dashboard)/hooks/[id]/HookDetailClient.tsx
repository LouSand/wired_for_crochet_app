'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteHookEntry } from '@/lib/actions/hooks'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { HookEntry, HookUsage } from '@/types/database'

interface HookDetailClientProps {
  hookEntry: HookEntry & { hook_usages: HookUsage[] }
}

export default function HookDetailClient({ hookEntry }: HookDetailClientProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteHookEntry(hookEntry.id)
    if (result?.error) {
      setDeleting(false)
      setShowDeleteDialog(false)
      return
    }
    router.push('/hooks')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/hooks"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            ← Back to Hook Collection
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {hookEntry.size}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/hooks/${hookEntry.id}/edit`}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Hook details */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column - details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Size</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{hookEntry.size}</dd>
            </div>
            {hookEntry.type && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-0.5 text-sm text-gray-900 capitalize">{hookEntry.type}</dd>
              </div>
            )}
            {hookEntry.brand && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Brand</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{hookEntry.brand}</dd>
              </div>
            )}
            {hookEntry.material && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Material</dt>
                <dd className="mt-0.5 text-sm text-gray-900 capitalize">{hookEntry.material}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Right column - linked projects */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Linked Projects</h2>
          {hookEntry.hook_usages.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              This hook hasn&apos;t been linked to any projects yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100" role="list">
              {hookEntry.hook_usages.map((usage) => (
                <li key={usage.id} className="flex items-center justify-between py-3">
                  <Link
                    href={`/projects/${usage.project_id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700"
                  >
                    Project
                  </Link>
                  {usage.note && (
                    <span className="text-sm text-gray-500 truncate ml-2 max-w-[200px]">
                      {usage.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Hook Entry"
        message={`Are you sure you want to delete the "${hookEntry.size}" hook? This will also remove all project usage records for this hook. This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}
