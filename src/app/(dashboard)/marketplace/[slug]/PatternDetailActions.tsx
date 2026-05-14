'use client'

import { useState } from 'react'
import Link from 'next/link'
import { acquireFreePattern, reportPattern } from '@/lib/actions/marketplace'

interface PatternDetailActionsProps {
  patternId: string
  isFree: boolean
  price: number | null
  currency: string
  sellerName: string
  sellerSlug: string
}

export default function PatternDetailActions({
  patternId,
  isFree,
  price,
  currency,
  sellerName,
  sellerSlug,
}: PatternDetailActionsProps) {
  const [acquiring, setAcquiring] = useState(false)
  const [acquired, setAcquired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('copyright')
  const [reportDetails, setReportDetails] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)

  const handleAcquire = async () => {
    setAcquiring(true)
    setError(null)
    const { error: err } = await acquireFreePattern(patternId)
    if (err) setError(err)
    else setAcquired(true)
    setAcquiring(false)
  }

  const handleReport = async () => {
    setReporting(true)
    await reportPattern(patternId, reportReason, reportDetails || null)
    setReported(true)
    setReporting(false)
  }

  return (
    <div className="space-y-4">
      {/* Price & acquire */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">
            {isFree ? 'Free' : `£${price?.toFixed(2)}`}
          </p>
          {!isFree && (
            <p className="text-xs text-gray-500 mt-1">{currency}</p>
          )}
        </div>

        {acquired ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
            <p className="text-sm font-medium text-green-700">✓ Added to your library!</p>
            <Link href="/patterns" className="mt-1 text-xs text-green-600 hover:underline">
              View library →
            </Link>
          </div>
        ) : isFree ? (
          <button
            type="button"
            onClick={handleAcquire}
            disabled={acquiring}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors min-h-[48px]"
          >
            {acquiring ? 'Adding...' : 'Get Free Pattern'}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-bold text-white opacity-75 cursor-not-allowed min-h-[48px]"
            title="Paid purchases coming soon — Stripe integration required"
          >
            Buy Pattern (Coming Soon)
          </button>
        )}

        {error && <p className="text-xs text-red-600 text-center">{error}</p>}

        {!isFree && (
          <p className="text-[10px] text-gray-400 text-center">
            Paid pattern purchases require Stripe setup. Coming soon.
          </p>
        )}
      </div>

      {/* Seller info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Seller</p>
        <Link
          href={`/marketplace/sellers/${sellerSlug}`}
          className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">
            {sellerName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">{sellerName}</span>
        </Link>
      </div>

      {/* Report */}
      <div className="text-center">
        {reported ? (
          <p className="text-xs text-gray-500">Thank you for your report. We&apos;ll review it.</p>
        ) : showReport ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-left space-y-3">
            <p className="text-sm font-medium text-gray-900">Report this pattern</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="copyright">Copyright infringement</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam</option>
              <option value="misleading">Misleading description</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details (optional)..."
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReport}
                disabled={reporting}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Report this pattern
          </button>
        )}
      </div>
    </div>
  )
}
