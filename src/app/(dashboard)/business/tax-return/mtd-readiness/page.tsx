'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  checkMTDEligibility,
  getQuarterlyUpdates,
  generateQuarterlyUpdates,
  checkDigitalRecords,
  type MTDEligibility,
  type QuarterlyUpdate,
  type DigitalRecordsCheck,
} from '@/lib/actions/mtd-readiness'

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  draft: 'bg-amber-100 text-amber-700',
  ready: 'bg-green-100 text-green-700',
  submitted_manually: 'bg-blue-100 text-blue-700',
  locked: 'bg-purple-100 text-purple-700',
}

export default function MTDReadinessPage() {
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [eligibility, setEligibility] = useState<MTDEligibility | null>(null)
  const [quarters, setQuarters] = useState<QuarterlyUpdate[]>([])
  const [records, setRecords] = useState<DigitalRecordsCheck | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [taxYear])

  const loadData = async () => {
    setLoading(true)
    const [eligResult, quartersResult, recordsResult] = await Promise.all([
      checkMTDEligibility(),
      getQuarterlyUpdates(taxYear),
      checkDigitalRecords(taxYear),
    ])
    if (eligResult.data) setEligibility(eligResult.data)
    setQuarters(quartersResult.data)
    if (recordsResult.data) setRecords(recordsResult.data)
    setLoading(false)
  }

  const handleGenerateQuarters = async () => {
    await generateQuarterlyUpdates(taxYear)
    await loadData()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/business/tax-return" className="text-sm text-purple-600 hover:text-purple-700">← Back to Tax Return</Link>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/business/tax-return" className="text-sm text-purple-600 hover:text-purple-700">← Back to Tax Return</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Making Tax Digital Readiness</h1>
        <p className="mt-1 text-sm text-gray-600">
          Prepare for HMRC&apos;s Making Tax Digital for Income Tax. Check your eligibility, track quarterly updates, and ensure your records are complete.
        </p>
      </div>

      {/* MTD Eligibility */}
      {eligibility && (
        <div className={`rounded-xl border-2 p-5 ${eligibility.isRequired ? 'border-amber-300 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{eligibility.isRequired ? '⚠️' : '✅'}</span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">MTD Status</h2>
              <p className="mt-1 text-sm text-gray-700">{eligibility.message}</p>
              {eligibility.qualifyingIncome === null && (
                <Link href="/business/tax-return" className="mt-2 inline-flex text-xs text-purple-600 hover:text-purple-700 font-medium">
                  Set qualifying income in Settings →
                </Link>
              )}
            </div>
          </div>

          {/* Thresholds table */}
          <div className="mt-4 rounded-lg bg-white/60 p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">MTD Income Thresholds</p>
            <div className="space-y-1">
              {eligibility.thresholds.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{t.description}</span>
                  <span className={`font-medium ${eligibility.qualifyingIncome && eligibility.qualifyingIncome > t.threshold_amount ? 'text-red-700' : 'text-gray-500'}`}>
                    £{t.threshold_amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tax year selector + generate */}
      <div className="flex items-center gap-3">
        <select
          value={taxYear}
          onChange={(e) => setTaxYear(parseInt(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={2027}>2026/27</option>
          <option value={2026}>2025/26</option>
          <option value={2025}>2024/25</option>
        </select>
        <button
          type="button"
          onClick={handleGenerateQuarters}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 min-h-[38px]"
        >
          Generate / Refresh Quarters
        </button>
      </div>

      {/* Quarterly Updates */}
      {quarters.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Quarterly Updates — {taxYear - 1}/{taxYear.toString().slice(2)}</h3>
          <div className="space-y-3">
            {quarters.map((q) => (
              <div key={q.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Quarter {q.quarter}</p>
                    <p className="text-xs text-gray-500">{formatDate(q.period_start)} — {formatDate(q.period_end)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[q.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {q.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Due: {formatDate(q.deadline)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded bg-green-50 p-2">
                    <p className="text-[10px] text-gray-500">Income</p>
                    <p className="text-sm font-bold text-green-700">£{q.income.toFixed(2)}</p>
                  </div>
                  <div className="rounded bg-red-50 p-2">
                    <p className="text-[10px] text-gray-500">Expenses</p>
                    <p className="text-sm font-bold text-red-700">£{q.expenses.toFixed(2)}</p>
                  </div>
                  <div className="rounded bg-purple-50 p-2">
                    <p className="text-[10px] text-gray-500">Profit</p>
                    <p className="text-sm font-bold text-purple-700">£{q.profit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digital Records Completeness */}
      {records && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Digital Records Completeness</h3>
            <span className={`text-lg font-bold ${records.completionPercent === 100 ? 'text-green-700' : 'text-amber-700'}`}>
              {records.completionPercent}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-3">
            <div
              className={`h-full rounded-full ${records.completionPercent === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${records.completionPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {records.completeRecords} of {records.totalRecords} records have all required fields (date, amount, category, description)
          </p>

          {records.incompleteRecords.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs font-medium text-amber-700 hover:text-amber-800">
                {records.incompleteRecords.length} record(s) need attention
              </summary>
              <div className="mt-2 space-y-1.5 max-h-[200px] overflow-y-auto">
                {records.incompleteRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded bg-amber-50 p-2 text-xs">
                    <span className="text-gray-700">[{r.type}] {r.description}</span>
                    <span className="text-amber-700 shrink-0 ml-2">{r.issue}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Future HMRC Connection */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-2">HMRC Connection</h3>
        <p className="text-sm text-gray-600">
          Direct submission to HMRC will be available in a future update once vendor approval is obtained.
          For now, use the quarterly summaries to manually enter figures into HMRC&apos;s online service.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex h-3 w-3 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-500">Not connected — future feature</span>
        </div>
      </div>
    </div>
  )
}
