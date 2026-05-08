import { getSubscriptionTier } from '@/lib/actions/business-gate'
import UpgradePrompt from '@/components/business/UpgradePrompt'

export default async function InvoicingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tier = await getSubscriptionTier()

  if (tier === 'pro_plus') {
    return <>{children}</>
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="h-7 w-7 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900">Upgrade to Pro+</h2>

      <p className="mt-2 text-sm text-amber-600 font-medium">
        Invoicing is a Pro+ feature
      </p>

      <p className="mt-3 text-sm text-gray-600">
        Unlock professional invoicing, quoting, payment tracking, PDF generation,
        and email delivery to manage your crochet business finances.
      </p>

      <ul className="mt-4 space-y-2 text-left text-sm text-gray-700">
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Create &amp; manage invoices with staged payments
        </li>
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Generate &amp; send professional quotes
        </li>
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Record payments &amp; track balances
        </li>
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Download PDF invoices, quotes &amp; receipts
        </li>
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Email documents directly to clients
        </li>
      </ul>

      <button
        type="button"
        className="mt-6 inline-flex items-center rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all"
      >
        Upgrade to Pro+
      </button>

      <p className="mt-3 text-xs text-gray-400">
        Coming soon — Stripe integration
      </p>
    </div>
  )
}
