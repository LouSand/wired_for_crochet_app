'use client'

import React, { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/lib/pdf/invoice-document'
import { QuoteDocument } from '@/lib/pdf/quote-document'
import { ReceiptDocument } from '@/lib/pdf/receipt-document'
import type {
  InvoiceWithDetails,
  QuoteWithDetails,
  BusinessProfile,
  PaymentRow,
} from '@/types/invoicing'

interface InvoicePdfProps {
  type: 'invoice'
  invoice: InvoiceWithDetails
  profile: BusinessProfile | null
  currency: string
}

interface QuotePdfProps {
  type: 'quote'
  quote: QuoteWithDetails
  profile: BusinessProfile | null
  currency: string
}

interface ReceiptPdfProps {
  type: 'receipt'
  invoice: InvoiceWithDetails
  payment: PaymentRow
  profile: BusinessProfile | null
  currency: string
}

type PdfDownloadButtonProps = InvoicePdfProps | QuotePdfProps | ReceiptPdfProps

export function PdfDownloadButton(props: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      let blob: Blob
      let filename: string

      if (props.type === 'invoice') {
        const doc = (
          <InvoiceDocument
            invoice={props.invoice}
            profile={props.profile}
            currency={props.currency}
          />
        )
        blob = await pdf(doc).toBlob()
        filename = `${props.invoice.invoice_number}.pdf`
      } else if (props.type === 'quote') {
        const doc = (
          <QuoteDocument
            quote={props.quote}
            profile={props.profile}
            currency={props.currency}
          />
        )
        blob = await pdf(doc).toBlob()
        filename = `${props.quote.quote_number}.pdf`
      } else {
        const doc = (
          <ReceiptDocument
            invoice={props.invoice}
            payment={props.payment}
            profile={props.profile}
            currency={props.currency}
          />
        )
        blob = await pdf(doc).toBlob()
        filename = `${props.invoice.invoice_number}-receipt-${props.payment.payment_date}.pdf`
      }

      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getLabel = () => {
    if (loading) return 'Generating...'
    switch (props.type) {
      case 'invoice':
        return 'Download Invoice PDF'
      case 'quote':
        return 'Download Quote PDF'
      case 'receipt':
        return 'Download Receipt'
    }
  }

  const getIcon = () => (
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
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label={getLabel()}
    >
      {getIcon()}
      {getLabel()}
    </button>
  )
}
