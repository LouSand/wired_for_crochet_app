'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getUCPeriods,
  createUCPeriod,
  autoGenerateUCPeriods,
  updateUCPeriodStatus,
  getUCPeriodSummary,
  importInvoicesToUC,
  importExpensesToUC,
  addUCIncome,
  addUCExpense,
  deleteUCIncome,
  deleteUCExpense,
} from '@/lib/actions/universal-credit'
import type { UCReportingPeriod, UCPeriodSummary, UCPeriodStatus } from '@/types/universal-credit'
import { UC_EXPENSE_CATEGORIES, UC_PAYMENT_METHODS } from '@/types/universal-credit'

const STATUS_COLORS: Record<UCPeriodStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ready_to_review: 'bg-amber-100 text-amber-700',
  submitted: 'bg-green-100 text-green-700',
  locked: 'bg-blue-100 text-blue-700',
}

export default function UniversalCreditPage() {
  const [periods, setPeriods] = useState<UCReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [summary, setSummary] = useState<UCPeriodSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewPeriod, setShowNewPeriod] = useState(false)
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => { loadPeriods() }, [])

  const loadPeriods = async () => {
    setLoading(true)
    const { data } = await getUCPeriods()
    setPeriods(data)
    setLoading(false)
  }

  const loadSummary = async (periodId: string) => {
    setSelectedPeriod(periodId)
    const { data } = await getUCPeriodSummary(periodId)
    setSummary(data)
  }

  const handleAutoGenerate = async () => {
    const { created } = await autoGenerateUCPeriods(3)
    setActionMessage(`Created ${created} reporting period(s)`)
    await loadPeriods()
    setTimeout(() => setActionMessage(null), 3000)
  }

  const handleCreatePeriod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const { error } = await createUCPeriod(formData)
    if (!error) {
      setShowNewPeriod(false)
      await loadPeriods()
    }
  }

  const handleStatusChange = async (periodId: string, status: UCPeriodStatus) => {
    await updateUCPeriodStatus(periodId, status)
    await loadPeriods()
    if (selectedPeriod === periodId) await loadSummary(periodId)
  }

  const handleImportInvoices = async () => {
    if (!selectedPeriod) return
    const { imported } = await importInvoicesToUC(selectedPeriod)
    setActionMessage(`Imported ${imported} payment(s) as income`)
    await loadSummary(selectedPeriod)
    setTimeout(() => setActionMessage(null), 3000)
  }

  const handleImportExpenses = async () => {
    if (!selectedPeriod) return
    const { imported } = await importExpensesToUC(selectedPeriod)
    setActionMessage(`Imported ${imported} expense(s)`)
    await loadSummary(selectedPeriod)
    setTimeout(() => setActionMessage(null), 3000)
  }

  const handleAddIncome = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('period_id', selectedPeriod!)
    await addUCIncome(formData)
    setShowAddIncome(false)
    await loadSummary(selectedPeriod!)
  }

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('period_id', selectedPeriod!)
    await addUCExpense(formData)
    setShowAddExpense(false)
    await loadSummary(selectedPeriod!)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/business" className="text-sm text-purple-600 hover:text-purple-700">← Back to Business</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Universal Credit Reporting</h1>
        <p className="mt-1 text-sm text-gray-600">
          Prepare your monthly self-employment income and expenses for UC reporting.
        </p>
      </div>

      {actionMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{actionMessage}</div>
      )}

      {/* Period management */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Reporting Periods</h2>
          <div className="flex gap-2">
            <button type="button" onClick={handleAutoGenerate} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 min-h-[32px]">
              Auto-generate 3 months
            </button>
            <button type="button" onClick={() => setShowNewPeriod(!showNewPeriod)} className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 min-h-[32px]">
              + New Period
            </button>
          </div>
        </div>

        {showNewPeriod && (
          <form onSubmit={handleCreatePeriod} className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Start Date</label>
              <input type="date" name="period_start" required className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">End Date</label>
              <input type="date" name="period_end" required className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Due Date</label>
              <input type="date" name="submission_due" required className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700 min-h-[34px]">Create</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : periods.length === 0 ? (
          <p className="text-sm text-gray-500">No reporting periods yet. Create one or auto-generate.</p>
        ) : (
          <div className="space-y-2">
            {periods.map((period) => (
              <button
                key={period.id}
                type="button"
                onClick={() => loadSummary(period.id)}
                className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors min-h-[48px] ${
                  selectedPeriod === period.id ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(period.period_start)} — {formatDate(period.period_end)}
                  </p>
                  <p className="text-xs text-gray-500">Due: {formatDate(period.submission_due)}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[period.status]}`}>
                  {period.status.replace(/_/g, ' ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Period Summary Dashboard */}
      {summary && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard label="Income Received" value={`£${summary.totalIncome.toFixed(2)}`} color="green" />
            <SummaryCard label="Allowable Expenses" value={`£${summary.totalExpenses.toFixed(2)}`} color="red" />
            <SummaryCard label="Estimated Profit" value={`£${summary.estimatedProfit.toFixed(2)}`} color={summary.estimatedProfit >= 0 ? 'purple' : 'red'} />
            <SummaryCard label="Evidence Complete" value={`${summary.evidenceCompletionPercent}%`} color={summary.evidenceCompletionPercent === 100 ? 'green' : 'amber'} />
          </div>

          {/* Warnings */}
          {summary.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Attention Needed</h3>
              <ul className="space-y-1">
                {summary.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-800">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing evidence checklist */}
          {summary.missingEvidence.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-2">Missing Evidence</h3>
              <ul className="space-y-1.5">
                {summary.missingEvidence.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-xs text-red-800">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.type}
                    </span>
                    {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleImportInvoices} className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 min-h-[36px]">
              Import Payments from Invoices
            </button>
            <button type="button" onClick={handleImportExpenses} className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 min-h-[36px]">
              Import from Business Expenses
            </button>
            <button type="button" onClick={() => setShowAddIncome(true)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 min-h-[36px]">
              + Add Income
            </button>
            <button type="button" onClick={() => setShowAddExpense(true)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 min-h-[36px]">
              + Add Expense
            </button>
          </div>

          {/* Add Income Form */}
          {showAddIncome && (
            <form onSubmit={handleAddIncome} className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-green-900">Add Income</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="number" name="amount" step="0.01" required placeholder="Amount (£)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input type="date" name="date_received" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input type="text" name="source" required placeholder="Source (e.g. customer name)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <select name="payment_method" className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Payment method...</option>
                  {UC_PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <textarea name="notes" placeholder="Notes (optional)" rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Add</button>
                <button type="button" onClick={() => setShowAddIncome(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          )}

          {/* Add Expense Form */}
          {showAddExpense && (
            <form onSubmit={handleAddExpense} className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-red-900">Add Expense</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="number" name="amount" step="0.01" required placeholder="Amount (£)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input type="date" name="date_incurred" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input type="text" name="description" required placeholder="Description" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <select name="category" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Category...</option>
                  {UC_EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
                <input type="text" name="supplier" placeholder="Supplier (optional)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <textarea name="notes" placeholder="Notes (optional)" rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Add</button>
                <button type="button" onClick={() => setShowAddExpense(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          )}

          {/* Income list */}
          {summary.incomeEntries.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Income Received</h3>
              <div className="space-y-2">
                {summary.incomeEntries.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inc.source}</p>
                      <p className="text-xs text-gray-500">{formatDate(inc.date_received)} {inc.payment_method && `• ${inc.payment_method.replace(/_/g, ' ')}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-700">£{inc.amount.toFixed(2)}</span>
                      <button type="button" onClick={async () => { await deleteUCIncome(inc.id); await loadSummary(selectedPeriod!) }} className="text-xs text-red-500 hover:text-red-700">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense list */}
          {summary.expenseEntries.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Expenses</h3>
              <div className="space-y-2">
                {summary.expenseEntries.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{exp.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(exp.date_incurred)} • {exp.category.replace(/_/g, ' ')} {exp.supplier && `• ${exp.supplier}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-700">£{exp.amount.toFixed(2)}</span>
                      <button type="button" onClick={async () => { await deleteUCExpense(exp.id); await loadSummary(selectedPeriod!) }} className="text-xs text-red-500 hover:text-red-700">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status controls */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Period Status</h3>
            <div className="flex flex-wrap gap-2">
              {summary.period.status === 'draft' && (
                <button type="button" onClick={() => handleStatusChange(summary.period.id, 'ready_to_review')} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 min-h-[40px]">
                  Mark Ready to Review
                </button>
              )}
              {summary.period.status === 'ready_to_review' && (
                <>
                  <button type="button" onClick={() => handleStatusChange(summary.period.id, 'submitted')} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 min-h-[40px]">
                    Mark as Submitted
                  </button>
                  <button type="button" onClick={() => handleStatusChange(summary.period.id, 'draft')} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 min-h-[40px]">
                    Back to Draft
                  </button>
                </>
              )}
              {summary.period.status === 'submitted' && (
                <button type="button" onClick={() => handleStatusChange(summary.period.id, 'locked')} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 min-h-[40px]">
                  Lock Period
                </button>
              )}
              {summary.period.status === 'locked' && (
                <p className="text-sm text-blue-700 font-medium">🔒 This period is locked and cannot be edited.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-700',
    red: 'text-red-700',
    purple: 'text-purple-700',
    amber: 'text-amber-700',
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${colorClasses[color] ?? 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
