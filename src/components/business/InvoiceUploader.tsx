'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

interface InvoiceUploaderProps {
  onUploadComplete: (path: string, filename: string) => void
  existingInvoicePath?: string | null
  existingInvoiceFileName?: string | null
}

export default function InvoiceUploader({
  onUploadComplete,
  existingInvoicePath,
  existingInvoiceFileName,
}: InvoiceUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    existingInvoiceFileName ?? null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    setError(null)

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a PDF, JPEG, PNG, or WebP file.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 10 MB.')
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to upload files.')
        setUploading(false)
        return
      }

      const uuid = crypto.randomUUID()
      const filePath = `invoices/${user.id}/${uuid}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file)

      if (uploadError) {
        setError('Failed to upload file. Please try again.')
        setUploading(false)
        return
      }

      setUploadedFileName(file.name)
      onUploadComplete(filePath, file.name)
    } catch {
      setError('An unexpected error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Receipt / Invoice Photo
      </label>

      {uploadedFileName && (
        <p className="mt-1 text-sm text-green-600">
          ✓ {uploadedFileName}
        </p>
      )}

      {existingInvoicePath && !uploadedFileName && (
        <p className="mt-1 text-sm text-gray-500">
          Current: {existingInvoiceFileName || 'Invoice attached'}
        </p>
      )}

      {/* Upload options — camera + file picker */}
      <div className="mt-2 flex flex-wrap gap-2">
        {/* Camera capture — shows on mobile */}
        <label
          className="inline-flex items-center gap-2 rounded-md border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 cursor-pointer transition-colors min-h-[44px]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          </svg>
          Take Photo
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {/* File picker */}
        <label
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]"
        >
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Choose File
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {uploading && (
        <p className="mt-2 text-sm text-gray-500">Uploading...</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <p className="mt-2 text-xs text-gray-400">
        Take a photo of a paper receipt/invoice, or upload a PDF/image. Max 10 MB.
      </p>
    </div>
  )
}
