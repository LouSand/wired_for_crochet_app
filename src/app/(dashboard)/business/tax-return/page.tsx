'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  generateTaxSummary,
  getTaxConfig,
  updateTaxConfig,
  calculateTaxEstimate,
  getEvidenceStatus,
  getChecklist,
  saveChecklist,
  type SA103Summary,
} from '@/lib/actions/tax-summary'
import type { TaxConfig, TaxEstimate, EvidenceStatus, YearEndChecklist, TaxYearStatus } from '@/types/tax'
import { CHECKLIST_ITEMS } from '@/types/tax'

export default function TaxReturnPage() {
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<SA103Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<TaxConfig | null>(null)
  const [taxEstimate, setTaxEstimate] = useState<TaxEstimate | null>(null)
  const [evidence, setEvidence] = useState<EvidenceStatus | null>(null)
  const [checklist, setChecklist] = useState<YearEndChecklist | null>(null)
  const [checklistStatus, setChecklistStatus] = useState<TaxYearStatus>('draft')
  const [activeTab, setActiveTab] = useState<'summary' | 'estimate' | 'evidence' | 'checklist' | 'settings'>('summary')

  // Load tax config on mount
  useEffect(() => {
    async function loadConfig() {
      const { data } = await getTaxConfig()
      if (data) setConfig(data)
    }
    loadConfig()
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    const [summaryResult, estimateResult, evidenceResult, checklistResult] = await Promise.all([
      generateTaxSummary(taxYear),
      calculateTaxEstimate(taxYear),
      getEvidenceStatus(taxYear),
      getChecklist(taxYear),
    ])
    if (summaryResult.error) setError(summaryResult.error)
    else setSummary(summaryResult.data)
    if (estimateResult.data) setTaxEstimate(estimateResult.data)
    if (evidenceResult.data) setEvidence(evidenceResult.data)
    if (checklistResult.data) {
      setChecklist(checklistResult.data.checklist)
      setChecklistStatus(checklistResult.data.status)
    }
    setLoading(false)
  }

  const handleSaveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await updateTaxConfig(formData)
    const { data } = await getTaxConfig()
    if (data) setConfig(data)
  }

  const handleChecklistChange = async (key: keyof YearEndChecklist, value: 'done' | 'not_done' | 'not_applicable') => {
    if (!checklist) return
    const updated = { ...checklist, [key]: value }
    setChecklist(updated)
    await saveChecklist(taxYear, updated, checklistStatus)
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

        {/* Accounting basis indicator */}
        {config && (
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              config.accounting_basis === 'cash' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {config.accounting_basis === 'cash' ? 'Cash Basis' : 'Traditional Accounting'}
            </span>
            <button type="button" onClick={() => setActiveTab('settings')} className="text-xs text-gray-500 hover:text-purple-600">
              Change →
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {summary && (
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Tax return sections">
            {[
              { id: 'summary' as const, label: 'SA103 Summary' },
              { id: 'estimate' as const, label: 'Tax Estimate' },
              { id: 'evidence' as const, label: 'Evidence' },
              { id: 'checklist' as const, label: 'Year-End Checklist' },
              { id: 'settings' as const, label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors min-h-[40px] ${
                  activeTab === tab.id
                    ? 'bg-white border border-b-0 border-gray-200 text-purple-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.id === 'evidence' && evidence && evidence.completionPercent < 100 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-700">!</span>
                )}
                {tab.id === 'checklist' && checklist && (
                  <span className="ml-1.5 text-[10px] text-gray-400">
                    {Object.values(checklist).filter((v) => v === 'done').length}/{Object.values(checklist).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab: Tax Estimate */}
      {summary && activeTab === 'estimate' && taxEstimate && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-800">
              ⚠️ <strong>Estimates only</strong> — These figures are approximate and do not constitute financial advice.
              They assume self-employment is your only income source. Consult an accountant for accurate figures.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
              <p className="text-xs text-gray-500">Taxable Profit</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">£{taxEstimate.taxableProfit.toFixed(2)}</p>
              <p className="text-[10px] text-gray-400">After personal allowance: £{taxEstimate.taxableAfterAllowance.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
              <p className="text-xs text-gray-500">Estimated Income Tax</p>
              <p className="mt-1 text-2xl font-bold text-red-700">£{taxEstimate.incomeTax.total.toFixed(2)}</p>
              <div className="mt-1 text-[10px] text-gray-400 space-y-0.5">
                <p>Basic rate (20%): £{taxEstimate.incomeTax.basicRate.toFixed(2)}</p>
                {taxEstimate.incomeTax.higherRate > 0 && <p>Higher rate (40%): £{taxEstimate.incomeTax.higherRate.toFixed(2)}</p>}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
              <p className="text-xs text-gray-500">Estimated National Insurance</p>
              <p className="mt-1 text-2xl font-bold text-red-700">£{taxEstimate.nationalInsurance.total.toFixed(2)}</p>
              <div className="mt-1 text-[10px] text-gray-400 space-y-0.5">
                <p>Class 2: £{taxEstimate.nationalInsurance.class2.toFixed(2)}</p>
                <p>Class 4: £{taxEstimate.nationalInsurance.class4.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5 text-center">
            <p className="text-xs text-gray-500">Estimated Total Tax Due</p>
            <p className="mt-1 text-3xl font-bold text-red-800">£{taxEstimate.totalTaxDue.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">Effective rate: {taxEstimate.effectiveRate}%</p>
          </div>
        </div>
      )}

      {/* Tab: Evidence */}
      {summary && activeTab === 'evidence' && evidence && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Evidence Completeness</h3>
              <span className={`text-lg font-bold ${evidence.completionPercent === 100 ? 'text-green-700' : 'text-amber-700'}`}>
                {evidence.completionPercent}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${evidence.completionPercent === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${evidence.completionPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {evidence.expensesWithEvidence} of {evidence.totalExpenses} expenses have receipts •
              {evidence.incomeWithEvidence} of {evidence.totalIncome} income entries verified
            </p>
          </div>

          {evidence.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              {evidence.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-800">⚠️ {w}</p>
              ))}
            </div>
          )}

          {evidence.expensesWithoutEvidence.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Expenses Missing Receipts</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {evidence.expensesWithoutEvidence.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between rounded-lg bg-red-50 p-2.5 text-xs">
                    <span className="text-gray-700">{formatDate(exp.date)} — {exp.description}</span>
                    <span className="font-medium text-red-700">£{exp.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Link href="/business/expenses" className="mt-3 inline-flex text-xs text-purple-600 hover:text-purple-700 font-medium">
                Go to Expenses to add receipts →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab: Year-End Checklist */}
      {summary && activeTab === 'checklist' && checklist && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Year-End Checklist</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                checklistStatus === 'ready' ? 'bg-green-100 text-green-700' :
                checklistStatus === 'exported' ? 'bg-blue-100 text-blue-700' :
                checklistStatus === 'needs_review' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {checklistStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => (
                <div key={item.key} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                  <select
                    value={checklist[item.key]}
                    onChange={(e) => handleChecklistChange(item.key, e.target.value as 'done' | 'not_done' | 'not_applicable')}
                    className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium min-h-[28px] ${
                      checklist[item.key] === 'done' ? 'border-green-300 bg-green-50 text-green-700' :
                      checklist[item.key] === 'not_applicable' ? 'border-gray-200 bg-gray-50 text-gray-500' :
                      'border-amber-300 bg-amber-50 text-amber-700'
                    }`}
                  >
                    <option value="not_done">To Do</option>
                    <option value="done">Done ✓</option>
                    <option value="not_applicable">N/A</option>
                  </select>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.help}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tax Settings</h3>
          <form onSubmit={handleSaveConfig} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700">Accounting Basis</label>
              <select name="accounting_basis" defaultValue={config?.accounting_basis ?? 'cash'} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="cash">Cash Basis (recommended for most small businesses)</option>
                <option value="traditional">Traditional Accounting (accruals)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Cash basis: only count money actually received/paid. Simpler for most self-employed.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Personal Allowance (£)</label>
              <input type="number" name="personal_allowance" step="0.01" defaultValue={config?.personal_allowance ?? 12570} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-gray-500">Current default: £12,570 (2024/25). Reduced if total income exceeds £100,000.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Qualifying Income for MTD (£)</label>
              <input type="number" name="qualifying_income" step="0.01" defaultValue={config?.qualifying_income ?? ''} placeholder="Enter your estimated annual income" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-gray-500">Used to check if you need Making Tax Digital. Leave blank if unsure.</p>
            </div>
            <button type="submit" className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 min-h-[40px]">
              Save Settings
            </button>
          </form>
        </div>
      )}

      {/* SA103 Summary */}
      {summary && activeTab === 'summary' && (
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
            <a
              href={`/api/accountant-pack/${taxYear}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 min-h-[40px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Accountant Pack (CSVs)
            </a>
            <Link
              href="/business/tax-return/mtd-readiness"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[40px]"
            >
              MTD Readiness →
            </Link>
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
