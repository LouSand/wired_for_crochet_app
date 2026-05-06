import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getQuote, deleteQuote } from '@/lib/actions/quotes'
import { getBusinessProfile } from '@/lib/actions/business-profile'
import { getSettings } from '@/lib/actions/settings'
import QuoteDetail from '@/components/invoicing/quote-detail'
import { PdfDownloadButton } from '@/components/invoicing/pdf-download-button'
import { EmailSendButton } from '@/components/invoicing/email-send-button'

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ data: quote, error }, { data: profile }, settings] = await Promise.all([
    getQuote(id),
    getBusinessProfile(),
    getSettings(),
  ])

  if (error || !quote) {
    notFound()
  }

  const currency = settings?.default_currency ?? 'GBP'

  async function handleDelete() {
    'use server'
    const result = await deleteQuote(id)
    if (result.success) {
      redirect('/business/invoicing/quotes')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/invoicing/quotes"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Quotes
        </Link>
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <PdfDownloadButton
          type="quote"
          quote={quote}
          profile={profile}
          currency={currency}
        />
        <EmailSendButton
          documentType="quote"
          documentId={quote.id}
          customerEmail={quote.customer?.email ?? null}
          emailLogs={quote.email_logs}
        />
        {!profile && (
          <Link
            href="/business/invoicing/settings"
            className="text-xs text-amber-600 hover:text-amber-700"
          >
            ⚠ Set up your business profile for branded PDFs
          </Link>
        )}
      </div>

      <QuoteDetail quote={quote} />

      {/* Server-side delete action */}
      {quote.status === 'draft' && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <form action={handleDelete}>
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete Quote
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
