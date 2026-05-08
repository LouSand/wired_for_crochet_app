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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [state, formAction, pending] = useActionState<PatternActionState, FormData>(
    createPattern,
    null
  )

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

    // Determine type based on whether a file is attached
    const hasFile = !!selectedFile
    formData.set('type', hasFile ? 'uploaded' : 'written')

    // Upload file if selected
    if (selectedFile) {
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
          setUploadError('Failed to upload file. Please try again.')
          setUploading(false)
          hasSubmitted.current = false
          return
        }

        formData.set('file_path', storagePath)
        formData.set('file_name', selectedFile.name)
      } catch {
        setUploadError('An unexpected error occurred during upload.')
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
        <Link href="/patterns" className="text-sm text-purple-600 hover:text-purple-700">
          ← Back to Patterns
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New Pattern</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new pattern. You can write details, upload a file, or both.
        </p>
      </div>

      <form action={handleSubmit} className="max-w-2xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}
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
          <input type="text" id="title" name="title" required placeholder="e.g., Cozy Blanket Pattern"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          {state?.fieldErrors?.title && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        {/* File Upload (optional) */}
        <div className="rounded-md border border-dashed border-gray-300 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Attach a File (optional)</h3>
          <p className="text-xs text-gray-500 mb-3">Upload a PDF or image of your pattern. You can still add written details below.</p>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-green-600">✓ {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
          )}
          {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
        </div>

        {/* Introduction */}
        <div>
          <label htmlFor="introduction" className="block text-sm font-medium text-gray-700">Introduction</label>
          <textarea id="introduction" name="introduction" rows={3} placeholder="Brief introduction to the pattern..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        {/* Materials List */}
        <div>
          <label htmlFor="materials_list" className="block text-sm font-medium text-gray-700">Materials List</label>
          <textarea id="materials_list" name="materials_list" rows={3} placeholder="List of materials needed..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        {/* Hook Size */}
        <div>
          <label htmlFor="hook_size" className="block text-sm font-medium text-gray-700">Hook Size</label>
          <input type="text" id="hook_size" name="hook_size" placeholder="e.g., 5.0mm / H-8"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        {/* Yarn Info */}
        <div>
          <label htmlFor="yarn_info" className="block text-sm font-medium text-gray-700">Yarn Information</label>
          <textarea id="yarn_info" name="yarn_info" rows={2} placeholder="Yarn details (weight, brand, yardage)..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        {/* Gauge */}
        <div>
          <label htmlFor="gauge" className="block text-sm font-medium text-gray-700">Gauge</label>
          <textarea id="gauge" name="gauge" rows={2} placeholder="e.g., 14 stitches x 18 rows = 4 inches in sc"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        {/* Abbreviations */}
        <div>
          <label htmlFor="abbreviations" className="block text-sm font-medium text-gray-700">Abbreviations</label>
          <textarea id="abbreviations" name="abbreviations" rows={3} placeholder="sc = single crochet, dc = double crochet..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Instructions</label>
          <textarea id="instructions" name="instructions" rows={10} placeholder="Write your pattern instructions here..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono" />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea id="notes" name="notes" rows={3} placeholder="Additional notes or tips..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isSubmitting}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {uploading ? 'Uploading...' : pending ? 'Creating...' : 'Create Pattern'}
          </button>
          <button type="button" onClick={() => router.push('/patterns')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
