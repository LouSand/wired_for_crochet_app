import type { DashboardMetrics } from '@/types/business'
import { formatCurrency } from '@/lib/currency'

interface DashboardSummaryProps {
  metrics: DashboardMetrics
  currency?: string
}

export default function DashboardSummary({ metrics, currency = 'GBP' }: DashboardSummaryProps) {
  const profitPositive = metrics.profit_or_loss >= 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Expenses</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {formatCurrency(metrics.total_expenses, currency)}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Revenue</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {formatCurrency(metrics.total_revenue, currency)}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {profitPositive ? 'Profit' : 'Loss'}
        </p>
        <p className={`mt-2 text-2xl font-bold ${profitPositive ? 'text-green-700' : 'text-red-700'}`}>
          {profitPositive ? '+' : '-'}{formatCurrency(Math.abs(metrics.profit_or_loss), currency)}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Stock Value</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {formatCurrency(metrics.total_stock_value, currency)}
        </p>
      </div>
    </div>
  )
}
