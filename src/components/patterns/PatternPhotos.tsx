'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { savePatternPhoto, deletePatternPhoto, setCoverPhoto } from '@/lib/actions/pattern-photos'
import type { PatternPhoto } from '@/types/pattern-photo'

interface PatternPhotosProps {
  patternId: string
  photos: PatternPhoto[]
}

export default function PatternPhotos({ patternId, photos }: PatternPhotosProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to upload photos.')
        setUploading(false)
        return
      }

      for (const file of Array.from(files)) {
        // Validate
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError(`${file.name}: Only JPEG, PNG, and WebP images are allowed.`)
          continue
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name}: File must be less than 10 MB.`)
          continue
        }

        // Upload to storage
        const uuid = crypto.randomUUID()
        const ext = file.name.split('.').pop() ?? 'jpg'
        const storagePath = `${user.id}/patterns/${patternId}/${uuid}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('pattern-files')
          .upload(storagePath, file)

        if (uploadError) {
          setError(`Failed to upload ${file.name}. Please try again.`)
          continue
        }

        // Save record
        const { error: saveError } = await savePatternPhoto(
          patternId,
          storagePath,
          file.name,
          file.size,
          file.type
        )

        if (saveError) {
          setError(saveError)
        }
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setUploading(false)
      // Reset the input
      e.target.value = ''
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return
    setDeletingId(photoId)
    const result = await deletePatternPhoto(photoId, patternId)
    if (result?.error) {
      setError(result.error)
    }
    setDeletingId(null)
  }

  const handleSetCover = async (photoId: string) => {
    const result = await setCoverPhoto(photoId, patternId)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
        <label className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 cursor-pointer focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {uploading ? 'Uploading...' : '+ Add Photos'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-2" role="alert">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-gray-500">
          No photos yet. Add photos of the finished item, work in progress, or pattern details.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              patternId={patternId}
              onDelete={handleDelete}
              onSetCover={handleSetCover}
              isDeleting={deletingId === photo.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoCard({
  photo,
  patternId,
  onDelete,
  onSetCover,
  isDeleting,
}: {
  photo: PatternPhoto
  patternId: string
  onDelete: (id: string) => void
  onSetCover: (id: string) => void
  isDeleting: boolean
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Generate signed URL on mount
  useState(() => {
    const supabase = createClient()
    supabase.storage
      .from('pattern-files')
      .createSignedUrl(photo.file_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl)
        } else {
          setLoadError(true)
        }
      })
  })

  return (
    <div className="relative group rounded-lg border border-gray-200 overflow-hidden">
      {/* Image */}
      <div className="aspect-square bg-gray-100">
        {imageUrl && !loadError ? (
          <img
            src={imageUrl}
            alt={photo.caption || photo.file_name}
            className="h-full w-full object-cover"
            onError={() => setLoadError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Cover badge */}
      {photo.is_cover && (
        <span className="absolute top-1 left-1 inline-flex items-center rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Cover
        </span>
      )}

      {/* Actions overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center opacity-0 group-hover:opacity-100 p-2 gap-1">
        {!photo.is_cover && (
          <button
            type="button"
            onClick={() => onSetCover(photo.id)}
            className="rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-white"
          >
            Set Cover
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(photo.id)}
          disabled={isDeleting}
          className="rounded bg-red-600/90 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? '...' : 'Delete'}
        </button>
      </div>

      {/* Caption */}
      {photo.caption && (
        <p className="px-2 py-1 text-[10px] text-gray-600 truncate">{photo.caption}</p>
      )}
    </div>
  )
}
