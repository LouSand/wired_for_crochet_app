'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validatePatternFile } from '@/lib/file-validation'
import { computeBatchSummary } from '@/lib/batch-summary'
import { bulkUploadPatterns } from '@/lib/actions/patterns'

type FileStatus = 'pending' | 'uploading' | 'success' | 'error'

interface FileItem {
  file: File
  status: FileStatus
  error?: string
}

export default function BulkPatternUploader() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<{ total: number; successes: number; failures: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const items: FileItem[] = []
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const validation = validatePatternFile({ size: file.size, type: file.type })
      if (!validation.valid) {
        items.push({ file, status: 'error', error: validation.error })
      } else {
        items.push({ file, status: 'pending' })
      }
    }

    setFiles(items)
    setSummary(null)
  }

  async function handleUpload() {
    const validFiles = files.filter((f) => f.status === 'pending')
    if (validFiles.length === 0) return

    setUploading(true)
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'pending'
            ? { ...f, status: 'error' as FileStatus, error: 'Not authenticated' }
            : f
        )
      )
      setUploading(false)
      return
    }

    // Upload files in parallel
    const uploadResults = await Promise.allSettled(
      validFiles.map(async (item) => {
        // Mark as uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.file === item.file ? { ...f, status: 'uploading' as FileStatus } : f
          )
        )

        const uuid = crypto.randomUUID()
        const filePath = `${user.id}/${uuid}_${item.file.name}`

        const { error: uploadError } = await supabase.storage
          .from('pattern-files')
          .upload(filePath, item.file)

        if (uploadError) {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === item.file
                ? { ...f, status: 'error' as FileStatus, error: uploadError.message }
                : f
            )
          )
          return { success: false, file: item.file }
        }

        // Mark as success in UI
        setFiles((prev) =>
          prev.map((f) =>
            f.file === item.file ? { ...f, status: 'success' as FileStatus } : f
          )
        )

        return {
          success: true,
          file: item.file,
          metadata: {
            name: item.file.name,
            path: filePath,
            size: item.file.size,
            mimeType: item.file.type,
          },
        }
      })
    )

    // Collect successful uploads for pattern record creation
    const successfulUploads = uploadResults
      .filter(
        (r): r is PromiseFulfilledResult<{ success: true; file: File; metadata: { name: string; path: string; size: number; mimeType: string } }> =>
          r.status === 'fulfilled' && r.value.success === true
      )
      .map((r) => r.value.metadata)

    // Create pattern records for successful uploads
    if (successfulUploads.length > 0) {
      const { results: patternResults } = await bulkUploadPatterns(successfulUploads)

      // Update file statuses based on pattern creation results
      setFiles((prev) =>
        prev.map((f) => {
          const patternResult = patternResults.find((pr) => pr.fileName === f.file.name)
          if (patternResult && !patternResult.success) {
            return { ...f, status: 'error' as FileStatus, error: patternResult.error }
          }
          return f
        })
      )
    }

    // Compute batch summary
    setFiles((prev) => {
      const finalResults = prev.map((f) => ({ success: f.status === 'success' }))
      setSummary(computeBatchSummary(finalResults))
      return prev
    })

    setUploading(false)
  }

  function handleReset() {
    setFiles([])
    setSummary(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900">Bulk Upload Patterns</h3>
      <p className="mt-1 text-xs text-gray-500">
        Upload multiple pattern files at once. Accepts PDF, JPEG, and PNG (max 20MB each).
      </p>

      {/* File picker */}
      <div className="mt-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
        />
      </div>

      {/* File list with status */}
      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-200">
          {files.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-gray-700 truncate max-w-[200px] sm:max-w-[300px]">
                {item.file.name}
              </span>
              <span className="ml-2 flex-shrink-0">
                {item.status === 'pending' && (
                  <span className="text-xs text-gray-400">Ready</span>
                )}
                {item.status === 'uploading' && (
                  <span className="text-xs text-blue-600">Uploading...</span>
                )}
                {item.status === 'success' && (
                  <span className="text-xs font-medium text-green-600">✓ Done</span>
                )}
                {item.status === 'error' && (
                  <span className="text-xs font-medium text-red-600" title={item.error}>
                    ✗ {item.error || 'Failed'}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Batch summary */}
      {summary && (
        <div className="mt-4 rounded-md bg-gray-50 p-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Upload complete:</span>{' '}
            {summary.successes} succeeded, {summary.failures} failed out of {summary.total} files.
          </p>
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="mt-4 flex gap-3">
          {!summary && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || files.filter((f) => f.status === 'pending').length === 0}
              className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : `Upload ${files.filter((f) => f.status === 'pending').length} Files`}
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            disabled={uploading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {summary ? 'Upload More' : 'Clear'}
          </button>
        </div>
      )}
    </div>
  )
}
