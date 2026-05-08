'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a PDF, JPEG, or PNG file.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 10 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

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

  return (
    <div>
      <label htmlFor="invoice" className="block text-sm font-medium text-gray-700">
        Invoice Attachment
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

      <input
        ref={fileInputRef}
        type="file"
        id="invoice"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        disabled={uploading}
        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
      />

      {uploading && (
        <p className="mt-1 text-sm text-gray-500">Uploading...</p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <p className="mt-1 text-xs text-gray-400">
        PDF, JPEG, or PNG. Max 10 MB.
      </p>
    </div>
  )
}
