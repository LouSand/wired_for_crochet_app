'use client'

import { useState } from 'react'
import { deletePhoto, updatePhotoCaption, markPhotoAsFinal } from '@/lib/actions/photos'
import type { PhotoWithUrl } from '@/lib/actions/photos'

interface PhotoGridProps {
  photos: PhotoWithUrl[]
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">
          No photos yet. Upload one above to start documenting your progress.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  )
}

function PhotoCard({ photo }: { photo: PhotoWithUrl }) {
  const [isEditing, setIsEditing] = useState(false)
  const [caption, setCaption] = useState(photo.caption ?? '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveCaption = async () => {
    setIsSaving(true)
    setError(null)
    const result = await updatePhotoCaption(photo.id, caption)
    if (result?.error) {
      setError(result.error)
    } else {
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const result = await deletePhoto(photo.id)
    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleToggleFinal = async () => {
    setError(null)
    const result = await markPhotoAsFinal(photo.id, !photo.is_final)
    if (result?.error) {
      setError(result.error)
    }
  }

  const formattedDate = new Date(photo.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {photo.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={photo.caption || photo.file_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-gray-400">Unable to load image</p>
          </div>
        )}

        {/* Final badge */}
        {photo.is_final && (
          <span className="absolute top-2 left-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
            Final
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* Caption */}
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Add a caption..."
              disabled={isSaving}
              aria-label="Photo caption"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveCaption}
                disabled={isSaving}
                className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setCaption(photo.caption ?? '')
                }}
                disabled={isSaving}
                className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full text-left text-sm text-gray-700 hover:text-blue-600"
          >
            {photo.caption || (
              <span className="italic text-gray-400">Add caption...</span>
            )}
          </button>
        )}

        {/* Date */}
        <p className="text-xs text-gray-400">{formattedDate}</p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleToggleFinal}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              photo.is_final
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={photo.is_final ? 'Unmark as final' : 'Mark as final'}
          >
            {photo.is_final ? '★ Final' : '☆ Mark final'}
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
