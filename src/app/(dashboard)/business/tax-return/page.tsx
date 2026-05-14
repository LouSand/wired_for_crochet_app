'use client'

import { useState } from 'react'
import Link from 'next/link'
import { generateTaxSummary, type SA103Summary } from '@/lib/actions/tax-summary'

export default function TaxReturnPage() {
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<SA103Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await generateTaxSummary(taxYear)
    if (err) setError(err)
    else setSummary(data)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/business" className="text-sm text-purple-600 hover:text-purple-700">
          ← Back to Business
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Self Assessment Tax Return Helper</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate your SA103 (Self-Employment) figures from your invoices and expenses.
          Shows exactly which numbers go in which boxes on your tax return.
        </p>
      </div>

      {/* Tax year selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="tax-year" className="block text-sm font-medium text-gray-700">
              Tax Year Ending 5 April
            </label>
            <select
              id="tax-year"
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value))}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value={2027}>2026/27 (6 Apr 2026 – 5 Apr 2027)</option>
              <option value={2026}>2025/26 (6 Apr 2025 – 5 Apr 2026)</option>
              <option value={2025}>2024/25 (6 Apr 2024 – 5 Apr 2025)</option>
              <option value={2024}>2023/24 (6 Apr 2023 – 5 Apr 2024)</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-md bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[40px]"
          >
            {loading ? 'Calculating...' : 'Generate SA103 Summary'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* SA103 Summary */}
      {summary && (
        <div className="space-y-6">
          {/* Actions bar */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/tax-report/${taxYear}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 min-h-[40px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download SA103 PDF
            </a>
            <Link
              href="/business/expenses"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[40px]"
            >
              View All Receipts &amp; Evidence
            </Link>
          </div>

          {/* Header info */}
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
            <h2 className="text-lg font-bold text-purple-900">
              SA103 Self-Employment — Tax Year {summary.taxYear}
            </h2>
            <p className="mt-1 text-sm text-purple-700">
              Accounting period: {formatDate(summary.accountingPeriodStart)} to {formatDate(summary.accountingPeriodEnd)}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-purple-600">Business name:</span>{' '}
                <span className="font-medium text-purple-900">{summary.businessName}</span>
              </div>
              <div>
                <span className="text-purple-600">Description:</span>{' '}
                <span className="font-medium text-purple-900">{summary.businessDescription}</span>
              </div>
            </div>
          </div>

          {/* Income section */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Income</h3>
            <SA103Box
              boxNumber={9}
              label="Turnover — the income due to your business"
              amount={summary.box9_turnover}
              breakdown={summary.turnoverBreakdown}
            />
            <SA103Box
              boxNumber={10}
              label="Any other business income not included in box 9"
              amount={summary.box10_otherIncome}
            />
          </div>

          {/* Expenses section */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Allowable Business Expenses</h3>
            <SA103Box boxNumber={11} label="Cost of goods bought for resale or goods used" amount={summary.box11_costOfGoods} />
            <SA103Box boxNumber={12} label="Car, van and travel expenses" amount={summary.box12_carVanTravel} />
            <SA103Box boxNumber={13} label="Wages, salaries and other staff costs" amount={summary.box13_wages} />
            <SA103Box boxNumber={14} label="Rent, rates, power and insurance costs" amount={summary.box14_rent} />
            <SA103Box boxNumber={15} label="Repairs and maintenance of property and equipment" amount={summary.box15_repairs} />
            <SA103Box boxNumber={16} label="Accountancy, legal and other professional fees" amount={summary.box16_finance} />
            <SA103Box boxNumber={17} label="Interest on bank and other loans and finance charges" amount={summary.box17_interest} />
            <SA103Box boxNumber={18} label="Phone, fax, stationery and other office costs" amount={summary.box18_phone} />
            <SA103Box boxNumber={19} label="Other allowable business expenses" amount={summary.box19_other} />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <SA103Box boxNumber={20} label="Total allowable expenses (sum of boxes 11-19)" amount={summary.box20_totalExpenses} highlight />
            </div>
          </div>

          {/* Net profit */}
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
            <SA103Box
              boxNumber={21}
              label="Net profit (box 9 + box 10 minus box 20)"
              amount={summary.box21_netProfit}
              highlight
            />
            {summary.box21_netProfit < 0 && (
              <p className="mt-2 text-sm text-red-700">
                This is a loss. Enter this figure in Box 22 instead (Net business loss).
              </p>
            )}
          </div>

          {/* Additional SA103 boxes (not auto-calculated) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Other SA103 Boxes (Manual Entry)</h3>
            <p className="text-xs text-gray-500 mb-4">
              These boxes require information not tracked in the app. Enter them manually on your return if applicable.
            </p>
            <div className="space-y-3 text-sm">
              <ManualBox boxNumber={22} label="If your business made a net loss, enter it here" />
              <ManualBox boxNumber={23} label="Annual Investment Allowance" />
              <ManualBox boxNumber={24} label="Allowance for small balance of unrelieved expenditure" />
              <ManualBox boxNumber={25} label="Other capital allowances" />
              <ManualBox boxNumber={26} label="Total balancing charges (where you sold items for more than their tax value)" />
              <ManualBox boxNumber={27} label="Goods or services for your own use (value of items taken from business for personal use)" />
              <ManualBox boxNumber={28} label="Net business profit for tax purposes (box 21 minus boxes 23-25 plus box 26 plus box 27)" />
              <ManualBox boxNumber={29} label="Tax adjustments — if your basis period is not the same as your accounting period" />
              <ManualBox boxNumber={30} label="Overlap profit brought forward" />
              <ManualBox boxNumber={31} label="Overlap profit carried forward" />
              <ManualBox boxNumber={32} label="Adjusted profit for the year (box 28 + box 29 minus box 30)" />
              <ManualBox boxNumber={33} label="Loss brought forward from earlier years" />
              <ManualBox boxNumber={34} label="Taxable profit after losses (box 32 minus box 33)" />
              <ManualBox boxNumber={35} label="Class 4 NICs — tick if exception applies" />
              <ManualBox boxNumber={36} label="Tick if you wish to make voluntary Class 2 NICs" />
            </div>
          </div>

          {/* Expense detail breakdown */}
          {summary.expensesByCategory.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Expense Detail Breakdown</h3>
              <p className="text-xs text-gray-500 mb-4">
                Keep this as evidence for your records. HMRC may ask for details.
              </p>
              {summary.expensesByCategory.map((cat) => (
                <details key={cat.boxNumber} className="mb-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-800 hover:text-purple-700">
                    {cat.sa103Box}: {cat.category} — £{cat.total.toFixed(2)}
                  </summary>
                  <div className="mt-2 ml-4 space-y-1">
                    {cat.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-gray-600 gap-2">
                        <span className="flex-1">{formatDate(item.date)} — {item.description}</span>
                        <Link
                          href="/business/expenses"
                          className="shrink-0 text-purple-600 hover:text-purple-700 underline"
                          title="View receipt/evidence"
                        >
                          📎
                        </Link>
                        <span className="font-medium shrink-0">£{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* Notes and warnings */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Important Notes</h3>
            <ul className="space-y-1.5">
              {summary.notes.map((note, idx) => (
                <li key={idx} className="text-xs text-amber-800 flex gap-2">
                  <span className="shrink-0">⚠️</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Invoices Paid" value={summary.totalInvoicesPaid.toString()} />
            <StatCard label="Invoices Unpaid" value={summary.totalInvoicesUnpaid.toString()} />
            <StatCard label="Total Income" value={`£${summary.box9_turnover.toFixed(2)}`} />
            <StatCard label="Net Profit" value={`£${summary.box21_netProfit.toFixed(2)}`} color={summary.box21_netProfit >= 0 ? 'green' : 'red'} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helper Components ───────────────────────────────────────────────────────

function SA103Box({
  boxNumber,
  label,
  amount,
  breakdown,
  highlight,
}: {
  boxNumber: number
  label: string
  amount: number
  breakdown?: Array<{ description: string; amount: number }>
  highlight?: boolean
}) {
  return (
    <div className={`flex items-start gap-3 py-2 ${highlight ? '' : 'border-b border-gray-100 last:border-0'}`}>
      <span className={`shrink-0 flex h-7 w-10 items-center justify-center rounded text-xs font-bold ${
        highlight ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
      }`}>
        {boxNumber}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${highlight ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{label}</p>
        {breakdown && breakdown.length > 0 && (
          <details className="mt-1">
            <summary className="text-[10px] text-purple-600 cursor-pointer hover:text-purple-700">
              View breakdown ({breakdown.length} items)
            </summary>
            <div className="mt-1 space-y-0.5 ml-2">
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[10px] text-gray-500">
                  <span className="truncate mr-2">{item.description}</span>
                  <span>£{item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
      <span className={`shrink-0 font-mono text-sm font-bold ${
        highlight ? 'text-purple-700' : amount > 0 ? 'text-gray-900' : 'text-gray-400'
      }`}>
        £{amount.toFixed(2)}
      </span>
    </div>
  )
}

function ManualBox({ boxNumber, label }: { boxNumber: number; label: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="shrink-0 flex h-6 w-9 items-center justify-center rounded bg-gray-50 text-[10px] font-bold text-gray-500">
        {boxNumber}
      </span>
      <p className="text-xs text-gray-600 flex-1">{label}</p>
      <span className="shrink-0 text-[10px] text-gray-400 italic">manual</span>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${
        color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-700' : 'text-gray-900'
      }`}>
        {value}
      </p>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
