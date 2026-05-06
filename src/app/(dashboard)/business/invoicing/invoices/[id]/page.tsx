import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoice, deleteInvoice } from '@/lib/actions/invoices'
import { getBusinessProfile } from '@/lib/actions/business-profile'
import { getSettings } from '@/lib/actions/settings'
import InvoiceDetail from '@/components/invoicing/invoice-detail'
import { PdfDownloadButton } from '@/components/invoicing/pdf-download-button'
import { EmailSendButton } from '@/components/invoicing/email-send-button'
import PaymentForm from '@/components/invoicing/payment-form'
import PaymentHistory from '@/components/invoicing/payment-history'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ data: invoice, error }, { data: profile }, settings] = await Promise.all([
    getInvoice(id),
    getBusinessProfile(),
    getSettings(),
  ])

  if (error || !invoice) {
    notFound()
  }

  const currency = settings?.default_currency ?? 'GBP'

  async function handleDelete() {
    'use server'
    const result = await deleteInvoice(id)
    if (result.success) {
      redirect('/business/invoicing/invoices')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/invoicing/invoices"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Invoices
        </Link>
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <PdfDownloadButton
          type="invoice"
          invoice={invoice}
          profile={profile}
          currency={currency}
        />
        <EmailSendButton
          documentType="invoice"
          documentId={invoice.id}
          customerEmail={invoice.customer?.email ?? null}
          emailLogs={invoice.email_logs}
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

      <InvoiceDetail invoice={invoice} />

      {/* Payment recording section */}
      {invoice.status !== 'paid' && invoice.status !== 'draft' && (
        <div className="mt-6">
          <PaymentForm invoiceId={invoice.id} balance={invoice.total - invoice.amount_paid} />
        </div>
      )}

      {/* Payment history with delete */}
      {invoice.payments.length > 0 && (
        <div className="mt-6">
          <PaymentHistory payments={invoice.payments} invoiceId={invoice.id} />
        </div>
      )}

      {/* Server-side delete action */}
      {invoice.status === 'draft' && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <form action={handleDelete}>
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete Invoice
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
