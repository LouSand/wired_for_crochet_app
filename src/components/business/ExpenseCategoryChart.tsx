import type { ExpenseCategory } from '@/types/business'

interface ExpenseCategoryChartProps {
  categoryBreakdown: Array<{ category: ExpenseCategory; total: number }>
}

export default function ExpenseCategoryChart({ categoryBreakdown }: ExpenseCategoryChartProps) {
  if (categoryBreakdown.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
        <p className="text-sm text-gray-500">No expense data available.</p>
      </div>
    )
  }

  const maxTotal = Math.max(...categoryBreakdown.map((c) => c.total))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>

      <div className="space-y-3">
        {categoryBreakdown.map((item) => {
          const percentage = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0
          const label = item.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

          return (
            <div key={item.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{label}</span>
                <span className="font-medium text-gray-900">${item.total.toFixed(2)}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-purple-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
