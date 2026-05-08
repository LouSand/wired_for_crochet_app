'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteYarnEntry } from '@/lib/actions/yarn'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { YarnEntry, YarnUsage } from '@/types/database'

function formatWeight(weight: string): string {
  return weight.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface YarnDetailClientProps {
  yarnEntry: YarnEntry & { yarn_usages: YarnUsage[] }
}

export default function YarnDetailClient({ yarnEntry }: YarnDetailClientProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const totalUsed = yarnEntry.yarn_usages.reduce(
    (sum, usage) => sum + usage.quantity_used,
    0
  )

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteYarnEntry(yarnEntry.id)
    if (result?.error) {
      setDeleting(false)
      setShowDeleteDialog(false)
      return
    }
    router.push('/yarn')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/yarn"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            ← Back to Yarn Inventory
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {yarnEntry.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/yarn/${yarnEntry.id}/edit`}
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

      {/* Yarn details */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column - details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          <dl className="mt-4 space-y-3">
            {yarnEntry.brand && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Brand</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{yarnEntry.brand}</dd>
              </div>
            )}
            {yarnEntry.colour && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Colour</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{yarnEntry.colour}</dd>
              </div>
            )}
            {yarnEntry.shade_code && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Shade Code</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{yarnEntry.shade_code}</dd>
              </div>
            )}
            {yarnEntry.dye_lot && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Dye Lot</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{yarnEntry.dye_lot}</dd>
              </div>
            )}
            {yarnEntry.weight_category && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Weight Category</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {formatWeight(yarnEntry.weight_category)}
                </dd>
              </div>
            )}
            {yarnEntry.thickness && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Thickness</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{yarnEntry.thickness}</dd>
              </div>
            )}
            {yarnEntry.fibre_content && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fibre Content</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{yarnEntry.fibre_content}</dd>
              </div>
            )}
            {yarnEntry.washing_instructions && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Washing Instructions</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{yarnEntry.washing_instructions}</dd>
              </div>
            )}
            {yarnEntry.recommended_hook_size && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Recommended Hook Size</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{yarnEntry.recommended_hook_size}</dd>
              </div>
            )}
            {yarnEntry.cost_per_unit !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Cost Per Unit</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  ${yarnEntry.cost_per_unit.toFixed(2)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Right column - quantity and usage */}
        <div className="space-y-6">
          {/* Quantity summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Quantity</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-md bg-purple-50 p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {yarnEntry.quantity_owned}
                </p>
                <p className="mt-1 text-xs text-purple-600">Owned</p>
              </div>
              <div className="rounded-md bg-orange-50 p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">
                  {totalUsed}
                </p>
                <p className="mt-1 text-xs text-orange-600">Total Used</p>
              </div>
            </div>
          </div>

          {/* Linked projects */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Linked Projects</h2>
            {yarnEntry.yarn_usages.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                This yarn hasn&apos;t been linked to any projects yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100" role="list">
                {yarnEntry.yarn_usages.map((usage) => (
                  <li key={usage.id} className="flex items-center justify-between py-3">
                    <Link
                      href={`/projects/${usage.project_id}`}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                      Project
                    </Link>
                    <span className="text-sm text-gray-600">
                      {usage.quantity_used} used
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Yarn Entry"
        message={`Are you sure you want to delete "${yarnEntry.name}"? This will also remove all project usage records for this yarn. This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}
