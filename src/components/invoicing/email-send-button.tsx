'use client'

import React, { useState } from 'react'
import { sendInvoiceEmail, sendQuoteEmail } from '@/lib/actions/email-sender'
import type { EmailLogRow } from '@/types/invoicing'

interface EmailSendButtonProps {
  documentType: 'invoice' | 'quote'
  documentId: string
  customerEmail: string | null
  emailLogs: EmailLogRow[]
}

export function EmailSendButton({
  documentType,
  documentId,
  customerEmail,
  emailLogs,
}: EmailSendButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const latestLog = emailLogs.length > 0 ? emailLogs[0] : null
  const totalSendCount = latestLog?.send_count ?? 0
  const lastSentAt = latestLog?.sent_at ?? null

  const handleSend = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result =
        documentType === 'invoice'
          ? await sendInvoiceEmail(documentId)
          : await sendQuoteEmail(documentId)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error)
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (!customerEmail) {
    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>No customer email on file — <a href="/business/customers" className="underline font-medium hover:text-amber-800">add email to customer</a> to send</span>
        </div>
      </div>
    )
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={totalSendCount > 0 ? `Resend ${documentType} email` : `Send ${documentType} email`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        {loading
          ? 'Sending...'
          : totalSendCount > 0
            ? `Resend Email (${totalSendCount})`
            : 'Send Email'}
      </button>

      {lastSentAt && (
        <span className="text-xs text-gray-500">
          Last sent: {new Date(lastSentAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}

      {success && (
        <span className="text-xs text-green-600 font-medium">Email sent successfully!</span>
      )}

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
