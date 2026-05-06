interface UpgradePromptProps {
  featureName?: string
}

export default function UpgradePrompt({ featureName }: UpgradePromptProps) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
        <svg
          className="h-7 w-7 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900">Upgrade to Pro</h2>

      {featureName && (
        <p className="mt-2 text-sm text-purple-600 font-medium">
          {featureName} is a Pro feature
        </p>
      )}

      <p className="mt-3 text-sm text-gray-600">
        Unlock the full Business Suite including supplier management, expense
        tracking, product catalog, bill of materials costing, customer database,
        sales recording, and a business dashboard.
      </p>

      <ul className="mt-4 space-y-2 text-left text-sm text-gray-700">
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-purple-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Supplier &amp; customer management
        </li>
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-purple-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Expense &amp; sales tracking
        </li>
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-purple-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Product catalog with BOM costing
        </li>
        <li className="flex items-center gap-2">
          <svg className="h-4 w-4 text-purple-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Business dashboard &amp; analytics
        </li>
      </ul>

      <button
        type="button"
        className="mt-6 inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
      >
        Upgrade to Pro
      </button>

      <p className="mt-3 text-xs text-gray-400">
        Coming soon — Stripe integration
      </p>
    </div>
  )
}
