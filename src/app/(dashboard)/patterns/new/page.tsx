'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createPattern, type PatternActionState } from '@/lib/actions/patterns'
import { createClient } from '@/lib/supabase/client'
import { validatePatternFile, sanitizeFileName } from '@/lib/file-validation'

export default function NewPatternPage() {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const [patternType, setPatternType] = useState<'written' | 'uploaded'>('written')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [state, formAction, pending] = useActionState<PatternActionState, FormData>(
    createPattern,
    null
  )

  // On success (patternId returned), redirect to pattern detail
  useEffect(() => {
    if (hasSubmitted.current && state?.patternId && !pending) {
      router.push(`/patterns/${state.patternId}`)
    }
  }, [state, pending, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    setUploadError(null)
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setSelectedFile(null)
      return
    }

    const validation = validatePatternFile({ size: file.size, type: file.type })
    if (!validation.valid) {
      setFileError(validation.error ?? 'Invalid file')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (formData: FormData) => {
    hasSubmitted.current = true
    setUploadError(null)

    if (patternType === 'uploaded') {
      if (!selectedFile) {
        setFileError('Please select a file to upload.')
        hasSubmitted.current = false
        return
      }

      setUploading(true)

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setUploadError('You must be logged in to upload files.')
          setUploading(false)
          hasSubmitted.current = false
          return
        }

        const uuid = crypto.randomUUID()
        const sanitized = sanitizeFileName(selectedFile.name)
        const storagePath = `${user.id}/${uuid}_${sanitized}`

        const { error: storageError } = await supabase.storage
          .from('pattern-files')
          .upload(storagePath, selectedFile)

        if (storageError) {
          let message = 'Failed to upload file. Please try again.'
          if (storageError.message?.includes('too large') || storageError.message?.includes('size')) {
            message = 'File is too large. Maximum size is 20 MB.'
          } else if (storageError.message?.includes('permission') || storageError.message?.includes('policy')) {
            message = 'Permission denied. Please try logging in again.'
          } else if (storageError.message?.includes('network') || storageError.message?.includes('fetch')) {
            message = 'Network error. Please check your connection and try again.'
          }
          setUploadError(message)
          setUploading(false)
          hasSubmitted.current = false
          return
        }

        // Add file metadata to form data for the server action
        formData.set('file_path', storagePath)
        formData.set('file_name', selectedFile.name)
      } catch {
        setUploadError('An unexpected error occurred during upload. Please try again.')
        setUploading(false)
        hasSubmitted.current = false
        return
      }

      setUploading(false)
    }

    formAction(formData)
  }

  const isSubmitting = pending || uploading

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/patterns"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Patterns
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New Pattern</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new crochet pattern. Choose to write it directly or upload an existing file.
        </p>
      </div>

      <form action={handleSubmit} className="max-w-2xl space-y-6">
        {/* General error */}
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            placeholder="e.g., Cozy Blanket Pattern"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-describedby={state?.fieldErrors?.title ? 'title-error' : undefined}
          />
          {state?.fieldErrors?.title && (
            <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.title[0]}
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pattern Type <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="written"
                checked={patternType === 'written'}
                onChange={() => setPatternType('written')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Written (create in-app)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="uploaded"
                checked={patternType === 'uploaded'}
                onChange={() => setPatternType('uploaded')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Uploaded (file upload)</span>
            </label>
          </div>
          {state?.fieldErrors?.type && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.type[0]}
            </p>
          )}
        </div>

        {/* Written pattern fields */}
        {patternType === 'written' && (
          <>
            {/* Introduction */}
            <div>
              <label htmlFor="introduction" className="block text-sm font-medium text-gray-700">
                Introduction
              </label>
              <textarea
                id="introduction"
                name="introduction"
                rows={3}
                placeholder="Brief introduction to the pattern..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Materials List */}
            <div>
              <label htmlFor="materials_list" className="block text-sm font-medium text-gray-700">
                Materials List
              </label>
              <textarea
                id="materials_list"
                name="materials_list"
                rows={3}
                placeholder="List of materials needed..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Hook Size */}
            <div>
              <label htmlFor="hook_size" className="block text-sm font-medium text-gray-700">
                Hook Size
              </label>
              <input
                type="text"
                id="hook_size"
                name="hook_size"
                placeholder="e.g., 5.0mm / H-8"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {state?.fieldErrors?.hook_size && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {state.fieldErrors.hook_size[0]}
                </p>
              )}
            </div>

            {/* Yarn Info */}
            <div>
              <label htmlFor="yarn_info" className="block text-sm font-medium text-gray-700">
                Yarn Information
              </label>
              <textarea
                id="yarn_info"
                name="yarn_info"
                rows={2}
                placeholder="Yarn details (weight, brand, yardage)..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Gauge */}
            <div>
              <label htmlFor="gauge" className="block text-sm font-medium text-gray-700">
                Gauge
              </label>
              <textarea
                id="gauge"
                name="gauge"
                rows={2}
                placeholder="e.g., 14 stitches x 18 rows = 4 inches in sc"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Abbreviations */}
            <div>
              <label htmlFor="abbreviations" className="block text-sm font-medium text-gray-700">
                Abbreviations
              </label>
              <textarea
                id="abbreviations"
                name="abbreviations"
                rows={3}
                placeholder="sc = single crochet, dc = double crochet..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Instructions */}
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                Instructions
              </label>
              <textarea
                id="instructions"
                name="instructions"
                rows={10}
                placeholder="Write your pattern instructions here..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Additional notes or tips..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </>
        )}

        {/* Uploaded pattern fields — actual file upload */}
        {patternType === 'uploaded' && (
          <div className="space-y-4">
            <div className="rounded-md border border-dashed border-gray-300 p-6">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <div className="mt-4">
                  <label
                    htmlFor="pattern-file"
                    className="cursor-pointer rounded-md bg-white font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2"
                  >
                    <span>Choose a file</span>
                    <input
                      id="pattern-file"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, JPEG, or PNG up to 20 MB
                  </p>
                </div>
              </div>

              {/* Selected file display */}
              {selectedFile && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-700">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{selectedFile.name}</span>
                  <span className="text-gray-400">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              )}

              {/* File validation error */}
              {fileError && (
                <p className="mt-3 text-center text-sm text-red-600" role="alert">
                  {fileError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : pending ? 'Creating...' : 'Create Pattern'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/patterns')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
