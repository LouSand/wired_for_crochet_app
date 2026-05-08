'use client'

import { useState, useTransition } from 'react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { deleteAccount } from '@/lib/actions/account'

export default function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDeleteClick() {
    setError(null)
    setShowConfirm(true)
  }

  function handleConfirm() {
    setShowConfirm(false)
    startTransition(async () => {
      const result = await deleteAccount()
      if (result?.error) {
        setError(result.error)
      }
      // On success, the server action redirects to /login
    })
  }

  function handleCancel() {
    setShowConfirm(false)
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
      <p className="mt-2 text-sm text-gray-600">
        Permanently delete your account and all associated data. This includes
        all projects, time sessions, counters, yarn entries, hook entries,
        patterns, photos, notes, and pricing data. This action cannot be undone.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={isPending}
        className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Deleting...' : 'Delete Account'}
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="Delete Account"
        message="Are you sure you want to delete your account? All your data will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Everything"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </section>
  )
}
