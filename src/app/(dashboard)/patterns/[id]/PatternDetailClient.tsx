'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { updatePattern, deletePattern, type PatternActionState } from '@/lib/actions/patterns'
import type { Pattern, PatternVersion } from '@/types/database'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'

/**
 * Button that generates a signed URL and opens/downloads the pattern file.
 */
function ViewPatternFileButton({ filePath, fileName }: { filePath: string; fileName: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleView = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: urlError } = await supabase.storage
        .from('pattern-files')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (urlError || !data?.signedUrl) {
        setError('Failed to generate download link. The file may not exist in storage.')
        return
      }

      // Open in new tab
      window.open(data.signedUrl, '_blank')
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleView}
        disabled={loading}
        className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Loading...' : 'View / Download File'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

interface PatternDetailClientProps {
  pattern: Pattern & { pattern_versions: PatternVersion[] }
}

export default function PatternDetailClient({ pattern }: PatternDetailClientProps) {
  const router = useRouter()
  const hasSubmitted = useRef(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showVersions, setShowVersions] = useState(false)

  const updatePatternWithId = updatePattern.bind(null, pattern.id)
  const [state, formAction, pending] = useActionState<PatternActionState, FormData>(
    updatePatternWithId,
    null
  )

  // On success (null return after submission), show success feedback
  useEffect(() => {
    if (hasSubmitted.current && state === null && !pending) {
      hasSubmitted.current = false
    }
  }, [state, pending])

  const handleSubmit = (formData: FormData) => {
    hasSubmitted.current = true
    formAction(formData)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deletePattern(pattern.id)
    if (result?.error) {
      setDeleting(false)
      setShowDeleteDialog(false)
    } else {
      router.push('/patterns')
    }
  }

  const sortedVersions = [...pattern.pattern_versions].sort(
    (a, b) => b.version_number - a.version_number
  )

  if (pattern.type === 'uploaded') {
    return (
      <div>
        <div className="mb-6">
          <Link href="/patterns" className="text-sm text-purple-600 hover:text-purple-700">
            ← Back to Patterns
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{pattern.title}</h1>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 mt-1">
            Uploaded
          </span>
        </div>

        {/* File section */}
        <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Attached File</h2>
          {pattern.file_name && pattern.file_path ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">{pattern.file_name}</p>
                  <p className="text-xs text-gray-500">Uploaded pattern file</p>
                </div>
              </div>
              <ViewPatternFileButton filePath={pattern.file_path} fileName={pattern.file_name} />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No file uploaded yet.</p>
          )}
        </div>

        {/* Editable pattern details — same as written patterns */}
        <form action={handleSubmit} className="max-w-2xl space-y-6">
          {state?.error && (
            <div className="rounded-md bg-red-50 p-4" role="alert">
              <p className="text-sm text-red-700">{state.error}</p>
            </div>
          )}

          <input type="hidden" name="type" value="uploaded" />

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input type="text" id="title" name="title" required defaultValue={pattern.title}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>

          {/* Introduction */}
          <div>
            <label htmlFor="introduction" className="block text-sm font-medium text-gray-700">Introduction</label>
            <textarea id="introduction" name="introduction" rows={3} defaultValue={pattern.introduction ?? ''} placeholder="Brief introduction to the pattern..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>

          {/* Materials List */}
          <div>
            <label htmlFor="materials_list" className="block text-sm font-medium text-gray-700">Materials List</label>
            <textarea id="materials_list" name="materials_list" rows={3} defaultValue={pattern.materials_list ?? ''} placeholder="List of materials needed..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>

          {/* Hook Size */}
          <div>
            <label htmlFor="hook_size" className="block text-sm font-medium text-gray-700">Hook Size</label>
            <input type="text" id="hook_size" name="hook_size" defaultValue={pattern.hook_size ?? ''} placeholder="e.g., 5.0mm / H-8"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>

          {/* Yarn Info */}
          <div>
            <label htmlFor="yarn_info" className="block text-sm font-medium text-gray-700">Yarn Information</label>
            <textarea id="yarn_info" name="yarn_info" rows={2} defaultValue={pattern.yarn_info ?? ''} placeholder="Yarn details..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>

          {/* Gauge */}
          <div>
            <label htmlFor="gauge" className="block text-sm font-medium text-gray-700">Gauge</label>
            <textarea id="gauge" name="gauge" rows={2} defaultValue={pattern.gauge ?? ''} placeholder="e.g., 14 stitches x 18 rows = 4 inches"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>

          {/* Abbreviations */}
          <div>
            <label htmlFor="abbreviations" className="block text-sm font-medium text-gray-700">Abbreviations</label>
            <textarea id="abbreviations" name="abbreviations" rows={3} defaultValue={pattern.abbreviations ?? ''} placeholder="sc = single crochet, dc = double crochet..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Instructions / Notes</label>
            <textarea id="instructions" name="instructions" rows={8} defaultValue={pattern.instructions ?? ''} placeholder="Add your own notes, modifications, or instructions..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono" />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea id="notes" name="notes" rows={3} defaultValue={pattern.notes ?? ''} placeholder="Additional notes or tips..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={pending}
              className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {pending ? 'Saving...' : 'Save Pattern'}
            </button>
            <PublishButton patternId={pattern.id} isPublished={pattern.is_published} />
            <button type="button" onClick={() => setShowDeleteDialog(true)}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              Delete
            </button>
          </div>
        </form>

        <ConfirmDialog
          open={showDeleteDialog}
          title="Delete Pattern"
          message="Are you sure you want to delete this pattern? This action cannot be undone."
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </div>
    )
  }

  // Written pattern — editable form
  return (
    <div>
      <div className="mb-6">
        <Link href="/patterns" className="text-sm text-purple-600 hover:text-purple-700">
          ← Back to Patterns
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pattern.title}</h1>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mt-1">
              Written
            </span>
          </div>
          <a
            href={`/api/pdf/${pattern.id}`}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </a>
        </div>
      </div>

      <form action={handleSubmit} className="max-w-2xl space-y-6">
        {/* General error */}
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        {/* Success message */}
        {hasSubmitted.current === false && state === null && (
          <div className="rounded-md bg-green-50 p-4 hidden" role="status">
            <p className="text-sm text-green-700">Pattern saved successfully.</p>
          </div>
        )}

        {/* Hidden type field */}
        <input type="hidden" name="type" value="written" />

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
            defaultValue={pattern.title}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-describedby={state?.fieldErrors?.title ? 'title-error' : undefined}
          />
          {state?.fieldErrors?.title && (
            <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
              {state.fieldErrors.title[0]}
            </p>
          )}
        </div>

        {/* Introduction */}
        <div>
          <label htmlFor="introduction" className="block text-sm font-medium text-gray-700">
            Introduction
          </label>
          <textarea
            id="introduction"
            name="introduction"
            rows={3}
            defaultValue={pattern.introduction ?? ''}
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
            defaultValue={pattern.materials_list ?? ''}
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
            defaultValue={pattern.hook_size ?? ''}
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
            defaultValue={pattern.yarn_info ?? ''}
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
            defaultValue={pattern.gauge ?? ''}
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
            defaultValue={pattern.abbreviations ?? ''}
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
            rows={12}
            defaultValue={pattern.instructions ?? ''}
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
            defaultValue={pattern.notes ?? ''}
            placeholder="Additional notes or tips..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Saving...' : 'Save Pattern'}
          </button>
          <PublishButton patternId={pattern.id} isPublished={pattern.is_published} />
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </form>

      {/* Version History */}
      {sortedVersions.length > 0 && (
        <div className="mt-8 max-w-2xl">
          <button
            type="button"
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showVersions ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Version History ({sortedVersions.length} version{sortedVersions.length !== 1 ? 's' : ''})
          </button>

          {showVersions && (
            <div className="mt-4 space-y-4">
              {sortedVersions.map((version) => (
                <div
                  key={version.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Version {version.version_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(version.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-gray-600 font-mono">
                    {version.instructions}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Pattern"
        message="Are you sure you want to delete this pattern? This will also remove all version history. This action cannot be undone."
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}

// ─── Publish to Marketplace Button ───────────────────────────────────────────

function PublishButton({ patternId, isPublished }: { patternId: string; isPublished: boolean }) {
  const [showForm, setShowForm] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(isPublished)
  const [error, setError] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [previewDesc, setPreviewDesc] = useState('')
  const [tags, setTags] = useState('')

  const handlePublish = async () => {
    setPublishing(true)
    setError(null)

    const priceVal = price ? parseFloat(price) : null
    const tagsList = tags.split(',').map((t) => t.trim()).filter(Boolean)

    const { publishPattern } = await import('@/lib/actions/marketplace')
    const { error: err } = await publishPattern(patternId, {
      price: priceVal,
      previewDescription: previewDesc,
      tags: tagsList,
    })

    if (err) {
      setError(err)
    } else {
      setPublished(true)
      setShowForm(false)
    }
    setPublishing(false)
  }

  const handleUnpublish = async () => {
    setPublishing(true)
    const { unpublishPattern } = await import('@/lib/actions/marketplace')
    await unpublishPattern(patternId)
    setPublished(false)
    setPublishing(false)
  }

  if (published) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          ✓ Published
        </span>
        <button
          type="button"
          onClick={handleUnpublish}
          disabled={publishing}
          className="text-xs text-gray-500 hover:text-red-600 underline"
        >
          Unpublish
        </button>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Publish to Marketplace</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (£) — leave blank for free</label>
            <input type="number" step="0.01" min="0" placeholder="0.00 = Free" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Preview Description</label>
            <textarea rows={3} placeholder="What buyers will see before purchasing..." value={previewDesc} onChange={(e) => setPreviewDesc(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input type="text" placeholder="amigurumi, beginner, toy" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handlePublish} disabled={publishing} className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 min-h-[40px]">
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 min-h-[40px]">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="rounded-md border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 shadow-sm hover:bg-green-50"
    >
      Publish to Marketplace
    </button>
  )
}
