'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface YarnPhotoUploadProps {
  yarnId: string
  currentPhotoPath: string | null
  onPhotoUploaded: (path: string) => void
}

export default function YarnPhotoUpload({ yarnId, currentPhotoPath, onPhotoUploaded }: YarnPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size (5MB max for yarn photos)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()

      // Generate unique file path
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${yarnId}/${Date.now()}.${ext}`

      // Delete old photo if exists
      if (currentPhotoPath) {
        await supabase.storage.from('yarn-photos').remove([currentPhotoPath])
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('yarn-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        setError('Upload failed. Please try again.')
        setUploading(false)
        return
      }

      // Show preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Notify parent
      onPhotoUploaded(filePath)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Label Photo
      </label>
      <div className="flex items-start gap-4">
        {/* Preview */}
        {(previewUrl || currentPhotoPath) && (
          <div className="h-20 w-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Yarn label" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                Photo saved
              </div>
            )}
          </div>
        )}

        {/* Upload button */}
        <div className="flex-1">
          <label
            htmlFor={`yarn-photo-${yarnId}`}
            className={`inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors min-h-[40px] ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            </svg>
            {uploading ? 'Uploading...' : currentPhotoPath ? 'Change photo' : 'Upload label photo'}
          </label>
          <input
            id={`yarn-photo-${yarnId}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Take a photo of the yarn label for easy reference. JPEG, PNG, or WebP, max 5MB.
          </p>
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
