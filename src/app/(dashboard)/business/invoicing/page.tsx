import Link from 'next/link'
import { getInvoices, checkOverdueInvoices } from '@/lib/actions/invoices'
import { getQuotes } from '@/lib/actions/quotes'

export default async function InvoicingDashboardPage() {
  // Check overdue statuses
  await checkOverdueInvoices()

  const [{ data: invoices }, { data: quotes }] = await Promise.all([
    getInvoices(),
    getQuotes(),
  ])

  const allInvoices = invoices ?? []
  const allQuotes = quotes ?? []

  // Calculate metrics
  const totalOutstanding = allInvoices
    .filter((inv) => ['unpaid', 'partial', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amount_paid)), 0)

  const totalOverdue = allInvoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amount_paid)), 0)

  const overdueCount = allInvoices.filter((inv) => inv.status === 'overdue').length

  const recentInvoices = allInvoices.slice(0, 5)
  const recentQuotes = allQuotes.slice(0, 5)

  const draftInvoices = allInvoices.filter((inv) => inv.status === 'draft').length
  const draftQuotes = allQuotes.filter((q) => q.status === 'draft').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoicing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your invoices, quotes, and payments.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/business/invoicing/invoices/new"
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            + New Invoice
          </Link>
          <Link
            href="/business/invoicing/quotes/new"
            className="inline-flex items-center rounded-md border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            + New Quote
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">£{totalOutstanding.toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {allInvoices.filter((i) => ['unpaid', 'partial', 'overdue'].includes(i.status)).length} invoices
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-red-600">Overdue</p>
          <p className="mt-2 text-2xl font-bold text-red-700">£{totalOverdue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-red-500">{overdueCount} invoices</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Draft Invoices</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{draftInvoices}</p>
          <p className="mt-1 text-xs text-gray-500">Ready to send</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Draft Quotes</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{draftQuotes}</p>
          <p className="mt-1 text-xs text-gray-500">Ready to send</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/business/invoicing/invoices"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
        >
          <h3 className="font-medium text-gray-900">All Invoices</h3>
          <p className="mt-1 text-sm text-gray-500">{allInvoices.length} total</p>
        </Link>
        <Link
          href="/business/invoicing/quotes"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
        >
          <h3 className="font-medium text-gray-900">All Quotes</h3>
          <p className="mt-1 text-sm text-gray-500">{allQuotes.length} total</p>
        </Link>
        <Link
          href="/business/invoicing/settings"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
        >
          <h3 className="font-medium text-gray-900">Business Profile</h3>
          <p className="mt-1 text-sm text-gray-500">Logo, bank details, contact info</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
            <Link href="/business/invoicing/invoices" className="text-xs text-purple-600 hover:text-purple-700">
              View all →
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500">No invoices yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/business/invoicing/invoices/${inv.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-500">{inv.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">£{Number(inv.total).toFixed(2)}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Quotes */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Quotes</h2>
            <Link href="/business/invoicing/quotes" className="text-xs text-purple-600 hover:text-purple-700">
              View all →
            </Link>
          </div>
          {recentQuotes.length === 0 ? (
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500">No quotes yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentQuotes.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/business/invoicing/quotes/${q.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{q.quote_number}</p>
                      <p className="text-xs text-gray-500">{q.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">£{Number(q.total).toFixed(2)}</p>
                      <QuoteStatusBadge status={q.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    unpaid: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

function QuoteStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}
